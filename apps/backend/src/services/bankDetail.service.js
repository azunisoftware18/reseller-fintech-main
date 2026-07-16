import { randomUUID } from 'crypto';
import { db } from '../database/core/core-db.js';
import {
  bankDetailTable,
  usersTable,
  roleTable,
  employeesTable,
  tenantsTable,
  banksTable,
  ServiceProviderMappingTable,
  ProviderTable,
} from '../models/core/index.js';
import { and, eq, desc, inArray, sql, or, isNull } from 'drizzle-orm';
import { ApiError } from '../lib/ApiError.js';
import { ROLE_HIERARCHY } from '../config/constant.js';
import { getBanksPlugin } from '../plugin_registry/bank/pluginRegistry.js';

const BANK_DETAIL_STATUS = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
};

class BankDetailService {
  async validateEmployeeActor(actor) {
    if (actor.type !== 'EMPLOYEE') return;

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

    const allowed = ['AZZUNIQUE', 'RESELLER', 'WHITELABEL'];
    if (!allowed.includes(tenant?.userType)) {
      throw ApiError.forbidden('Employee operations not allowed');
    }
  }

  async getRoleDetails(tx, roleId) {
    const [role] = await tx
      .select({
        id: roleTable.id,
        roleName: roleTable.roleName,
        roleCode: roleTable.roleCode,
        roleLevel: roleTable.roleLevel,
      })
      .from(roleTable)
      .where(eq(roleTable.id, roleId))
      .limit(1);
    return role;
  }

