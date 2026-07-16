import { db } from '../database/core/core-db.js';
import {
  refundTable,
  transactionTable,
  walletTable,
  transactionEarningsTable,
  usersTable,
  roleTable,
  tenantsTable,
  employeesTable,
} from '../models/core/index.js';
import { and, eq, inArray, gte, lte, desc, asc, sql } from 'drizzle-orm';
import { ApiError } from '../lib/ApiError.js';
import WalletService from './wallet.service.js';
import LedgerService from './ledger.service.js';
import crypto from 'crypto';

const ROLE_HIERARCHY = {
  AZZUNIQUE: { canView: ['RESELLER'], viewOwnOnly: false },
  RESELLER: { canView: ['WHITE_LABEL'], viewOwnOnly: false },
  WHITE_LABEL: {
    canView: ['STATE_HEAD', 'MASTER_DISTRIBUTOR', 'DISTRIBUTOR', 'RETAILER'],
    viewOwnOnly: false,
  },
  STATE_HEAD: { canView: [], viewOwnOnly: true },
  MASTER_DISTRIBUTOR: { canView: [], viewOwnOnly: true },
  DISTRIBUTOR: { canView: [], viewOwnOnly: true },
  RETAILER: { canView: [], viewOwnOnly: true },
};

const LEAF_ROLES = [
  'STATE_HEAD',
  'MASTER_DISTRIBUTOR',
  'DISTRIBUTOR',
  'RETAILER',
];

class RefundService {
  // ==================== INITIATE REFUND ====================

