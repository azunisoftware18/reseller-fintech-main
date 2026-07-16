import { randomUUID } from 'crypto';
import { db } from '../database/core/core-db.js';
import {
  usersKycTable,
  kycDocumentTable,
  usersTable,
  roleTable,
  addressesTable,
  employeesTable,
  tenantsTable,
} from '../models/core/index.js';
import { and, eq, desc, inArray, sql, or, isNull } from 'drizzle-orm';
import { ApiError } from '../lib/ApiError.js';
import { ROLE_HIERARCHY } from '../config/constant.js';

const KYC_STATUS = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
};

class KycService {
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
        isKycVerified: usersTable.isKycVerified,
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
      throw ApiError.badRequest('Root user does not require KYC approval');
    }

    const isParent = await this.isDirectParent(tx, approverId, targetUserId);
    if (!isParent) {
      throw ApiError.forbidden(
        'You can only approve KYC for your direct downline members',
      );
    }

    const approverAuth = this.getApprovalAuthority(approver.role?.roleCode);
    const canApprove = approverAuth.canApprove.includes(target.role?.roleCode);

    if (!canApprove) {
      throw ApiError.forbidden(
        `As ${approver.role?.roleCode}, you cannot approve KYC for ${target.role?.roleCode}`,
      );
    }
    return { approver, target };
  }

  async updateUserKycFlag(tx, userId, isVerified) {
    await tx
      .update(usersTable)
      .set({ isKycVerified: isVerified, updatedAt: new Date() })
      .where(eq(usersTable.id, userId));
  }

  async updateUserPersonalInfo(tx, userId, personalInfo) {
    await tx
      .update(usersTable)
      .set({
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        fatherName: personalInfo.fatherName || null,
        dob: personalInfo.dob,
        gender: personalInfo.gender,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, userId));
  }

  async saveUserAddress(tx, userId, tenantId, addressData) {
    await tx
      .update(addressesTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(addressesTable.userId, userId));

    // Insert new address
    const addressId = randomUUID();
    await tx.insert(addressesTable).values({
      id: addressId,
      userId,
      tenantId,
      address: addressData.address,
      pinCode: addressData.pinCode,
      stateId: addressData.stateId,
      cityId: addressData.cityId,
      addressType: 'HOME',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return addressId;
  }

  async submitKyc(payload, actor) {
    const { userId, personalInfo, address, documents = [] } = payload;

    if (!userId) throw ApiError.badRequest('User ID is required');
    if (!actor?.id) throw ApiError.unauthorized('Actor is required');

    // 👤 EMPLOYEE BLOCK: Submit sirf User karega
    if (actor.type === 'EMPLOYEE') {
      throw ApiError.forbidden('Employees cannot submit KYC');
    }

    if (!personalInfo) throw ApiError.badRequest('Personal info is required');
    if (!address) throw ApiError.badRequest('Address is required');

    return await db.transaction(async (tx) => {
      const targetUser = await this.getUserWithRole(tx, userId);
      if (!targetUser) throw ApiError.notFound('User not found');

      const isSelf = actor.id === userId;
      const isParent = await this.isDirectParent(tx, actor.id, userId);
      if (!isSelf && !isParent) {
        throw ApiError.forbidden(
          'You can only submit KYC for yourself or your direct downline',
        );
      }
      if (targetUser.role?.roleCode === 'AZZUNIQUE') {
        throw ApiError.badRequest('Root user does not require KYC');
      }

      // 🔥 Step 1 & 2: Update personal info in users table
      await this.updateUserPersonalInfo(tx, userId, personalInfo);

      // 🔥 Step 3: Save address in user_addresses table
      await this.saveUserAddress(tx, userId, targetUser.tenantId, address);

      // 🔥 Step 4: Handle KYC record and documents
      const [existingKyc] = await tx
        .select({ id: usersKycTable.id, status: usersKycTable.status })
        .from(usersKycTable)
        .where(eq(usersKycTable.userId, userId))
        .limit(1);

      let kycId;
      const now = new Date();

      if (existingKyc) {
        if (existingKyc.status === KYC_STATUS.VERIFIED) {
          throw ApiError.badRequest(
            'KYC is already verified. Contact admin for re-verification.',
          );
        }
        kycId = existingKyc.id;
        await tx
          .update(usersKycTable)
          .set({
            status: KYC_STATUS.PENDING,
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
          .where(eq(usersKycTable.id, kycId));
      } else {
        kycId = randomUUID();
        await tx.insert(usersKycTable).values({
          id: kycId,
          userId,
          tenantId: targetUser.tenantId,
          status: KYC_STATUS.PENDING,
          submittedByUserId: actor.id,
          submittedAt: now,
          createdAt: now,
          updatedAt: now,
        });
      }

      // Save documents
      if (documents.length > 0) {
        for (const doc of documents) {
          await this.addKycDocument(tx, {
            userKycId: kycId,
            userId,
            tenantId: targetUser.tenantId,
            documentType: doc.documentType,
            documentNumber: doc.documentNumber,
            documentUrl: doc.documentUrl,
            documentBackUrl: doc.documentBackUrl || null,
          });
        }
      }

      return {
        success: true,
        kycId,
        status: KYC_STATUS.PENDING,
        message: 'KYC submitted successfully and pending approval',
      };
    });
  }

  async resubmitKyc(payload, actor) {
    const { userId, kycId, personalInfo, address, documents = [] } = payload;

    if (!userId) throw ApiError.badRequest('User ID is required');
    if (!kycId)
      throw ApiError.badRequest('KYC ID is required for resubmission');
    if (!actor?.id) throw ApiError.unauthorized('Actor is required');

    // 👤 EMPLOYEE BLOCK: Submit sirf User karega
    if (actor.type === 'EMPLOYEE') {
      throw ApiError.forbidden('Employees cannot resubmit KYC');
    }

    if (!personalInfo) throw ApiError.badRequest('Personal info is required');
    if (!address) throw ApiError.badRequest('Address is required');

    return await db.transaction(async (tx) => {
      const targetUser = await this.getUserWithRole(tx, userId);
      if (!targetUser) throw ApiError.notFound('User not found');

      const isSelf = actor.id === userId;
      const isParent = await this.isDirectParent(tx, actor.id, userId);
      if (!isSelf && !isParent) {
        throw ApiError.forbidden(
          'You can only resubmit KYC for yourself or your direct downline',
        );
      }
      if (targetUser.role?.roleCode === 'AZZUNIQUE') {
        throw ApiError.badRequest('Root user does not require KYC');
      }

      // ✅ FIX: Use kycId from payload instead of querying
      const [existingKyc] = await tx
        .select({ id: usersKycTable.id, status: usersKycTable.status })
        .from(usersKycTable)
        .where(eq(usersKycTable.id, kycId))
        .limit(1);

      if (!existingKyc) {
        throw ApiError.badRequest(
          'No previous KYC found. Please submit fresh KYC.',
        );
      }
      if (existingKyc.status === KYC_STATUS.VERIFIED) {
        throw ApiError.badRequest(
          'KYC is already verified. Contact admin for re-verification.',
        );
      }
      if (existingKyc.status !== KYC_STATUS.REJECTED) {
        throw ApiError.badRequest('Only rejected KYC can be resubmitted.');
      }

      if (existingKyc.id !== kycId) {
        throw ApiError.badRequest('KYC ID mismatch');
      }

      // Update personal info
      await this.updateUserPersonalInfo(tx, userId, personalInfo);

      // Save address
      await this.saveUserAddress(tx, userId, targetUser.tenantId, address);

      // Reset KYC status to PENDING
      const now = new Date();

      await tx
        .update(usersKycTable)
        .set({
          status: KYC_STATUS.PENDING,
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
        .where(eq(usersKycTable.id, kycId));

      // Soft-delete old active documents
      await tx
        .update(kycDocumentTable)
        .set({ isActive: false, updatedAt: now })
        .where(
          and(
            eq(kycDocumentTable.userKycId, kycId),
            eq(kycDocumentTable.isActive, true),
          ),
        );

      // Save new documents
      if (documents.length > 0) {
        for (const doc of documents) {
          await this.addKycDocument(tx, {
            userKycId: kycId,
            userId,
            tenantId: targetUser.tenantId,
            documentType: doc.documentType,
            documentNumber: doc.documentNumber,
            documentUrl: doc.documentUrl,
            documentBackUrl: doc.documentBackUrl || null,
          });
        }
      }

      return {
        success: true,
        kycId,
        status: KYC_STATUS.PENDING,
        message: 'KYC resubmitted successfully and pending approval',
      };
    });
  }

  async addKycDocument(
    tx,
    {
      userKycId,
      userId,
      tenantId,
      documentType,
      documentNumber,
      documentUrl,
      documentBackUrl,
    },
  ) {
    const validDocTypes = [
      'PAN',
      'AADHAAR_FRONT',
      'AADHAAR_BACK',
      'ADDRESS_PROOF',
      'USER_PHOTO',
    ];

    if (!validDocTypes.includes(documentType)) {
      throw ApiError.badRequest(`Invalid document type: ${documentType}`);
    }

    const [existingDoc] = await tx
      .select({ id: kycDocumentTable.id })
      .from(kycDocumentTable)
      .where(
        and(
          eq(kycDocumentTable.userKycId, userKycId),
          eq(kycDocumentTable.documentType, documentType),
          eq(kycDocumentTable.isActive, true),
        ),
      )
      .limit(1);

    if (existingDoc) {
      await tx
        .update(kycDocumentTable)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(kycDocumentTable.id, existingDoc.id));
    }

    const docId = randomUUID();
    await tx.insert(kycDocumentTable).values({
      id: docId,
      userKycId,
      userId,
      tenantId,
      documentType,
      documentNumber,
      documentUrl,
      documentBackUrl,
      verificationStatus: KYC_STATUS.PENDING,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docId;
  }

  async approveKyc(payload, actor) {
    const { kycId, approvalNotes } = payload;
    if (!kycId) throw ApiError.badRequest('KYC ID is required');
    if (!actor?.id) throw ApiError.unauthorized('Actor is required');

    return await db.transaction(async (tx) => {
      const [kycRecord] = await tx
        .select({
          id: usersKycTable.id,
          userId: usersKycTable.userId,
          status: usersKycTable.status,
        })
        .from(usersKycTable)
        .where(eq(usersKycTable.id, kycId))
        .limit(1);

      if (!kycRecord) throw ApiError.notFound('KYC record not found');
      if (kycRecord.status === KYC_STATUS.VERIFIED) {
        throw ApiError.badRequest('KYC is already verified');
      }

      // 👤 EMPLOYEE vs USER validation
      if (actor.type === 'EMPLOYEE') {
        await this.validateEmployeeActor(actor);

        const [employee] = await tx
          .select({ tenantId: employeesTable.tenantId })
          .from(employeesTable)
          .where(eq(employeesTable.id, actor.id))
          .limit(1);

        // 🔥 FIX: Tenant owner dhundo
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

        // 🔥 FIX: Check karo ki target user owner ki direct downline hai ya nahi
        const isOwnerDownline = await this.isDirectParent(
          tx,
          tenantOwner.id,
          kycRecord.userId,
        );
        if (!isOwnerDownline) {
          throw ApiError.forbidden(
            "You can only approve KYC for your tenant owner's direct downline members",
          );
        }

        const target = await this.getUserWithRole(tx, kycRecord.userId);
        if (target.role?.roleCode === 'AZZUNIQUE') {
          throw ApiError.badRequest('Root user does not require KYC approval');
        }
      } else {
        await this.validateApprovalAuthority(tx, actor.id, kycRecord.userId);
      }

      const now = new Date();

      await tx
        .update(usersKycTable)
        .set({
          status: KYC_STATUS.VERIFIED,
          approvedByUserId: actor.type === 'USER' ? actor.id : null,
          approvedByEmployeeId: actor.type === 'EMPLOYEE' ? actor.id : null,
          approvedAt: now,
          approvalNotes: approvalNotes || null,
          updatedAt: now,
        })
        .where(eq(usersKycTable.id, kycId));

      await tx
        .update(kycDocumentTable)
        .set({
          verificationStatus: KYC_STATUS.VERIFIED,
          updatedAt: now,
        })
        .where(
          and(
            eq(kycDocumentTable.userKycId, kycId),
            eq(kycDocumentTable.isActive, true),
          ),
        );

      await this.updateUserKycFlag(tx, kycRecord.userId, true);

      return {
        success: true,
        kycId,
        status: KYC_STATUS.VERIFIED,
        message: 'KYC approved successfully',
      };
    });
  }

  async rejectKyc(payload, actor) {
    const { kycId, rejectionReason } = payload;
    if (!kycId) throw ApiError.badRequest('KYC ID is required');
    if (!rejectionReason)
      throw ApiError.badRequest('Rejection reason is required');
    if (!actor?.id) throw ApiError.unauthorized('Actor is required');

    return await db.transaction(async (tx) => {
      const [kycRecord] = await tx
        .select({
          id: usersKycTable.id,
          userId: usersKycTable.userId,
          status: usersKycTable.status,
        })
        .from(usersKycTable)
        .where(eq(usersKycTable.id, kycId))
        .limit(1);

      if (!kycRecord) throw ApiError.notFound('KYC record not found');
      if (kycRecord.status === KYC_STATUS.REJECTED) {
        throw ApiError.badRequest('KYC is already rejected');
      }

      // 👤 EMPLOYEE vs USER validation
      if (actor.type === 'EMPLOYEE') {
        await this.validateEmployeeActor(actor);

        const [employee] = await tx
          .select({ tenantId: employeesTable.tenantId })
          .from(employeesTable)
          .where(eq(employeesTable.id, actor.id))
          .limit(1);

        // 🔥 FIX: Tenant owner dhundo
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

        // 🔥 FIX: Check karo ki target user owner ki direct downline hai ya nahi
        const isOwnerDownline = await this.isDirectParent(
          tx,
          tenantOwner.id,
          kycRecord.userId,
        );
        if (!isOwnerDownline) {
          throw ApiError.forbidden(
            "You can only reject KYC for your tenant owner's direct downline members",
          );
        }

        const target = await this.getUserWithRole(tx, kycRecord.userId);
        if (target.role?.roleCode === 'AZZUNIQUE') {
          throw ApiError.badRequest('Root user does not require KYC rejection');
        }
      } else {
        await this.validateApprovalAuthority(tx, actor.id, kycRecord.userId);
      }

      const now = new Date();

      await tx
        .update(usersKycTable)
        .set({
          status: KYC_STATUS.REJECTED,
          rejectedByUserId: actor.type === 'USER' ? actor.id : null,
          rejectedByEmployeeId: actor.type === 'EMPLOYEE' ? actor.id : null,
          rejectedAt: now,
          rejectionReason,
          updatedAt: now,
        })
        .where(eq(usersKycTable.id, kycId));

      await tx
        .update(kycDocumentTable)
        .set({
          verificationStatus: KYC_STATUS.REJECTED,
          updatedAt: now,
        })
        .where(
          and(
            eq(kycDocumentTable.userKycId, kycId),
            eq(kycDocumentTable.isActive, true),
          ),
        );

      await this.updateUserKycFlag(tx, kycRecord.userId, false);

      return {
        success: true,
        kycId,
        status: KYC_STATUS.REJECTED,
        message: 'KYC rejected successfully',
      };
    });
  }

  async getKycStatus(userId, actor) {
    if (!userId) throw ApiError.badRequest('User ID is required');

    const isSelf = actor?.id === userId;
    const hasDownlineAccess = await this.checkDownlineAccess(actor, userId);
    if (!isSelf && !hasDownlineAccess) {
      throw ApiError.forbidden(
        'You can only view KYC for yourself or your downline',
      );
    }

    const [kycRecord] = await db
      .select({
        id: usersKycTable.id,
        userId: usersKycTable.userId,
        status: usersKycTable.status,
        submittedAt: usersKycTable.submittedAt,
        submittedByUserId: usersKycTable.submittedByUserId,
        approvedAt: usersKycTable.approvedAt,
        approvedByUserId: usersKycTable.approvedByUserId,
        approvalNotes: usersKycTable.approvalNotes,
        rejectedAt: usersKycTable.rejectedAt,
        rejectedByUserId: usersKycTable.rejectedByUserId,
        rejectionReason: usersKycTable.rejectionReason,
        createdAt: usersKycTable.createdAt,
        updatedAt: usersKycTable.updatedAt,
      })
      .from(usersKycTable)
      .where(eq(usersKycTable.userId, userId))
      .limit(1);

    if (!kycRecord) {
      return {
        userId,
        status: 'NOT_SUBMITTED',
        documents: [],
        address: null,
        personalInfo: null,
      };
    }

    const documents = await db
      .select({
        id: kycDocumentTable.id,
        documentType: kycDocumentTable.documentType,
        documentNumber: kycDocumentTable.documentNumber,
        documentUrl: kycDocumentTable.documentUrl,
        documentBackUrl: kycDocumentTable.documentBackUrl,
        verificationStatus: kycDocumentTable.verificationStatus,
        isActive: kycDocumentTable.isActive,
        createdAt: kycDocumentTable.createdAt,
      })
      .from(kycDocumentTable)
      .where(
        and(
          eq(kycDocumentTable.userKycId, kycRecord.id),
          eq(kycDocumentTable.isActive, true),
        ),
      )
      .orderBy(desc(kycDocumentTable.createdAt));

    const [address] = await db
      .select({
        id: addressesTable.id,
        address: addressesTable.address,
        pinCode: addressesTable.pinCode,
        stateId: addressesTable.stateId,
        cityId: addressesTable.cityId,
      })
      .from(addressesTable)
      .where(
        and(
          eq(addressesTable.userId, userId),
          eq(addressesTable.isActive, true),
        ),
      )
      .limit(1);

    const [userInfo] = await db
      .select({
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        fatherName: usersTable.fatherName,
        dob: usersTable.dob,
        gender: usersTable.gender,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    return {
      ...kycRecord,
      documents,
      address,
      personalInfo: userInfo || null,
    };
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

  async getKycsForApprover(actor, query = {}) {
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

      // 🔥 FIX: Tenant owner dhundo (AZZUNIQUE/RESELLER/WHITELABEL)
      const [tenant] = await db
        .select({ userType: tenantsTable.userType })
        .from(tenantsTable)
        .where(eq(tenantsTable.id, employee.tenantId))
        .limit(1);

      const ownerRoleCode = tenant?.userType; // 'AZZUNIQUE' | 'RESELLER' | 'WHITELABEL'

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

      // 🔥 FIX: Owner ki direct downline lo — bilkul waisa hi jaise USER branch mein hota hai
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

    const whereConditions = [inArray(usersKycTable.userId, userIdsToFilter)];

    if (statusFilter !== 'ALL') {
      whereConditions.push(eq(usersKycTable.status, statusFilter));
    }

    if (query.tenantId) {
      whereConditions.push(eq(usersKycTable.tenantId, query.tenantId));
    }

    // ... baaki code same rahega (count, kycs query, documents join, return)
    const [countResult] = await db
      .select({ count: sql`COUNT(*)`.mapWith(Number) })
      .from(usersKycTable)
      .where(and(...whereConditions));

    const kycs = await db
      .select({
        id: usersKycTable.id,
        userId: usersKycTable.userId,
        status: usersKycTable.status,
        submittedAt: usersKycTable.submittedAt,
        submittedByUserId: usersKycTable.submittedByUserId,
        approvedAt: usersKycTable.approvedAt,
        approvedByUserId: usersKycTable.approvedByUserId,
        approvedByEmployeeId: usersKycTable.approvedByEmployeeId,
        approvalNotes: usersKycTable.approvalNotes,
        rejectedAt: usersKycTable.rejectedAt,
        rejectedByUserId: usersKycTable.rejectedByUserId,
        rejectedByEmployeeId: usersKycTable.rejectedByEmployeeId,
        rejectionReason: usersKycTable.rejectionReason,
        createdAt: usersKycTable.createdAt,
        updatedAt: usersKycTable.updatedAt,
        user: {
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
          email: usersTable.email,
          mobileNumber: usersTable.mobileNumber,
        },
        role: { roleName: roleTable.roleName, roleCode: roleTable.roleCode },
      })
      .from(usersKycTable)
      .leftJoin(usersTable, eq(usersKycTable.userId, usersTable.id))
      .leftJoin(roleTable, eq(usersTable.roleId, roleTable.id))
      .where(and(...whereConditions))
      .orderBy(desc(usersKycTable.submittedAt))
      .limit(limit)
      .offset(offset);

    const kycIds = kycs.map((k) => k.id);
    let documentsMap = {};

    if (kycIds.length > 0) {
      const documents = await db
        .select({
          id: kycDocumentTable.id,
          userKycId: kycDocumentTable.userKycId,
          documentType: kycDocumentTable.documentType,
          documentNumber: kycDocumentTable.documentNumber,
          documentUrl: kycDocumentTable.documentUrl,
          documentBackUrl: kycDocumentTable.documentBackUrl,
          verificationStatus: kycDocumentTable.verificationStatus,
          isActive: kycDocumentTable.isActive,
          createdAt: kycDocumentTable.createdAt,
        })
        .from(kycDocumentTable)
        .where(
          and(
            inArray(kycDocumentTable.userKycId, kycIds),
            eq(kycDocumentTable.isActive, true),
          ),
        )
        .orderBy(desc(kycDocumentTable.createdAt));

      for (const doc of documents) {
        if (!documentsMap[doc.userKycId]) {
          documentsMap[doc.userKycId] = [];
        }
        documentsMap[doc.userKycId].push(doc);
      }
    }

    const data = kycs.map((kyc) => ({
      ...kyc,
      documents: documentsMap[kyc.id] || [],
    }));

    return {
      data,
      meta: {
        page,
        limit,
        total: countResult.count,
        totalPages: Math.ceil(countResult.count / limit),
      },
    };
  }
}

export default new KycService();