  async getUserWithRole(tx, userId) {
    const [user] = await tx
      .select({
        id: usersTable.id,
        tenantId: usersTable.tenantId,
        ownerUserId: usersTable.ownerUserId,
        roleId: usersTable.roleId,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        email: usersTable.email,
        userStatus: usersTable.userStatus,
        isBankDetailVerified: usersTable.isBankDetailVerified,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) return null;
    const role = await this.getRoleDetails(tx, user.roleId);
    return { ...user, role };
  }

  async isDirectParent(tx, potentialParentId, childId) {
    const [child] = await tx
      .select({
        ownerUserId: usersTable.ownerUserId,
        createdByUserId: usersTable.createdByUserId,
      })
      .from(usersTable)
      .where(eq(usersTable.id, childId))
      .limit(1);

    if (!child) return false;

    // Normal ownership chain
    if (child.ownerUserId === potentialParentId) return true;

    // Bootstrap ownership: first owner of a tenant created by parent
    if (
      child.ownerUserId === null &&
      child.createdByUserId === potentialParentId
    ) {
      return true;
    }

    return false;
  }

  getApprovalAuthority(roleCode) {
    const hierarchy = ROLE_HIERARCHY[roleCode];
    if (!hierarchy) return { canApprove: [], level: 99 };
    return hierarchy;
  }

  async validateApprovalAuthority(tx, approverId, targetUserId) {
    const approver = await this.getUserWithRole(tx, approverId);
    const target = await this.getUserWithRole(tx, targetUserId);

    if (!approver) throw ApiError.notFound('Approver not found');
    if (!target) throw ApiError.notFound('Target user not found');
    if (approverId === targetUserId) {
      throw ApiError.forbidden('Self-approval is not allowed');
    }
    if (target.role?.roleCode === 'AZZUNIQUE') {
      throw ApiError.badRequest(
        'Root user does not require bank detail approval',
      );
    }

    const isParent = await this.isDirectParent(tx, approverId, targetUserId);
    if (!isParent) {
      throw ApiError.forbidden(
        'You can only approve bank details for your direct downline members',
      );
    }

    const approverAuth = this.getApprovalAuthority(approver.role?.roleCode);
    const canApprove = approverAuth.canApprove.includes(target.role?.roleCode);

    if (!canApprove) {
      throw ApiError.forbidden(
        `As ${approver.role?.roleCode}, you cannot approve bank details for ${target.role?.roleCode}`,
      );
    }
    return { approver, target };
  }

  async updateUserBankDetailFlag(tx, userId, isVerified) {
    await tx
      .update(usersTable)
      .set({ isBankDetailVerified: isVerified, updatedAt: new Date() })
      .where(eq(usersTable.id, userId));
  }

  async submitBankDetail(payload, actor) {
    const { bankDetail } = payload;
    const userId = payload.userId || actor?.id;

    if (!userId) throw ApiError.badRequest('User ID is required');
    if (!actor?.id) throw ApiError.unauthorized('Actor is required');

    if (actor.type === 'EMPLOYEE') {
      throw ApiError.forbidden('Employees cannot submit bank details');
    }

    if (!bankDetail) throw ApiError.badRequest('Bank detail is required');

    return await db.transaction(async (tx) => {
      const targetUser = await this.getUserWithRole(tx, userId);
      if (!targetUser) throw ApiError.notFound('User not found');

      const isSelf = actor.id === userId;
      const isParent = await this.isDirectParent(tx, actor.id, userId);
      if (!isSelf && !isParent) {
        throw ApiError.forbidden(
          'You can only submit bank details for yourself or your direct downline',
        );
      }
      const isAzzunique = targetUser.role?.roleCode === 'AZZUNIQUE';

      // Check if bank exists
      const [bank] = await tx
        .select({ id: banksTable.id })
        .from(banksTable)
        .where(eq(banksTable.id, bankDetail.bankId))
        .limit(1);

      if (!bank) throw ApiError.badRequest('Invalid bank ID');

      // Check if user already has this bank account number
      const [existingAccount] = await tx
        .select({ id: bankDetailTable.id })
        .from(bankDetailTable)
        .where(
          and(
            eq(bankDetailTable.userId, userId),
            eq(bankDetailTable.accountNumber, bankDetail.accountNumber),
            eq(bankDetailTable.isActive, true),
          ),
        )
        .limit(1);

      if (existingAccount) {
        throw ApiError.badRequest(
          'Bank account number already exists for this user',
        );
      }

      // If this is primary, remove primary flag from other banks
      if (bankDetail.isPrimary) {
        await tx
          .update(bankDetailTable)
          .set({ isPrimary: false, updatedAt: new Date() })
          .where(
            and(
              eq(bankDetailTable.userId, userId),
              eq(bankDetailTable.isPrimary, true),
              eq(bankDetailTable.isActive, true),
            ),
          );
      }

      const bankDetailId = randomUUID();
      const now = new Date();

      await tx.insert(bankDetailTable).values({
        id: bankDetailId,
        userId,
        tenantId: targetUser.tenantId,
        bankId: bankDetail.bankId,
        bankName: bankDetail.bankName,
        accountHolderName: bankDetail.accountHolderName,
        accountNumber: bankDetail.accountNumber,
        ifscCode: bankDetail.ifscCode,
        branchName: bankDetail.branchName,
        isPrimary: bankDetail.isPrimary || false,
        verificationStatus: isAzzunique
          ? BANK_DETAIL_STATUS.VERIFIED
          : BANK_DETAIL_STATUS.PENDING,

        submittedByUserId: actor.id,
        submittedAt: now,

        approvedByUserId: isAzzunique ? actor.id : null,
        approvedAt: isAzzunique ? now : null,
        createdAt: now,
        updatedAt: now,
        isActive: true,
      });

      if (isAzzunique) {
        await this.updateUserBankDetailFlag(tx, userId, true);
      }

      return {
        success: true,
        bankDetailId,

        status: isAzzunique
          ? BANK_DETAIL_STATUS.VERIFIED
          : BANK_DETAIL_STATUS.PENDING,

        message: isAzzunique
          ? 'Bank detail added and auto-verified successfully'
          : 'Bank detail submitted successfully and pending approval',
      };
    });
  }

  async resubmitBankDetail(payload, actor) {
    const { bankDetailId, bankDetail } = payload;
    const userId = payload.userId || actor?.id;

    if (!userId) throw ApiError.badRequest('User ID is required');
    if (!bankDetailId) throw ApiError.badRequest('Bank detail ID is required');
    if (!actor?.id) throw ApiError.unauthorized('Actor is required');

    if (actor.type === 'EMPLOYEE') {
      throw ApiError.forbidden('Employees cannot resubmit bank details');
    }

    if (!bankDetail) throw ApiError.badRequest('Bank detail is required');

    return await db.transaction(async (tx) => {
      const targetUser = await this.getUserWithRole(tx, userId);
      if (!targetUser) throw ApiError.notFound('User not found');

      const isSelf = actor.id === userId;
      const isParent = await this.isDirectParent(tx, actor.id, userId);
      if (!isSelf && !isParent) {
        throw ApiError.forbidden(
          'You can only resubmit bank details for yourself or your direct downline',
        );
      }
      if (targetUser.role?.roleCode === 'AZZUNIQUE') {
        throw ApiError.badRequest('Root user does not require bank details');
      }

      const [existingBankDetail] = await tx
        .select({
          id: bankDetailTable.id,
          verificationStatus: bankDetailTable.verificationStatus,
          userId: bankDetailTable.userId,
        })
        .from(bankDetailTable)
        .where(eq(bankDetailTable.id, bankDetailId))
        .limit(1);

      if (!existingBankDetail) {
        throw ApiError.badRequest('Bank detail not found');
      }

      if (existingBankDetail.userId !== userId) {
        throw ApiError.badRequest('Bank detail does not belong to this user');
      }

      if (
        existingBankDetail.verificationStatus === BANK_DETAIL_STATUS.VERIFIED
      ) {
        throw ApiError.badRequest(
          'Bank detail is already verified. Contact admin for re-verification.',
        );
      }
      if (
        existingBankDetail.verificationStatus !== BANK_DETAIL_STATUS.REJECTED
      ) {
        throw ApiError.badRequest(
          'Only rejected bank details can be resubmitted.',
        );
      }

      // Check if bank exists
      const [bank] = await tx
        .select({ id: banksTable.id })
        .from(banksTable)
        .where(eq(banksTable.id, bankDetail.bankId))
        .limit(1);

      if (!bank) throw ApiError.badRequest('Invalid bank ID');

      const now = new Date();

      // Update existing record
      await tx
        .update(bankDetailTable)
        .set({
          bankId: bankDetail.bankId,
          bankName: bankDetail.bankName,
          accountHolderName: bankDetail.accountHolderName,
          accountNumber: bankDetail.accountNumber,
          ifscCode: bankDetail.ifscCode,
          branchName: bankDetail.branchName,
          isPrimary: bankDetail.isPrimary,
          verificationStatus: BANK_DETAIL_STATUS.PENDING,
          submittedByUserId: actor.id,
          submittedAt: now,
          approvedByUserId: null,
          approvedAt: null,
          rejectedByUserId: null,
          rejectedAt: null,
          rejectionReason: null,
          approvalNotes: null,
          updatedAt: now,
        })
        .where(eq(bankDetailTable.id, bankDetailId));

      return {
        success: true,
        bankDetailId,
        status: BANK_DETAIL_STATUS.PENDING,
        message: 'Bank detail resubmitted successfully and pending approval',
      };
    });
  }

  async approveBankDetail(payload, actor) {
    const { bankDetailId, approvalNotes } = payload;
    if (!bankDetailId) throw ApiError.badRequest('Bank detail ID is required');
    if (!actor?.id) throw ApiError.unauthorized('Actor is required');

    return await db.transaction(async (tx) => {
      const [bankDetailRecord] = await tx
        .select({
          id: bankDetailTable.id,
          userId: bankDetailTable.userId,
          verificationStatus: bankDetailTable.verificationStatus,
          isPrimary: bankDetailTable.isPrimary,
        })
        .from(bankDetailTable)
        .where(eq(bankDetailTable.id, bankDetailId))
        .limit(1);

      if (!bankDetailRecord)
        throw ApiError.notFound('Bank detail record not found');
      if (bankDetailRecord.verificationStatus === BANK_DETAIL_STATUS.VERIFIED) {
        throw ApiError.badRequest('Bank detail is already verified');
      }

      if (actor.type === 'EMPLOYEE') {
        await this.validateEmployeeActor(actor);

        const [employee] = await tx
          .select({ tenantId: employeesTable.tenantId })
          .from(employeesTable)
          .where(eq(employeesTable.id, actor.id))
          .limit(1);

        const [tenant] = await db
          .select({ userType: tenantsTable.userType })
          .from(tenantsTable)
          .where(eq(tenantsTable.id, employee.tenantId))
          .limit(1);

        const ownerRoleCode = tenant?.userType;

        if (!ownerRoleCode) {
          throw ApiError.forbidden('Employee operations not allowed');
        }

        const [tenantOwner] = await db
          .select({ id: usersTable.id })
          .from(usersTable)
          .leftJoin(roleTable, eq(usersTable.roleId, roleTable.id))
          .where(
            and(
              eq(usersTable.tenantId, employee.tenantId),
              eq(roleTable.roleCode, ownerRoleCode),
            ),
          )
          .limit(1);

        if (!tenantOwner) {
          throw ApiError.forbidden('Tenant owner not found');
        }

        const isOwnerDownline = await this.isDirectParent(
          tx,
          tenantOwner.id,
          bankDetailRecord.userId,
        );
        if (!isOwnerDownline) {
          throw ApiError.forbidden(
            "You can only approve bank details for your tenant owner's direct downline members",
          );
        }

        const target = await this.getUserWithRole(tx, bankDetailRecord.userId);
      } else {
        await this.validateApprovalAuthority(
          tx,
          actor.id,
          bankDetailRecord.userId,
        );
      }

      const now = new Date();

      await tx
        .update(bankDetailTable)
        .set({
          verificationStatus: BANK_DETAIL_STATUS.VERIFIED,
          approvedByUserId: actor.type === 'USER' ? actor.id : null,
          approvedByEmployeeId: actor.type === 'EMPLOYEE' ? actor.id : null,
          approvedAt: now,
          approvalNotes: approvalNotes || null,
          updatedAt: now,
        })
        .where(eq(bankDetailTable.id, bankDetailId));

      // Check if this is the first verified bank for this user
      const verifiedCount = await tx
        .select({ count: sql`COUNT(*)`.mapWith(Number) })
        .from(bankDetailTable)
        .where(
          and(
            eq(bankDetailTable.userId, bankDetailRecord.userId),
            eq(bankDetailTable.isActive, true),
            eq(bankDetailTable.verificationStatus, BANK_DETAIL_STATUS.VERIFIED),
          ),
        );

      // If this is the first verified bank, set as primary and update user flag
      if (verifiedCount[0].count === 1) {
        await tx
          .update(bankDetailTable)
          .set({ isPrimary: true })
          .where(eq(bankDetailTable.id, bankDetailId));

        await this.updateUserBankDetailFlag(tx, bankDetailRecord.userId, true);
      }

      return {
        success: true,
        bankDetailId,
        status: BANK_DETAIL_STATUS.VERIFIED,
        message: 'Bank detail approved successfully',
      };
    });
  }

  async rejectBankDetail(payload, actor) {
    const { bankDetailId, rejectionReason } = payload;
    if (!bankDetailId) throw ApiError.badRequest('Bank detail ID is required');
    if (!rejectionReason)
      throw ApiError.badRequest('Rejection reason is required');
    if (!actor?.id) throw ApiError.unauthorized('Actor is required');

    return await db.transaction(async (tx) => {
      const [bankDetailRecord] = await tx
        .select({
          id: bankDetailTable.id,
          userId: bankDetailTable.userId,
          verificationStatus: bankDetailTable.verificationStatus,
        })
        .from(bankDetailTable)
        .where(eq(bankDetailTable.id, bankDetailId))
        .limit(1);

      if (!bankDetailRecord)
        throw ApiError.notFound('Bank detail record not found');
      if (bankDetailRecord.verificationStatus === BANK_DETAIL_STATUS.REJECTED) {
        throw ApiError.badRequest('Bank detail is already rejected');
      }

      if (actor.type === 'EMPLOYEE') {
        await this.validateEmployeeActor(actor);

        const [employee] = await tx
          .select({ tenantId: employeesTable.tenantId })
          .from(employeesTable)
          .where(eq(employeesTable.id, actor.id))
          .limit(1);

        const [tenant] = await db
          .select({ userType: tenantsTable.userType })
          .from(tenantsTable)
          .where(eq(tenantsTable.id, employee.tenantId))
          .limit(1);

        const ownerRoleCode = tenant?.userType;

        if (!ownerRoleCode) {
          throw ApiError.forbidden('Employee operations not allowed');
        }

        const [tenantOwner] = await db
          .select({ id: usersTable.id })
          .from(usersTable)
          .leftJoin(roleTable, eq(usersTable.roleId, roleTable.id))
          .where(
            and(
              eq(usersTable.tenantId, employee.tenantId),
              eq(roleTable.roleCode, ownerRoleCode),
            ),
          )
          .limit(1);

        if (!tenantOwner) {
          throw ApiError.forbidden('Tenant owner not found');
        }

        const isOwnerDownline = await this.isDirectParent(
          tx,
          tenantOwner.id,
          bankDetailRecord.userId,
        );
        if (!isOwnerDownline) {
          throw ApiError.forbidden(
            "You can only reject bank details for your tenant owner's direct downline members",
          );
        }

        const target = await this.getUserWithRole(tx, bankDetailRecord.userId);
      } else {
        await this.validateApprovalAuthority(
          tx,
          actor.id,
          bankDetailRecord.userId,
        );
      }

      const now = new Date();

      await tx
        .update(bankDetailTable)
        .set({
          verificationStatus: BANK_DETAIL_STATUS.REJECTED,
          rejectedByUserId: actor.type === 'USER' ? actor.id : null,
          rejectedByEmployeeId: actor.type === 'EMPLOYEE' ? actor.id : null,
          rejectedAt: now,
          rejectionReason,
          updatedAt: now,
        })
        .where(eq(bankDetailTable.id, bankDetailId));

      // Update user flag if no verified banks left
      const verifiedCount = await tx
        .select({ count: sql`COUNT(*)`.mapWith(Number) })
        .from(bankDetailTable)
        .where(
          and(
            eq(bankDetailTable.userId, bankDetailRecord.userId),
            eq(bankDetailTable.isActive, true),
            eq(bankDetailTable.verificationStatus, BANK_DETAIL_STATUS.VERIFIED),
          ),
        );

      if (verifiedCount[0].count === 0) {
        await this.updateUserBankDetailFlag(tx, bankDetailRecord.userId, false);
      }

      return {
        success: true,
        bankDetailId,
        status: BANK_DETAIL_STATUS.REJECTED,
        message: 'Bank detail rejected successfully',
      };
    });
  }

  async getUserBankDetails(userId, actor) {
    if (!userId) throw ApiError.badRequest('User ID is required');

    const isSelf = actor?.id === userId;
    const hasDownlineAccess = await this.checkDownlineAccess(actor, userId);
    if (!isSelf && !hasDownlineAccess) {
      throw ApiError.forbidden(
        'You can only view bank details for yourself or your downline',
      );
    }

    const bankDetails = await db
      .select({
        id: bankDetailTable.id,
        userId: bankDetailTable.userId,
        bankId: bankDetailTable.bankId,
        bankName: bankDetailTable.bankName,
        accountHolderName: bankDetailTable.accountHolderName,
        accountNumber: bankDetailTable.accountNumber,
        ifscCode: bankDetailTable.ifscCode,
        branchName: bankDetailTable.branchName,
        isPrimary: bankDetailTable.isPrimary,
        verificationStatus: bankDetailTable.verificationStatus,
        submittedAt: bankDetailTable.submittedAt,
        submittedByUserId: bankDetailTable.submittedByUserId,
        approvedAt: bankDetailTable.approvedAt,
        approvedByUserId: bankDetailTable.approvedByUserId,
        approvalNotes: bankDetailTable.approvalNotes,
        rejectedAt: bankDetailTable.rejectedAt,
        rejectedByUserId: bankDetailTable.rejectedByUserId,
        rejectionReason: bankDetailTable.rejectionReason,
        createdAt: bankDetailTable.createdAt,
        updatedAt: bankDetailTable.updatedAt,
      })
      .from(bankDetailTable)
      .where(
        and(
          eq(bankDetailTable.userId, userId),
          eq(bankDetailTable.isActive, true),
        ),
      )
      .orderBy(
        desc(bankDetailTable.isPrimary),
        desc(bankDetailTable.createdAt),
      );

    if (bankDetails.length === 0) {
      return {
        userId,
        bankDetails: [],
        total: 0,
      };
    }

    return {
      userId,
      bankDetails,
      total: bankDetails.length,
      primaryBank: bankDetails.find((b) => b.isPrimary) || null,
    };
  }

  async getBankDetailById(bankDetailId, actor) {
    if (!bankDetailId) throw ApiError.badRequest('Bank detail ID is required');

    const [bankDetail] = await db
      .select({
        id: bankDetailTable.id,
        userId: bankDetailTable.userId,
        bankId: bankDetailTable.bankId,
        bankName: bankDetailTable.bankName,
        accountHolderName: bankDetailTable.accountHolderName,
        accountNumber: bankDetailTable.accountNumber,
        ifscCode: bankDetailTable.ifscCode,
        branchName: bankDetailTable.branchName,
        isPrimary: bankDetailTable.isPrimary,
        verificationStatus: bankDetailTable.verificationStatus,
        submittedAt: bankDetailTable.submittedAt,
        submittedByUserId: bankDetailTable.submittedByUserId,
        approvedAt: bankDetailTable.approvedAt,
        approvedByUserId: bankDetailTable.approvedByUserId,
        approvalNotes: bankDetailTable.approvalNotes,
        rejectedAt: bankDetailTable.rejectedAt,
        rejectedByUserId: bankDetailTable.rejectedByUserId,
        rejectionReason: bankDetailTable.rejectionReason,
        createdAt: bankDetailTable.createdAt,
        updatedAt: bankDetailTable.updatedAt,
      })
      .from(bankDetailTable)
      .where(
        and(
          eq(bankDetailTable.id, bankDetailId),
          eq(bankDetailTable.isActive, true),
        ),
      )
      .limit(1);

    if (!bankDetail) {
      throw ApiError.notFound('Bank detail not found');
    }

    // Check access
    const isSelf = actor?.id === bankDetail.userId;
    const hasDownlineAccess = await this.checkDownlineAccess(
      actor,
      bankDetail.userId,
    );
    if (!isSelf && !hasDownlineAccess) {
      throw ApiError.forbidden('You do not have access to this bank detail');
    }

    return bankDetail;
  }

  async setPrimaryBank(bankDetailId, actor) {
    if (!bankDetailId) throw ApiError.badRequest('Bank detail ID is required');
    if (!actor?.id) throw ApiError.unauthorized('Actor is required');

    return await db.transaction(async (tx) => {
      const [bankDetail] = await tx
        .select({
          id: bankDetailTable.id,
          userId: bankDetailTable.userId,
          verificationStatus: bankDetailTable.verificationStatus,
        })
        .from(bankDetailTable)
        .where(
          and(
            eq(bankDetailTable.id, bankDetailId),
            eq(bankDetailTable.isActive, true),
          ),
        )
        .limit(1);

      if (!bankDetail) throw ApiError.notFound('Bank detail not found');

      // Only verified banks can be primary
      if (bankDetail.verificationStatus !== BANK_DETAIL_STATUS.VERIFIED) {
        throw ApiError.badRequest(
          'Only verified bank details can be set as primary',
        );
      }

      const isSelf = actor.id === bankDetail.userId;
      const isParent = await this.isDirectParent(
        tx,
        actor.id,
        bankDetail.userId,
      );

      if (!isSelf && !isParent) {
        throw ApiError.forbidden(
          'You can only set primary bank for yourself or your direct downline',
        );
      }

      // Remove primary flag from all other banks
      await tx
        .update(bankDetailTable)
        .set({ isPrimary: false, updatedAt: new Date() })
        .where(
          and(
            eq(bankDetailTable.userId, bankDetail.userId),
            eq(bankDetailTable.isActive, true),
          ),
        );

      // Set this bank as primary
      await tx
        .update(bankDetailTable)
        .set({ isPrimary: true, updatedAt: new Date() })
        .where(eq(bankDetailTable.id, bankDetailId));

      return {
        success: true,
        message: 'Primary bank set successfully',
        bankDetailId,
      };
    });
  }

  async deleteBankDetail(bankDetailId, actor) {
    if (!bankDetailId) throw ApiError.badRequest('Bank detail ID is required');
    if (!actor?.id) throw ApiError.unauthorized('Actor is required');

    return await db.transaction(async (tx) => {
      const [bankDetail] = await tx
        .select({
          id: bankDetailTable.id,
          userId: bankDetailTable.userId,
          isPrimary: bankDetailTable.isPrimary,
          verificationStatus: bankDetailTable.verificationStatus,
        })
        .from(bankDetailTable)
        .where(
          and(
            eq(bankDetailTable.id, bankDetailId),
            eq(bankDetailTable.isActive, true),
          ),
        )
        .limit(1);

      if (!bankDetail) throw ApiError.notFound('Bank detail not found');

      // Can only delete pending or rejected bank details
      if (bankDetail.verificationStatus === BANK_DETAIL_STATUS.VERIFIED) {
        throw ApiError.badRequest(
          'Cannot delete verified bank details. Contact admin.',
        );
      }

      const isSelf = actor.id === bankDetail.userId;
      const isParent = await this.isDirectParent(
        tx,
        actor.id,
        bankDetail.userId,
      );

      if (!isSelf && !isParent) {
        throw ApiError.forbidden(
          'You can only delete bank details for yourself or your direct downline',
        );
      }

      // Soft delete
      await tx
        .update(bankDetailTable)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(bankDetailTable.id, bankDetailId));

      // If this was primary, set another bank as primary
      if (bankDetail.isPrimary) {
        const [anotherBank] = await tx
          .select({ id: bankDetailTable.id })
          .from(bankDetailTable)
          .where(
            and(
              eq(bankDetailTable.userId, bankDetail.userId),
              eq(bankDetailTable.isActive, true),
              eq(
                bankDetailTable.verificationStatus,
                BANK_DETAIL_STATUS.VERIFIED,
              ),
            ),
          )
          .limit(1);

        if (anotherBank) {
          await tx
            .update(bankDetailTable)
            .set({ isPrimary: true, updatedAt: new Date() })
            .where(eq(bankDetailTable.id, anotherBank.id));
        }
      }

      // Update user flag if no verified banks left
      const remainingVerified = await tx
        .select({ count: sql`COUNT(*)`.mapWith(Number) })
        .from(bankDetailTable)
        .where(
          and(
            eq(bankDetailTable.userId, bankDetail.userId),
            eq(bankDetailTable.isActive, true),
            eq(bankDetailTable.verificationStatus, BANK_DETAIL_STATUS.VERIFIED),
          ),
        );

      if (remainingVerified[0].count === 0) {
        await this.updateUserBankDetailFlag(tx, bankDetail.userId, false);
      }

      return {
        success: true,
        message: 'Bank detail deleted successfully',
      };
    });
  }

