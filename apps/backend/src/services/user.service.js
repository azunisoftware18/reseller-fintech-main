import {
  permissionTable,
  rolePermissionTable,
  roleTable,
  smtpConfigTable,
  tenantsTable,
  userPermissionTable,
  usersTable,
} from '../models/core/index.js';
import { randomUUID } from 'node:crypto';
import {
  decrypt,
  encrypt,
  generateNumber,
  generatePassword,
  generatePrefix,
  generateTransactionPin,
} from '../lib/lib.js';
import { db } from '../database/core/core-db.js';
import { ApiError } from '../lib/ApiError.js';
import { eq, and, or, desc, isNull, like, inArray, ne, sql } from 'drizzle-orm';
import { eventBus } from '../events/events.js';
import { EVENTS } from '../events/events.constants.js';
import s3Service from '../lib/S3Service.js';
import { resolvePermissions } from './permission.resolver.js';
import { buildVisibilityCondition } from '../lib/visibility.utils.js';
import WalletService from './wallet.service.js';

class UserService {
  async create(data, actor) {
    const [targetRole] = await db
      .select({
        id: roleTable.id,
        roleLevel: roleTable.roleLevel,
        roleCode: roleTable.roleCode,
      })
      .from(roleTable)
      .where(eq(roleTable.id, data.roleId))
      .limit(1);

    if (!targetRole) {
      throw ApiError.badRequest('Invalid role ID');
    }

    const [actorRole] = await db
      .select({
        id: roleTable.id,
        roleLevel: roleTable.roleLevel,
      })
      .from(roleTable)
      .where(eq(roleTable.id, actor.roleId))
      .limit(1);

    if (!actorRole) {
      throw ApiError.forbidden('Invalid actor role');
    }

    // SMTP must exist
    const [smtp] = await db
      .select({ id: smtpConfigTable.id })
      .from(smtpConfigTable)
      .where(eq(smtpConfigTable.tenantId, actor.tenantId))
      .limit(1);

    if (!smtp) {
      throw ApiError.badRequest('SMTP must be configured first');
    }

    if (actorRole.roleLevel >= targetRole.roleLevel) {
      throw ApiError.forbidden(
        'You cannot create a user with equal or higher role',
      );
    }

    const canOverrideTenant =
      actorRole.roleLevel === 0 || actorRole.roleLevel === 1;

    const resolvedTenantId = canOverrideTenant
      ? (data.tenantId ?? actor.tenantId)
      : actor.tenantId;

    if (canOverrideTenant && !resolvedTenantId) {
      throw ApiError.badRequest(
        'tenantId is required for AZZUNIQUE and RESELLER',
      );
    }

    const [tenant] = await db
      .select({ id: tenantsTable.id })
      .from(tenantsTable)
      .where(eq(tenantsTable.id, resolvedTenantId))
      .limit(1);

    if (!tenant) {
      throw ApiError.badRequest('Invalid tenant');
    }

    const [existingOwner] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(
        and(
          eq(usersTable.tenantId, resolvedTenantId),
          isNull(usersTable.ownerUserId),
        ),
      )
      .limit(1);

    const isCreatingFirstOwner = !existingOwner;

    const isSameTenant = actor.tenantId === resolvedTenantId;

    const isParentCreatingFirstOwner =
      actor.isTenantOwner === true &&
      !isSameTenant &&
      isCreatingFirstOwner &&
      actorRole.roleLevel <= 1; // AZZUNIQUE / RESELLER only

    if (!isSameTenant && !isParentCreatingFirstOwner) {
      throw ApiError.forbidden('You can create users only for your own tenant');
    }

    const [exists] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(
        and(
          eq(usersTable.tenantId, resolvedTenantId),
          or(
            eq(usersTable.email, data.email),
            eq(usersTable.mobileNumber, data.mobileNumber),
          ),
        ),
      )
      .limit(1);

    if (exists) {
      throw ApiError.conflict('User already exists in this tenant');
    }

    let ownerUserId;

    if (isParentCreatingFirstOwner) {
      ownerUserId = null;
    } else if (isCreatingFirstOwner) {
      ownerUserId = null;
    } else {
      ownerUserId = actor.id;
    }

    const password = generatePassword();
    const pin = generateTransactionPin();
    const userId = randomUUID();
    const rolePrefix = generatePrefix(targetRole.roleCode);

    const payload = {
      id: userId,
      userNumber: generateNumber(rolePrefix),
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      mobileNumber: data.mobileNumber,

      tenantId: resolvedTenantId,
      roleId: data.roleId,

      passwordHash: encrypt(password),
      transactionPinHash: encrypt(pin),

      ownerUserId: ownerUserId,

      createdByUserId: actor.type === 'USER' ? actor.id : null,
      createdByEmployeeId: actor.type === 'EMPLOYEE' ? actor.id : null,

      userStatus: 'INACTIVE',
      isKycVerified: false,
      actionReason: 'Kindly contact the administrator to activate your account',

      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.transaction(async (tx) => {
      await tx.insert(usersTable).values(payload);

      await WalletService.createDefaultUserWallets({
        id: userId,
        tenantId: resolvedTenantId,
        roleCode: targetRole.roleCode,
      });
    });

    const sent = eventBus.emit(EVENTS.USER_CREATED, {
      userId,
      userNumber: payload.userNumber,
      email: payload.email,
      password,
      transactionPin: pin,
      tenantId: actor.tenantId,
    });

    if (!sent) {
      throw ApiError.internal('Failed to send credentials');
    }

    return this.findOne(userId, actor);
  }

  async findAll(query = {}, actor) {
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    const offset = (page - 1) * limit;

    const [actorRole] = await db
      .select({
        roleLevel: roleTable.roleLevel,
        roleCode: roleTable.roleCode,
      })
      .from(roleTable)
      .where(eq(roleTable.id, actor.roleId))
      .limit(1);

    if (!actorRole) {
      throw ApiError.forbidden('Invalid actor role');
    }

    const conditions = [ne(usersTable.id, actor.id)];

    if (actorRole.roleCode === 'WHITE_LABEL') {
      conditions.push(eq(usersTable.tenantId, actor.tenantId));
    } else {
      conditions.push(buildVisibilityCondition(actor, actorRole));
    }

    if (query.status) {
      conditions.push(eq(usersTable.userStatus, query.status.toUpperCase()));
    }

    if (query.search) {
      const searchTerm = `%${query.search}%`;

      conditions.push(
        or(
          like(usersTable.email, searchTerm),
          like(usersTable.mobileNumber, searchTerm),
          like(usersTable.userNumber, searchTerm),
          like(usersTable.firstName, searchTerm),
          like(usersTable.lastName, searchTerm),

          like(tenantsTable.tenantNumber, searchTerm),
          like(tenantsTable.tenantName, searchTerm),
        ),
      );
    }

    const [{ count }] = await db
      .select({
        count: sql`COUNT(*)`.mapWith(Number),
      })
      .from(usersTable)
      .leftJoin(tenantsTable, eq(usersTable.tenantId, tenantsTable.id))
      .where(and(...conditions));

    const statsRows = await db
      .select({
        status: usersTable.userStatus,
        count: sql`COUNT(*)`.mapWith(Number),
      })
      .from(usersTable)
      .leftJoin(tenantsTable, eq(usersTable.tenantId, tenantsTable.id))
      .where(and(...conditions))
      .groupBy(usersTable.userStatus);

    const stats = {
      ACTIVE: 0,
      INACTIVE: 0,
      SUSPENDED: 0,
      DELETED: 0,
    };

    statsRows.forEach((row) => {
      stats[row.status] = row.count;
    });

    const rows = await db
      .select({
        users: usersTable,
        tenants: tenantsTable,
      })
      .from(usersTable)
      .leftJoin(tenantsTable, eq(usersTable.tenantId, tenantsTable.id))
      .where(and(...conditions))
      .orderBy(desc(usersTable.createdAt))
      .limit(limit)
      .offset(offset);

    const userIds = rows.map((r) => r.users.id);
    const roleIds = [...new Set(rows.map((r) => r.users.roleId))];

    const rolePermissions = await db
      .select({
        roleId: rolePermissionTable.roleId,
        permissionId: permissionTable.id,
        resource: permissionTable.resource,
        action: permissionTable.action,
      })
      .from(rolePermissionTable)
      .leftJoin(
        permissionTable,
        eq(permissionTable.id, rolePermissionTable.permissionId),
      )
      .where(inArray(rolePermissionTable.roleId, roleIds));

    const userPermissions = await db
      .select({
        userId: userPermissionTable.userId,
        permissionId: permissionTable.id,
        resource: permissionTable.resource,
        action: permissionTable.action,
        effect: userPermissionTable.effect,
      })
      .from(userPermissionTable)
      .leftJoin(
        permissionTable,
        eq(permissionTable.id, userPermissionTable.permissionId),
      )
      .where(inArray(userPermissionTable.userId, userIds));

    const rolePermMap = new Map();
    rolePermissions.forEach((p) => {
      if (!rolePermMap.has(p.roleId)) rolePermMap.set(p.roleId, []);
      rolePermMap.get(p.roleId).push({
        id: p.permissionId,
        resource: p.resource,
        action: p.action,
        source: 'ROLE',
      });
    });

    const userPermMap = new Map();
    userPermissions.forEach((p) => {
      if (!userPermMap.has(p.userId)) userPermMap.set(p.userId, []);
      userPermMap.get(p.userId).push({
        id: p.permissionId,
        resource: p.resource,
        action: p.action,
        effect: p.effect,
        source: 'USER',
      });
    });

    // ✅ FIX: Collect both ownerUserId AND createdByUserId for parent lookup
    const parentUserIds = new Set();
    rows.forEach((r) => {
      if (r.users.ownerUserId) {
        parentUserIds.add(r.users.ownerUserId);
      } else if (r.users.createdByUserId) {
        parentUserIds.add(r.users.createdByUserId);
      }
    });

    const ownerUserIds = Array.from(parentUserIds);

    let parentUsers = [];
    let parentRoleIds = [];

    if (ownerUserIds.length > 0) {
      parentUsers = await db
        .select({
          id: usersTable.id,
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
          email: usersTable.email,
          roleId: usersTable.roleId,
        })
        .from(usersTable)
        .where(inArray(usersTable.id, ownerUserIds));

      parentRoleIds = [...new Set(parentUsers.map((u) => u.roleId))];
    }

    let parentRoles = [];
    if (parentRoleIds.length > 0) {
      parentRoles = await db
        .select({
          id: roleTable.id,
          roleName: roleTable.roleName,
          roleCode: roleTable.roleCode,
        })
        .from(roleTable)
        .where(inArray(roleTable.id, parentRoleIds));
    }

    const parentRoleMap = new Map();
    parentRoles.forEach((r) => parentRoleMap.set(r.id, r));

    const parentMap = new Map();
    parentUsers.forEach((u) => {
      parentMap.set(u.id, {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        roleName: parentRoleMap.get(u.roleId)?.roleName || null,
        roleCode: parentRoleMap.get(u.roleId)?.roleCode || null,
      });
    });

    const formattedUsers = rows.map(({ users, tenants }) => {
      // ✅ FIX: Use ownerUserId if set, else fallback to createdByUserId
      const parentId = users.ownerUserId || users.createdByUserId;
      const parent = parentId ? parentMap.get(parentId) || null : null;

      return {
        ...users,

        fullName: `${users.firstName || ''} ${users.lastName || ''}`.trim(),

        password: decrypt(users.passwordHash),

        profilePictureUrl: users.profilePicture
          ? s3Service.buildS3Url(users.profilePicture)
          : null,

        tenantId: tenants?.id || null,
        tenantNumber: tenants?.tenantNumber || null,
        tenantName: tenants?.tenantName || null,
        tenantLegalName: tenants?.tenantLegalName || null,
        tenantType: tenants?.tenantType || null,
        userType: tenants?.userType || null,
        tenantEmail: tenants?.tenantEmail || null,
        tenantWhatsapp: tenants?.tenantWhatsapp || null,
        tenantStatus: tenants?.tenantStatus || null,

        rolePermissions: rolePermMap.get(users.roleId) || [],
        userPermissions: userPermMap.get(users.id) || [],

        parent: parent
          ? {
              id: parent.id,
              fullName:
                `${parent.firstName || ''} ${parent.lastName || ''}`.trim(),
              email: parent.email,
              roleName: parent.roleName,
              roleCode: parent.roleCode,
            }
          : null,
      };
    });

    return {
      data: formattedUsers,

      meta: {
        total: count,
        page,
        limit,
        stats,
      },
    };
  }

  async findOne(id, actor) {
    // 1️⃣ Actor role
    const [actorRole] = await db
      .select({ roleLevel: roleTable.roleLevel })
      .from(roleTable)
      .where(eq(roleTable.id, actor.roleId))
      .limit(1);

    if (!actorRole) {
      throw ApiError.forbidden('Invalid actor role');
    }

    // 2️⃣ Target user
    const [row] = await db
      .select({
        users: usersTable,
        tenants: tenantsTable,
      })
      .from(usersTable)
      .leftJoin(tenantsTable, eq(usersTable.tenantId, tenantsTable.id))
      .where(eq(usersTable.id, id))
      .limit(1);

    if (!row) {
      throw ApiError.notFound('User not found');
    }

    const user = row.users;

    // 3️⃣ READ ACCESS RULES (EXPLICIT)

    if (actorRole.roleLevel !== 0) {
      const isSameTenant = user.tenantId === actor.tenantId;
      const isOwner = user.ownerUserId === actor.id;

      const isParentAccessingFirstOwner =
        actor.isTenantOwner === true &&
        user.ownerUserId === null &&
        user.tenantId !== actor.tenantId &&
        user.createdByUserId === actor.id;

      if (!isSameTenant && !isOwner && !isParentAccessingFirstOwner) {
        throw ApiError.forbidden('Cross-tenant access denied');
      }
    }

    // 🔑 Role permissions
    const rolePermissions = await db
      .select({
        permissionId: permissionTable.id,
        resource: permissionTable.resource,
        action: permissionTable.action,
      })
      .from(rolePermissionTable)
      .leftJoin(
        permissionTable,
        eq(permissionTable.id, rolePermissionTable.permissionId),
      )
      .where(eq(rolePermissionTable.roleId, user.roleId));

    // 🔑 User permission overrides
    const userPermissions = await db
      .select({
        permissionId: permissionTable.id,
        resource: permissionTable.resource,
        action: permissionTable.action,
        effect: userPermissionTable.effect,
      })
      .from(userPermissionTable)
      .leftJoin(
        permissionTable,
        eq(permissionTable.id, userPermissionTable.permissionId),
      )
      .where(eq(userPermissionTable.userId, user.id));

    return {
      ...user,
      profilePictureUrl: user.profilePicture
        ? s3Service.buildS3Url(user.profilePicture)
        : null,

      rolePermissions: rolePermissions.map((p) => ({
        id: p.permissionId,
        resource: p.resource,
        action: p.action,
      })),

      userPermissions: userPermissions.map((p) => ({
        id: p.permissionId,
        resource: p.resource,
        action: p.action,
        effect: p.effect,
      })),
    };
  }

  async update(id, data, actor, file) {
    // 1️⃣ Fetch target user (RAW DB ROW — WRITE SAFE)
    const [existingUser] = await db
      .select({
        id: usersTable.id,
        tenantId: usersTable.tenantId,
        ownerUserId: usersTable.ownerUserId,
        createdByUserId: usersTable.createdByUserId,
        roleId: usersTable.roleId,
        email: usersTable.email,
        mobileNumber: usersTable.mobileNumber,
        profilePicture: usersTable.profilePicture,
        userStatus: usersTable.userStatus,
      })
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    if (!existingUser) {
      throw ApiError.notFound('User not found');
    }

    // Protect ROOT SYSTEM USER (AZZUNIQUE ROOT)
    if (
      existingUser.ownerUserId === null &&
      existingUser.createdByUserId === null
    ) {
      throw ApiError.forbidden('Root system user cannot be modified');
    }

    // 2️⃣ Fetch actor role
    const [actorRole] = await db
      .select({
        roleLevel: roleTable.roleLevel,
      })
      .from(roleTable)
      .where(eq(roleTable.id, actor.roleId))
      .limit(1);

    if (!actorRole) {
      throw ApiError.forbidden('Invalid actor role');
    }

    // 3️⃣ WRITE ACCESS RULES (OWNERSHIP BASED)

    const isSameTenant = existingUser.tenantId === actor.tenantId;

    // Direct ownership (AZZUNIQUE → Reseller, Reseller → White-label)
    const isDirectOwner = existingUser.ownerUserId === actor.id;

    // Bootstrap ownership (first owner created by parent)
    const isBootstrapOwnerCreator =
      existingUser.ownerUserId === null &&
      existingUser.createdByUserId === actor.id;

    // Tenant owner inside own tenant
    const isTenantOwner = actor.isTenantOwner === true && isSameTenant;

    const canUpdate = isDirectOwner || isBootstrapOwnerCreator || isTenantOwner;

    if (!canUpdate) {
      throw ApiError.forbidden('You are not allowed to update this user');
    }

    // 4️⃣ EMAIL DUPLICATE CHECK
    if (data.email && data.email !== existingUser.email) {
      const [emailExists] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(
          and(
            eq(usersTable.email, data.email),
            eq(usersTable.tenantId, existingUser.tenantId),
            ne(usersTable.id, id),
          ),
        )
        .limit(1);

      if (emailExists) {
        throw ApiError.badRequest('Email already exists');
      }
    }

    // 5️⃣ MOBILE DUPLICATE CHECK
    if (data.mobileNumber && data.mobileNumber !== existingUser.mobileNumber) {
      const [mobileExists] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(
          and(
            eq(usersTable.mobileNumber, data.mobileNumber),
            eq(usersTable.tenantId, existingUser.tenantId),
            ne(usersTable.id, id),
          ),
        )
        .limit(1);

      if (mobileExists) {
        throw ApiError.badRequest('Mobile number already exists');
      }
    }

    // 6️⃣ FIX-1 — ROLE ESCALATION PROTECTION
    if (data.roleId && data.roleId !== existingUser.roleId) {
      const [newRole] = await db
        .select({
          roleLevel: roleTable.roleLevel,
          isSystem: roleTable.isSystem,
        })
        .from(roleTable)
        .where(eq(roleTable.id, data.roleId))
        .limit(1);

      if (!newRole) {
        throw ApiError.badRequest('Invalid role ID');
      }

      // ❌ Cannot assign equal or higher role
      if (newRole.roleLevel <= actorRole.roleLevel) {
        throw ApiError.forbidden(
          'You cannot assign a role equal to or higher than your own',
        );
      }

      // ❌ System role only by tenant owner
      if (newRole.isSystem && !actor.isTenantOwner) {
        throw ApiError.forbidden('System role assignment not allowed');
      }
    }

    // 7️⃣ BUILD UPDATE PAYLOAD
    const payload = { updatedAt: new Date() };

    if (data.firstName !== undefined) payload.firstName = data.firstName;
    if (data.lastName !== undefined) payload.lastName = data.lastName;
    if (data.email !== undefined) payload.email = data.email;
    if (data.mobileNumber !== undefined)
      payload.mobileNumber = data.mobileNumber;
    if (data.roleId !== undefined) payload.roleId = data.roleId;
    if (data.userStatus !== undefined) payload.userStatus = data.userStatus;

    // 8️⃣ PROFILE IMAGE
    if (file) {
      const uploaded = await s3Service.upload(file.path, 'user-profile');

      if (existingUser.profilePicture) {
        await s3Service.deleteByKey(existingUser.profilePicture);
      }

      payload.profilePicture = uploaded.key;
    }

    // 9️⃣ STATUS CHANGE EVENT
    if (data.userStatus && data.userStatus !== existingUser.userStatus) {
      eventBus.emit(EVENTS.USER_STATUS_CHANGED, {
        tenantId: existingUser.tenantId,
        userId: id,
        oldStatus: existingUser.userStatus,
        newStatus: data.userStatus,
        actionReason: data.actionReason || null,
      });
    }

    // 🔟 UPDATE DB
    await db.update(usersTable).set(payload).where(eq(usersTable.id, id));

    // 11️⃣ RETURN READ VIEW
    return this.findOne(id, actor);
  }

  async getAllDescendants(userId, actor, query = {}) {
    // 1️⃣ Root access check
    const rootUser = await this.findOne(userId, actor);

    // 2️⃣ Pagination
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    const offset = (page - 1) * limit;

    // 3️⃣ Recursive fetch — OWNER + CREATOR BASED TREE
    const fetchChildrenTree = async (parentId) => {
      const children = await db
        .select()
        .from(usersTable)
        .where(
          and(
            or(
              // Normal ownership
              eq(usersTable.ownerUserId, parentId),

              // First owner created by parent (CRITICAL FIX)
              and(
                isNull(usersTable.ownerUserId),
                eq(usersTable.createdByUserId, parentId),
              ),
            ),
            isNull(usersTable.deletedAt),
          ),
        )
        .orderBy(desc(usersTable.createdAt));

      if (!children.length) return [];

      return Promise.all(
        children.map(async (child) => ({
          ...child,
          profilePictureUrl: child.profilePicture
            ? s3Service.buildS3Url(child.profilePicture)
            : null,
          children: await fetchChildrenTree(child.id),
        })),
      );
    };

    // 4️⃣ Build full tree
    const descendantsTree = await fetchChildrenTree(rootUser.id);

    // 5️⃣ Pagination only on first-level children
    const paginatedChildren = descendantsTree.slice(offset, offset + limit);

    return {
      total: descendantsTree.length,
      page,
      limit,
      data: {
        ...rootUser,
        children: paginatedChildren,
      },
    };
  }

  async assignPermissions(userId, permissions, actor) {
    if (
      !actor ||
      !actor.id ||
      !actor.roleId ||
      !actor.tenantId ||
      !actor.type
    ) {
      throw ApiError.unauthorized('Invalid actor context');
    }

    // 🔒 INPUT GUARD
    if (!Array.isArray(permissions) || permissions.length === 0) {
      throw ApiError.badRequest('Permissions array is required');
    }

    // 1️⃣ Fetch target user
    const [targetUser] = await db
      .select({
        id: usersTable.id,
        tenantId: usersTable.tenantId,
        ownerUserId: usersTable.ownerUserId,
        createdByUserId: usersTable.createdByUserId,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!targetUser) {
      throw ApiError.notFound('User not found');
    }

    // 2️⃣ OWNERSHIP RULES (CROSS-TENANT SAFE)
    const isSameTenant = targetUser.tenantId === actor.tenantId;

    // Tenant owner → anyone in own tenant
    const isTenantOwner = actor.isTenantOwner === true && isSameTenant;

    // Direct ownership
    const isDirectOwner = targetUser.ownerUserId === actor.id;

    // Bootstrap ownership (first owner created by actor)
    const isBootstrapOwnerCreator =
      targetUser.ownerUserId === null &&
      targetUser.createdByUserId === actor.id;

    if (!isTenantOwner && !isDirectOwner && !isBootstrapOwnerCreator) {
      throw ApiError.forbidden(
        'You can assign permissions only to your own users',
      );
    }

    // 3️⃣ Self-permission modification blocked
    if (actor.id === userId) {
      throw ApiError.forbidden('You cannot modify your own permissions');
    }

    // 4️⃣ Collect permission IDs
    const permissionIds = permissions.map((p) => p.permissionId);

    // 5️⃣ Validate permissions
    const permissionRows = await db
      .select({
        id: permissionTable.id,
        key: sql`CONCAT(${permissionTable.resource}, '.', ${permissionTable.action})`,
      })
      .from(permissionTable)
      .where(inArray(permissionTable.id, permissionIds));

    if (permissionRows.length !== permissionIds.length) {
      throw ApiError.badRequest('Invalid permission IDs');
    }

    const idToKeyMap = new Map(permissionRows.map((p) => [p.id, p.key]));

    // 6️⃣ Actor permission check
    const { permissions: actorPerms } = await resolvePermissions(actor);

    if (!actorPerms.includes('*')) {
      const forbidden = permissionIds.filter((pid) => {
        const key = idToKeyMap.get(pid);
        return !actorPerms.includes(key);
      });

      if (forbidden.length) {
        throw ApiError.forbidden(
          'You cannot assign permissions you do not have',
        );
      }
    }

    // 7️⃣ Replace permissions
    await db.transaction(async (trx) => {
      await trx
        .delete(userPermissionTable)
        .where(eq(userPermissionTable.userId, userId));

      await trx.insert(userPermissionTable).values(
        permissions.map((p) => ({
          id: randomUUID(),
          userId,
          permissionId: p.permissionId,
          effect: p.effect, // ALLOW | DENY
        })),
      );
    });
  }
}

export default new UserService();