  static async initiateRefund({
    tenantId,
    transactionId,
    amount,
    reason,
    initiatedByUserId,
    refundReference = null,
    refundFees = true,
  }) {
    return await db.transaction(async (tx) => {
      // Get transaction details
      const [transaction] = await tx
        .select()
        .from(transactionTable)
        .where(
          and(
            eq(transactionTable.id, transactionId),
            eq(transactionTable.tenantId, tenantId),
          ),
        )
        .limit(1);

      if (!transaction) {
        throw ApiError.notFound('Transaction not found');
      }

      // Validate transaction status
      if (transaction.status !== 'SUCCESS') {
        throw ApiError.badRequest(
          'Only successful transactions can be refunded',
        );
      }

      // Check if refund already exists
      const [existingRefund] = await tx
        .select()
        .from(refundTable)
        .where(
          and(
            eq(refundTable.transactionId, transactionId),
            eq(refundTable.status, 'COMPLETED'),
          ),
        )
        .limit(1);

      if (existingRefund) {
        throw ApiError.badRequest('Transaction already refunded');
      }

      // Calculate total refundable amount
      const [earnings] = await tx
        .select({
          totalCommission: sql`SUM(CASE WHEN ${transactionEarningsTable.mode} = 'COMMISSION' THEN ${transactionEarningsTable.finalAmount} ELSE 0 END)`,
          totalSurcharge: sql`SUM(CASE WHEN ${transactionEarningsTable.mode} = 'SURCHARGE' THEN ${transactionEarningsTable.finalAmount} ELSE 0 END)`,
        })
        .from(transactionEarningsTable)
        .where(eq(transactionEarningsTable.transactionId, transactionId));

      const totalCharged = Number(transaction.amount);
      const totalCommission = Number(earnings?.totalCommission || 0);
      const totalSurcharge = Number(earnings?.totalSurcharge || 0);

      let refundAmount = amount;
      let feeRefund = 0;
      let gstRefund = 0;

      if (refundFees) {
        // Calculate proportional fee refund
        const refundRatio = amount / totalCharged;
        feeRefund = Math.floor(totalCommission * refundRatio);
        gstRefund = Math.floor(totalSurcharge * refundRatio);
        refundAmount = amount + feeRefund + gstRefund;
      }

      // Check wallet balance for refund
      const [wallet] = await tx
        .select()
        .from(walletTable)
        .where(eq(walletTable.id, transaction.walletId))
        .limit(1);

      if (!wallet || wallet.balance < refundAmount) {
        throw ApiError.badRequest('Insufficient wallet balance for refund');
      }

      // Create refund record
      const refundId = crypto.randomUUID();
      const finalRefundReference =
        refundReference || `REF-${transaction.txnId}-${Date.now()}`;

      await tx.insert(refundTable).values({
        id: refundId,
        tenantId,
        transactionId,
        walletId: transaction.walletId,
        refundReference: finalRefundReference,
        amount: refundAmount,
        feeAmount: feeRefund,
        gstAmount: gstRefund,
        status: 'PENDING',
        reason,
        initiatedByUserId,
        initiatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return {
        refundId,
        refundReference: finalRefundReference,
        refundAmount,
        originalAmount: amount,
        feeRefund,
        gstRefund,
      };
    });
  }

  // ==================== PROCESS REFUND ====================

  static async processRefund({
    refundId,
    tenantId,
    providerRefundId = null,
    providerResponse = null,
  }) {
    return await db.transaction(async (tx) => {
      // Get refund details
      const [refund] = await tx
        .select()
        .from(refundTable)
        .where(
          and(eq(refundTable.id, refundId), eq(refundTable.tenantId, tenantId)),
        )
        .limit(1);

      if (!refund) {
        throw ApiError.notFound('Refund not found');
      }

      if (refund.status !== 'PENDING') {
        throw ApiError.badRequest(
          `Refund cannot be processed. Current status: ${refund.status}`,
        );
      }

      // Update refund status
      await tx
        .update(refundTable)
        .set({
          status: 'PROCESSING',
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(refundTable.id, refundId));

      // Credit wallet with refund amount
      await WalletService.creditWallet({
        walletId: refund.walletId,
        amount: refund.amount,
        refundId: refund.id,
        reference: `REFUND_${refund.refundReference}`,
        tx,
      });

      // Update transaction status
      await tx
        .update(transactionTable)
        .set({
          status: 'REFUNDED',
          updatedAt: new Date(),
        })
        .where(eq(transactionTable.id, refund.transactionId));

      // Complete refund
      await tx
        .update(refundTable)
        .set({
          status: 'COMPLETED',
          providerRefundId,
          providerResponse,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(refundTable.id, refundId));

      return {
        success: true,
        refundId,
        amountRefunded: refund.amount,
      };
    });
  }

  // ==================== QUERY METHODS ====================

  static async getRefundById(refundId, tenantId) {
    const [refund] = await db
      .select()
      .from(refundTable)
      .where(
        and(eq(refundTable.id, refundId), eq(refundTable.tenantId, tenantId)),
      )
      .limit(1);

    return refund;
  }

  static async getRefundsByTransaction(transactionId, tenantId) {
    return await db
      .select()
      .from(refundTable)
      .where(
        and(
          eq(refundTable.transactionId, transactionId),
          eq(refundTable.tenantId, tenantId),
        ),
      )
      .orderBy(refundTable.createdAt);
  }

  static async getRefundsByWallet(walletId, tenantId, limit = 50, offset = 0) {
    return await db
      .select()
      .from(refundTable)
      .where(
        and(
          eq(refundTable.walletId, walletId),
          eq(refundTable.tenantId, tenantId),
        ),
      )
      .orderBy(refundTable.createdAt)
      .limit(limit)
      .offset(offset);
  }

  // Get refund summary for a tenant
  static async getRefundSummary(tenantId, startDate = null, endDate = null) {
    let query = db
      .select({
        status: refundTable.status,
        count: sql`COUNT(*)`,
        totalAmount: sql`SUM(${refundTable.amount})`,
        totalFeeRefund: sql`SUM(${refundTable.feeAmount})`,
        totalGstRefund: sql`SUM(${refundTable.gstAmount})`,
      })
      .from(refundTable)
      .where(eq(refundTable.tenantId, tenantId))
      .groupBy(refundTable.status);

    if (startDate) {
      query = query.where(sql`${refundTable.createdAt} >= ${startDate}`);
    }

    if (endDate) {
      query = query.where(sql`${refundTable.createdAt} <= ${endDate}`);
    }

    return await query;
  }

  // Cancel pending refund
  static async cancelRefund(refundId, tenantId, reason) {
    return await db.transaction(async (tx) => {
      const [refund] = await tx
        .select()
        .from(refundTable)
        .where(
          and(eq(refundTable.id, refundId), eq(refundTable.tenantId, tenantId)),
        )
        .limit(1);

      if (!refund) {
        throw ApiError.notFound('Refund not found');
      }

      if (refund.status !== 'PENDING') {
        throw ApiError.badRequest('Only pending refunds can be cancelled');
      }

      await tx
        .update(refundTable)
        .set({
          status: 'FAILED',
          reason: `${refund.reason || ''} | Cancelled: ${reason}`,
          updatedAt: new Date(),
        })
        .where(eq(refundTable.id, refundId));

      return { success: true };
    });
  }

  // ==================== GET ALL REFUNDS (with Role Hierarchy) ====================

  static async getAllRefunds({ actor, query }) {
    const {
      page = 1,
      limit = 20,
      status = 'ALL',
      fromDate,
      toDate,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 20;

    const offset = (pageNumber - 1) * limitNumber;
    // Validate actor
    if (!actor?.id) throw ApiError.unauthorized('Actor is required');

    // Get user with role
    let user = await this.getUserWithRole(actor.id);
    let roleCode = user?.role?.roleCode;
    let actorId = actor.id;

    // Handle EMPLOYEE actor (same pattern as TransactionService)
    if (actor.type === 'EMPLOYEE') {
      const empData = await this.validateEmployeeActor(actor);
      roleCode = empData.tenant?.userType;

      const [tenantOwner] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .leftJoin(roleTable, eq(usersTable.roleId, roleTable.id))
        .where(
          and(
            eq(usersTable.tenantId, empData.employee.tenantId),
            eq(roleTable.roleCode, roleCode),
          ),
        )
        .limit(1);

      if (!tenantOwner) throw ApiError.notFound('Tenant owner not found');
      actorId = tenantOwner.id;
    }

    if (!roleCode) throw ApiError.forbidden('Role not found');

    // Get visible user IDs based on role hierarchy
    const visibleUserIds = await this.getVisibleUserIds(
      { id: actorId },
      roleCode,
    );

    if (visibleUserIds.length === 0) {
      return {
        refunds: [],
        meta: {
          page,
          limit,
          totalRefunds: 0,
          totalPages: 0,
        },
      };
    }

    // Build conditions
    const conditions = [
      inArray(refundTable.initiatedByUserId, visibleUserIds),
      eq(refundTable.tenantId, user.tenantId),
    ];

    if (status && status !== 'ALL') {
      conditions.push(eq(refundTable.status, status));
    }

    if (fromDate) {
      conditions.push(gte(refundTable.createdAt, new Date(fromDate)));
    }

    if (toDate) {
      conditions.push(lte(refundTable.createdAt, new Date(toDate)));
    }

    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        sql`(
        ${refundTable.refundReference} LIKE ${searchTerm} OR
        ${refundTable.reason} LIKE ${searchTerm}
      )`,
      );
    }

    // Get total count
    const [countResult] = await db
      .select({ count: sql`COUNT(*)`.mapWith(Number) })
      .from(refundTable)
      .where(and(...conditions));

    // Get sort column
    const sortColumnMap = {
      createdAt: refundTable.createdAt,
      updatedAt: refundTable.updatedAt,
      amount: refundTable.amount,
      status: refundTable.status,
      initiatedAt: refundTable.initiatedAt,
      completedAt: refundTable.completedAt,
    };

    const sortColumn = sortColumnMap[sortBy] || refundTable.createdAt;
    const orderByClause =
      sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    // Fetch refunds with joins
    const refunds = await db
      .select({
        id: refundTable.id,
        tenantId: refundTable.tenantId,
        transactionId: refundTable.transactionId,
        walletId: refundTable.walletId,
        refundReference: refundTable.refundReference,
        amount: refundTable.amount,
        feeAmount: refundTable.feeAmount,
        gstAmount: refundTable.gstAmount,
        status: refundTable.status,
        reason: refundTable.reason,
        initiatedByUserId: refundTable.initiatedByUserId,
        initiatedAt: refundTable.initiatedAt,
        processedAt: refundTable.processedAt,
        completedAt: refundTable.completedAt,
        providerRefundId: refundTable.providerRefundId,
        providerResponse: refundTable.providerResponse,
        createdAt: refundTable.createdAt,
        updatedAt: refundTable.updatedAt,
        transaction: {
          txnId: transactionTable.txnId,
          amount: transactionTable.amount,
          status: transactionTable.status,
          serviceType: transactionTable.serviceType,
        },
        user: {
          id: usersTable.id,
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
          email: usersTable.email,
          mobileNumber: usersTable.mobileNumber,
        },
        role: {
          roleName: roleTable.roleName,
          roleCode: roleTable.roleCode,
        },
      })
      .from(refundTable)
      .leftJoin(
        transactionTable,
        eq(refundTable.transactionId, transactionTable.id),
      )
      .leftJoin(usersTable, eq(refundTable.initiatedByUserId, usersTable.id))
      .leftJoin(roleTable, eq(usersTable.roleId, roleTable.id))
      .where(and(...conditions))
      .orderBy(orderByClause)
      .limit(limitNumber)
      .offset(offset);

    return {
      refunds,
      meta: {
        page,
        limit,
        totalRefunds: countResult.count,
        totalPages: Math.ceil(countResult.count / limit),
      },
    };
  }

  // ========== HELPERS (same as TransactionService) ==========

  static async getUserWithRole(userId) {
    const [user] = await db
      .select({
        id: usersTable.id,
        tenantId: usersTable.tenantId,
        ownerUserId: usersTable.ownerUserId,
        roleId: usersTable.roleId,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        email: usersTable.email,
        mobileNumber: usersTable.mobileNumber,
        userStatus: usersTable.userStatus,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) return null;

    const [role] = await db
      .select({
        id: roleTable.id,
        roleName: roleTable.roleName,
        roleCode: roleTable.roleCode,
        roleLevel: roleTable.roleLevel,
      })
      .from(roleTable)
      .where(eq(roleTable.id, user.roleId))
      .limit(1);

    return { ...user, role };
  }

  static async validateEmployeeActor(actor) {
    if (actor.type !== 'EMPLOYEE') return null;

    const [employee] = await db
      .select({
        employeeStatus: employeesTable.employeeStatus,
        tenantId: employeesTable.tenantId,
      })
      .from(employeesTable)
      .where(eq(employeesTable.id, actor.id))
      .limit(1);

    if (!employee) throw ApiError.unauthorized('Employee not found');
    if (employee.employeeStatus !== 'ACTIVE')
      throw ApiError.forbidden('Employee not active');

    const [tenant] = await db
      .select({ userType: tenantsTable.userType })
      .from(tenantsTable)
      .where(eq(tenantsTable.id, employee.tenantId))
      .limit(1);

    const allowed = ['AZZUNIQUE', 'RESELLER', 'WHITE_LABEL'];
    if (!allowed.includes(tenant?.userType)) {
      throw ApiError.forbidden('Employee operations not allowed');
    }

    return { employee, tenant };
  }

  static async getVisibleUserIds(actor, roleCode) {
    const hierarchy = ROLE_HIERARCHY[roleCode];

    if (!hierarchy || hierarchy.viewOwnOnly || LEAF_ROLES.includes(roleCode)) {
      return [actor.id];
    }

    const allowedRoles = hierarchy.canView;
    if (!allowedRoles || allowedRoles.length === 0) {
      return [actor.id];
    }

    const roleRecords = await db
      .select({ id: roleTable.id, roleCode: roleTable.roleCode })
      .from(roleTable)
      .where(inArray(roleTable.roleCode, allowedRoles));

    const allowedRoleIds = roleRecords.map((r) => r.id);

    const directDownline = await db
      .select({
        id: usersTable.id,
        roleId: usersTable.roleId,
      })
      .from(usersTable)
      .where(
        and(
          eq(usersTable.ownerUserId, actor.id),
          eq(usersTable.userStatus, 'ACTIVE'),
          inArray(usersTable.roleId, allowedRoleIds),
        ),
      );

    const directIds = directDownline.map((u) => u.id);

    if (roleCode === 'WHITE_LABEL') {
      const nestedIds = await this.getAllNestedDownlineIds(directIds);
      return [...directIds, ...nestedIds];
    }

    return directIds;
  }

  static async getAllNestedDownlineIds(parentIds, depth = 0) {
    if (parentIds.length === 0 || depth > 10) return [];

    const children = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(
        and(
          inArray(usersTable.ownerUserId, parentIds),
          eq(usersTable.userStatus, 'ACTIVE'),
        ),
      );

    if (children.length === 0) return [];

    const childIds = children.map((c) => c.id);
    const nested = await this.getAllNestedDownlineIds(childIds, depth + 1);
    return [...childIds, ...nested];
  }
}

export default RefundService;