  async getBankDetailStatus(userId, actor) {
    if (!userId) throw ApiError.badRequest('User ID is required');

    const isSelf = actor?.id === userId;
    const hasDownlineAccess = await this.checkDownlineAccess(actor, userId);
    if (!isSelf && !hasDownlineAccess) {
      throw ApiError.forbidden(
        'You can only view bank details for yourself or your downline',
      );
    }

    const [bankDetailRecord] = await db
      .select({
        id: bankDetailTable.id,
        userId: bankDetailTable.userId,
        bankId: bankDetailTable.bankId,
        bankName: bankDetailTable.bankName,
        accountHolderName: bankDetailTable.accountHolderName,
        accountNumber: bankDetailTable.accountNumber,
        ifscCode: bankDetailTable.ifscCode,
        branchName: bankDetailTable.branchName,
        isPrimary: bankDetailTable.isPrimary,
        verificationStatus: bankDetailTable.verificationStatus,
        submittedAt: bankDetailTable.submittedAt,
        submittedByUserId: bankDetailTable.submittedByUserId,
        approvedAt: bankDetailTable.approvedAt,
        approvedByUserId: bankDetailTable.approvedByUserId,
        approvalNotes: bankDetailTable.approvalNotes,
        rejectedAt: bankDetailTable.rejectedAt,
        rejectedByUserId: bankDetailTable.rejectedByUserId,
        rejectionReason: bankDetailTable.rejectionReason,
        createdAt: bankDetailTable.createdAt,
        updatedAt: bankDetailTable.updatedAt,
      })
      .from(bankDetailTable)
      .where(
        and(
          eq(bankDetailTable.userId, userId),
          eq(bankDetailTable.isActive, true),
        ),
      )
      .orderBy(desc(bankDetailTable.isPrimary))
      .limit(1);

    if (!bankDetailRecord) {
      return {
        userId,
        status: 'NOT_SUBMITTED',
        bankDetail: null,
      };
    }

    return bankDetailRecord;
  }

