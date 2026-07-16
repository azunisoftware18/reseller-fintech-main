// services/transaction.service.js
import { db } from '../database/core/core-db.js';
import {
  transactionTable,
  transactionEarningsTable,
  usersTable,
  roleTable,
  tenantsTable,
  employeesTable,
  ServiceTable,
  ServiceProviderMappingTable,
  ProviderTable,
} from '../models/core/index.js';
import { and, eq, inArray, gte, lte, desc, asc, sql } from 'drizzle-orm';
import { ApiError } from '../lib/ApiError.js';

// ========== ROLE HIERARCHY ==========
const ROLE_HIERARCHY = {
  AZZUNIQUE: {
    canView: ['RESELLER'],
    viewOwnOnly: false,
  },
  RESELLER: {
    canView: ['WHITE_LABEL'],
    viewOwnOnly: false,
  },
  WHITE_LABEL: {
    canView: ['STATE_HEAD', 'MASTER_DISTRIBUTOR', 'DISTRIBUTOR', 'RETAILER'],
    viewOwnOnly: false,
  },
  STATE_HEAD: {
    canView: [],
    viewOwnOnly: true,
  },
  MASTER_DISTRIBUTOR: {
    canView: [],
    viewOwnOnly: true,
  },
  DISTRIBUTOR: {
    canView: [],
    viewOwnOnly: true,
  },
  RETAILER: {
    canView: [],
    viewOwnOnly: true,
  },
};

const LEAF_ROLES = [
  'STATE_HEAD',
  'MASTER_DISTRIBUTOR',
  'DISTRIBUTOR',
  'RETAILER',
];

class TransactionService {
  // ========== HELPERS ==========