  async checkDownlineAccess(actor, targetUserId) {
    if (!actor?.id) return false;
    const isParent = await this.isDirectParent(db, actor.id, targetUserId);
    if (isParent) return true;

    let currentId = targetUserId;
    const maxDepth = 10;
    let depth = 0;

    while (currentId && depth < maxDepth) {
      const [parent] = await db
        .select({ ownerUserId: usersTable.ownerUserId })
        .from(usersTable)
        .where(eq(usersTable.id, currentId))
        .limit(1);
      if (!parent?.ownerUserId) break;
      if (parent.ownerUserId === actor.id) return true;
      currentId = parent.ownerUserId;
      depth++;
    }
    return false;
  }

  async getBankDetailsForApprover(actor, query = {}) {
    if (!actor?.id) throw ApiError.unauthorized('Actor is required');

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;
    const statusFilter = query.status || 'PENDING';

    let userIdsToFilter = [];

    if (actor.type === 'EMPLOYEE') {
      await this.validateEmployeeActor(actor);
      const [employee] = await db
        .select({ tenantId: employeesTable.tenantId })
        .from(employeesTable)
        .where(eq(employeesTable.id, actor.id))
        .limit(1);

      const [tenant] = await db
        .select({ userType: tenantsTable.userType })
        .from(tenantsTable)
        .where(eq(tenantsTable.id, employee.tenantId))
        .limit(1);

      const ownerRoleCode = tenant?.userType;

      if (!ownerRoleCode) {
        return { data: [], meta: { page, limit, total: 0, totalPages: 0 } };
      }

      const tenantOwners = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .leftJoin(roleTable, eq(usersTable.roleId, roleTable.id))
        .where(
          and(
            eq(usersTable.tenantId, employee.tenantId),
            eq(roleTable.roleCode, ownerRoleCode),
          ),
        );

      if (tenantOwners.length === 0) {
        return { data: [], meta: { page, limit, total: 0, totalPages: 0 } };
      }

      const ownerIds = tenantOwners.map((o) => o.id);

      const downlineUsers = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(
          and(
            or(
              inArray(usersTable.ownerUserId, ownerIds),
              and(
                isNull(usersTable.ownerUserId),
                inArray(usersTable.createdByUserId, ownerIds),
              ),
            ),
            eq(usersTable.userStatus, 'ACTIVE'),
          ),
        );

      userIdsToFilter = downlineUsers.map((u) => u.id);
    } else {
      // 👤 USER branch — normal + bootstrap ownership
      const downlineUsers = await db
        .select({
          id: usersTable.id,
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
          email: usersTable.email,
          roleId: usersTable.roleId,
        })
        .from(usersTable)
        .where(
          and(
            or(
              // Normal direct downline
              eq(usersTable.ownerUserId, actor.id),
              // First owners created by actor (RESELLER, WHITE_LABEL)
              and(
                isNull(usersTable.ownerUserId),
                eq(usersTable.createdByUserId, actor.id),
              ),
            ),
            eq(usersTable.userStatus, 'ACTIVE'),
          ),
        );

      userIdsToFilter = downlineUsers.map((u) => u.id);
    }

    if (userIdsToFilter.length === 0) {
      return { data: [], meta: { page, limit, total: 0, totalPages: 0 } };
    }

    const whereConditions = [
      inArray(bankDetailTable.userId, userIdsToFilter),
      eq(bankDetailTable.isActive, true),
    ];

    if (statusFilter !== 'ALL') {
      whereConditions.push(
        eq(bankDetailTable.verificationStatus, statusFilter),
      );
    }

    if (query.tenantId) {
      whereConditions.push(eq(bankDetailTable.tenantId, query.tenantId));
    }

    const [countResult] = await db
      .select({ count: sql`COUNT(*)`.mapWith(Number) })
      .from(bankDetailTable)
      .where(and(...whereConditions));

    const bankDetails = await db
      .select({
        id: bankDetailTable.id,
        userId: bankDetailTable.userId,
        bankId: bankDetailTable.bankId,
        bankName: bankDetailTable.bankName,
        accountHolderName: bankDetailTable.accountHolderName,
        accountNumber: bankDetailTable.accountNumber,
        ifscCode: bankDetailTable.ifscCode,
        branchName: bankDetailTable.branchName,
        isPrimary: bankDetailTable.isPrimary,
        verificationStatus: bankDetailTable.verificationStatus,
        submittedAt: bankDetailTable.submittedAt,
        submittedByUserId: bankDetailTable.submittedByUserId,
        approvedAt: bankDetailTable.approvedAt,
        approvedByUserId: bankDetailTable.approvedByUserId,
        approvedByEmployeeId: bankDetailTable.approvedByEmployeeId,
        approvalNotes: bankDetailTable.approvalNotes,
        rejectedAt: bankDetailTable.rejectedAt,
        rejectedByUserId: bankDetailTable.rejectedByUserId,
        rejectedByEmployeeId: bankDetailTable.rejectedByEmployeeId,
        rejectionReason: bankDetailTable.rejectionReason,
        createdAt: bankDetailTable.createdAt,
        updatedAt: bankDetailTable.updatedAt,
        user: {
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
          email: usersTable.email,
          mobileNumber: usersTable.mobileNumber,
        },
        role: { roleName: roleTable.roleName, roleCode: roleTable.roleCode },
      })
      .from(bankDetailTable)
      .leftJoin(usersTable, eq(bankDetailTable.userId, usersTable.id))
      .leftJoin(roleTable, eq(usersTable.roleId, roleTable.id))
      .where(and(...whereConditions))
      .orderBy(desc(bankDetailTable.submittedAt))
      .limit(limit)
      .offset(offset);

    return {
      data: bankDetails,
      meta: {
        page,
        limit,
        total: countResult.count,
        totalPages: Math.ceil(countResult.count / limit),
      },
    };
  }

  async _validateMapping() {
    const [mapping] = await db
      .select({
        id: ServiceProviderMappingTable.id,
        ServiceId: ServiceProviderMappingTable.ServiceId,
        ProviderId: ServiceProviderMappingTable.ProviderId,
        config: ServiceProviderMappingTable.config,
        isActive: ServiceProviderMappingTable.isActive,
        providerCode: ProviderTable.code,
      })
      .from(ServiceProviderMappingTable)
      .leftJoin(
        ProviderTable,
        eq(ServiceProviderMappingTable.ProviderId, ProviderTable.id),
      )
      .where(eq(ProviderTable.code, 'INSTANTPAY'))
      .limit(1);

    if (!mapping) {
      throw ApiError.badRequest(
        'INSTANTPAY service provider mapping not found',
      );
    }

    if (!mapping.isActive) {
      throw ApiError.badRequest(
        'INSTANTPAY service provider mapping is inactive',
      );
    }

    return mapping;
  }

  async getAllBanks(query = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit);
    const offset = (page - 1) * limit;
    const search = query.search || '';
    const isActive =
      query.isActive !== undefined ? query.isActive === 'true' : undefined;

    try {
      let whereConditions = [];

      // Add search filter if provided
      if (search) {
        whereConditions.push(
          sql`${banksTable.name} LIKE ${`%${search}%`} OR ${banksTable.bankId} LIKE ${`%${search}%`} OR ${banksTable.ifscAlias} LIKE ${`%${search}%`}`,
        );
      }

      // Add active status filter if provided
      if (isActive !== undefined) {
        whereConditions.push(eq(banksTable.isActive, isActive));
      }

      const finalWhere =
        whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Only select fields needed by frontend
      const banks = await db
        .select({
          id: banksTable.id,
          name: banksTable.name,
          ifscGlobal: banksTable.ifscGlobal,
        })
        .from(banksTable)
        .where(finalWhere)
        .orderBy(desc(banksTable.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count for pagination
      const [countResult] = await db
        .select({ count: sql`COUNT(*)`.mapWith(Number) })
        .from(banksTable)
        .where(finalWhere);

      return {
        success: true,
        data: banks,
        meta: {
          page,
          limit,
          total: countResult.count,
          totalPages: Math.ceil(countResult.count / limit),
        },
      };
    } catch (error) {
      console.error('[Get All Banks] Error:', error);
      throw ApiError.internal(error.message || 'Failed to fetch banks');
    }
  }

  async syncBanks() {
    try {
      console.log('🔄 Bank sync started...');

      const mapping = await this._validateMapping();

      const plugin = getBanksPlugin(mapping.providerCode, mapping.config);

      const banks = await plugin.fetchBanks();

      if (!banks || !banks.length) {
        console.log('⚠️ No banks found');
        return { success: true, message: 'No banks found', total: 0 };
      }

      // Track which bankIds we see in this sync
      const seenBankIds = new Set();

      await db.transaction(async (tx) => {
        for (const bank of banks) {
          seenBankIds.add(bank.bankId);

          const existing = await tx
            .select()
            .from(banksTable)
            .where(eq(banksTable.bankId, bank.bankId))
            .limit(1);

          const now = new Date();

          const payload = {
            bankId: bank.bankId,
            name: bank.name,
            ifscAlias: bank.ifscAlias,
            ifscGlobal: bank.ifscGlobal,

            // RTGS
            rtgsEnabled: !!bank.rtgsEnabled,
            rtgsFailureRate: String(bank.rtgsFailureRate ?? '0'),

            // NEFT
            neftEnabled: !!bank.neftEnabled,
            neftFailureRate: String(bank.neftFailureRate ?? '0'),

            // IMPS
            impsEnabled: !!bank.impsEnabled,
            impsFailureRate: String(bank.impsFailureRate ?? '0'),

            // UPI
            upiEnabled: !!bank.upiEnabled,
            upiFailureRate: String(bank.upiFailureRate ?? '0'),

            // Visa Direct
            visaDirectCredit: bank.visaDirectCredit ?? 'INACTIVE',
            visaDirectDebit: bank.visaDirectDebit ?? 'INACTIVE',

            // Mastercard Send
            mastercardSendCredit: bank.mastercardSendCredit ?? 'INACTIVE',
            mastercardSendDebit: bank.mastercardSendDebit ?? 'INACTIVE',

            // Credit Card flags
            creditCardUpi: !!bank.creditCardUpi,
            creditCardImps: !!bank.creditCardImps,
            creditCardNeft: !!bank.creditCardNeft,

            updatedAt: now,
          };

          if (existing.length) {
            await tx
              .update(banksTable)
              .set(payload)
              .where(eq(banksTable.bankId, bank.bankId));
          } else {
            await tx.insert(banksTable).values({
              ...payload,
              createdAt: now,
              isActive: true,
            });
          }
        }
      });

      console.log(`✅ Bank sync completed: ${banks.length} banks`);

      return {
        success: true,
        message: 'Bank sync completed',
        total: banks.length,
      };
    } catch (error) {
      console.error('❌ Bank sync failed:', error);
      throw ApiError.internal(error.message || 'Bank sync failed');
    }
  }
}

export default new BankDetailService();