  async getUserWithRole(userId) {
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

  async validateEmployeeActor(actor) {
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

  async getVisibleUserIds(actor, roleCode) {
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

  async getAllNestedDownlineIds(parentIds, depth = 0) {
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

  // ========== TRANSACTION SPECIFIC METHODS ==========

  buildTransactionConditions(userIds, query) {
    const conditions = [inArray(transactionTable.userId, userIds)];

    if (query.status && query.status !== 'ALL') {
      conditions.push(eq(transactionTable.status, query.status));
    }

    if (query.serviceType && query.serviceType !== 'ALL') {
      conditions.push(eq(transactionTable.serviceType, query.serviceType));
    }

    if (query.fromDate) {
      conditions.push(
        gte(transactionTable.initiatedAt, new Date(query.fromDate)),
      );
    }

    if (query.toDate) {
      conditions.push(
        lte(transactionTable.initiatedAt, new Date(query.toDate)),
      );
    }

    if (query.search) {
      const searchTerm = `%${query.search}%`;
      conditions.push(
        sql`(
          ${transactionTable.txnId} LIKE ${searchTerm} OR 
          ${transactionTable.providerReference} LIKE ${searchTerm}
        )`,
      );
    }

    return conditions;
  }

  getTransactionSortColumn(sortBy, sortOrder) {
    const columnMap = {
      initiatedAt: transactionTable.initiatedAt,
      amount: transactionTable.amount,
      status: transactionTable.status,
      serviceType: transactionTable.serviceType,
    };

    const column = columnMap[sortBy] || transactionTable.initiatedAt;
    return sortOrder === 'asc' ? asc(column) : desc(column);
  }

  async getTransactions(actor, query) {
    if (!actor?.id) throw ApiError.unauthorized('Actor is required');

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const offset = (page - 1) * limit;

    let user = await this.getUserWithRole(actor.id);
    let roleCode = user?.role?.roleCode;
    let actorId = actor.id;

    // Handle EMPLOYEE actor
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

    const visibleUserIds = await this.getVisibleUserIds(
      { id: actorId },
      roleCode,
    );

    if (visibleUserIds.length === 0) {
      return {
        transactions: [],
        meta: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    const txnConditions = this.buildTransactionConditions(
      visibleUserIds,
      query,
    );

    const [txnCountResult] = await db
      .select({ count: sql`COUNT(*)`.mapWith(Number) })
      .from(transactionTable)
      .where(and(...txnConditions));

    const transactions = await db
      .select({
        id: transactionTable.id,
        tenantId: transactionTable.tenantId,
        txnId: transactionTable.txnId,
        amount: transactionTable.amount,
        netAmount: transactionTable.netAmount,
        status: transactionTable.status,
        serviceType: transactionTable.serviceType,
        serviceProviderMappingId: transactionTable.serviceProviderMappingId,
        pricing: transactionTable.pricing,
        userId: transactionTable.userId,
        walletId: transactionTable.walletId,
        apiEntityId: transactionTable.apiEntityId,
        providerReference: transactionTable.providerReference,
        providerResponse: transactionTable.providerResponse,
        initiatedAt: transactionTable.initiatedAt,
        processedAt: transactionTable.processedAt,
        completedAt: transactionTable.completedAt,
        serviceData: transactionTable.serviceData,
        user: {
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
          email: usersTable.email,
          mobileNumber: usersTable.mobileNumber,
        },
        role: {
          roleName: roleTable.roleName,
          roleCode: roleTable.roleCode,
        },
        service: {
          serviceName: ServiceTable.name,
          serviceCode: ServiceTable.code,
        },
        provider: {
          serviceName: ProviderTable.providerName,
          serviceCode: ServiceTable.code,
        },
      })
      .from(transactionTable)
      .leftJoin(usersTable, eq(transactionTable.userId, usersTable.id))
      .leftJoin(roleTable, eq(usersTable.roleId, roleTable.id))
      .leftJoin(
        ServiceProviderMappingTable,
        eq(
          transactionTable.serviceProviderMappingId,
          ServiceProviderMappingTable.id,
        ),
      )
      .leftJoin(
        ServiceTable,
        eq(ServiceProviderMappingTable.ServiceId, ServiceTable.id),
      )
      .leftJoin(
        ProviderTable,
        eq(ServiceProviderMappingTable.ProviderId, ProviderTable.id),
      )
      .where(and(...txnConditions))
      .orderBy(this.getTransactionSortColumn(query.sortBy, query.sortOrder))
      .limit(limit)
      .offset(offset);

    return {
      transactions,
      meta: {
        page,
        limit,
        total: txnCountResult.count,
        totalPages: Math.ceil(txnCountResult.count / limit),
      },
    };
  }

  // ========== TRANSACTION EARNINGS SPECIFIC METHODS ==========

  buildEarningsConditions(userIds, query) {
    const conditions = [inArray(transactionEarningsTable.userId, userIds)];

    if (query.mode && query.mode !== 'ALL') {
      conditions.push(eq(transactionEarningsTable.mode, query.mode));
    }

    if (query.status && query.status !== 'ALL') {
      conditions.push(eq(transactionEarningsTable.status, query.status));
    }

    if (query.fromDate) {
      conditions.push(
        gte(transactionEarningsTable.createdAt, new Date(query.fromDate)),
      );
    }

    if (query.toDate) {
      conditions.push(
        lte(transactionEarningsTable.createdAt, new Date(query.toDate)),
      );
    }

    if (query.search) {
      const searchTerm = `%${query.search}%`;
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM ${transactionTable}
          WHERE ${transactionTable.id} = ${transactionEarningsTable.transactionId}
          AND ${transactionTable.txnId} LIKE ${searchTerm}
        )`,
      );
    }

    return conditions;
  }

  getEarningsSortColumn(sortBy, sortOrder) {
    const columnMap = {
      createdAt: transactionEarningsTable.createdAt,
      value: transactionEarningsTable.value,
      finalAmount: transactionEarningsTable.finalAmount,
      mode: transactionEarningsTable.mode,
      status: transactionEarningsTable.status,
    };

    const column = columnMap[sortBy] || transactionEarningsTable.createdAt;
    return sortOrder === 'asc' ? asc(column) : desc(column);
  }

  async getTransactionEarnings(actor, query) {
    if (!actor?.id) throw ApiError.unauthorized('Actor is required');

    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    let user = await this.getUserWithRole(actor.id);
    let roleCode = user?.role?.roleCode;
    let actorId = actor.id;

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

    const visibleUserIds = await this.getVisibleUserIds(
      { id: actorId },
      roleCode,
    );

    if (visibleUserIds.length === 0) {
      return {
        earnings: [],
        meta: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    const earnConditions = this.buildEarningsConditions(visibleUserIds, query);

    const [earnCountResult] = await db
      .select({ count: sql`COUNT(*)`.mapWith(Number) })
      .from(transactionEarningsTable)
      .where(and(...earnConditions));

    const earnings = await db
      .select({
        id: transactionEarningsTable.id,
        userId: transactionEarningsTable.userId,
        tenantId: transactionEarningsTable.tenantId,
        walletId: transactionEarningsTable.walletId,
        transactionId: transactionEarningsTable.transactionId,
        ServiceId: transactionEarningsTable.serviceId,
        mode: transactionEarningsTable.mode,
        type: transactionEarningsTable.type,
        value: transactionEarningsTable.value,
        baseAmount: transactionEarningsTable.baseAmount,
        gstAmount: transactionEarningsTable.gstAmount,
        tdsAmount: transactionEarningsTable.tdsAmount,
        finalAmount: transactionEarningsTable.finalAmount,
        status: transactionEarningsTable.status,
        appliedSlabMin: transactionEarningsTable.appliedSlabMin,
        appliedSlabMax: transactionEarningsTable.appliedSlabMax,
        metadata: transactionEarningsTable.metadata,
        createdAt: transactionEarningsTable.createdAt,
        updatedAt: transactionEarningsTable.updatedAt,
        user: {
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
          email: usersTable.email,
          mobileNumber: usersTable.mobileNumber,
        },
        role: {
          roleName: roleTable.roleName,
          roleCode: roleTable.roleCode,
        },
        transaction: {
          txnId: transactionTable.txnId,
          amount: transactionTable.amount,
          status: transactionTable.status,
          serviceType: transactionTable.serviceType,
        },
        service: {
          serviceName: ServiceTable.name,
          serviceCode: ServiceTable.code,
        },
      })
      .from(transactionEarningsTable)
      .leftJoin(usersTable, eq(transactionEarningsTable.userId, usersTable.id))
      .leftJoin(roleTable, eq(usersTable.roleId, roleTable.id))
      .leftJoin(
        transactionTable,
        eq(transactionEarningsTable.transactionId, transactionTable.id),
      )
      .leftJoin(
        ServiceTable,
        eq(transactionEarningsTable.serviceId, ServiceTable.id),
      )
      .where(and(...earnConditions))
      .orderBy(this.getEarningsSortColumn(query.sortBy, query.sortOrder))
      .limit(limit)
      .offset(offset);

    return {
      earnings,
      meta: {
        page,
        limit,
        total: earnCountResult.count,
        totalPages: Math.ceil(earnCountResult.count / limit),
      },
    };
  }
}

export default new TransactionService();
