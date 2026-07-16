import { db } from '../database/core/core-db.js';
import {
  auditLogTable,
  usersTable,
  roleTable,
  tenantsTable,
  employeesTable,
} from '../models/core/index.js';
import { and, eq, inArray, gte, lte, desc, asc, sql, like } from 'drizzle-orm';
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

class AuditService {
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

    // Leaf roles and viewOwnOnly: only self
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
      return [actor.id, ...directIds, ...nestedIds]; // ← includes self
    }

    return [actor.id, ...directIds]; // ← includes self + downline
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

  // ========== CREATE METHODS ==========

  async createLog(data) {
    const {
      entityType,
      entityId,
      action,
      oldData,
      newData,
      performByUserId,
      performByEmployeeId,
      ipAddress,
      userAgent,
      tenantId,
      metaData,
    } = data;

    if (!entityType || !entityId || !action || !performByUserId || !tenantId) {
      throw ApiError.badRequest('Missing required audit log fields');
    }

    const [log] = await db.insert(auditLogTable).values({
      entityType,
      entityId,
      action,
      oldData: oldData || null,
      newData: newData || null,
      performByUserId,
      performByEmployeeId: performByEmployeeId || null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      tenantId,
      metaData: metaData || null,
    });

    return log;
  }

  async createAuthLog(data) {
    const {
      action,
      performByUserId,
      performByEmployeeId,
      ipAddress,
      userAgent,
      tenantId,
      metaData,
      oldData,
      newData,
    } = data;

    if (!action || (!performByUserId && !performByEmployeeId) || !tenantId) {
      throw ApiError.badRequest('Missing required auth log fields');
    }

    const [log] = await db.insert(auditLogTable).values({
      entityType: 'AUTH',
      entityId: metaData?.identifier || String(performByUserId),
      action,
      oldData: oldData || null,
      newData: newData || null,
      performByUserId: performByUserId || null,
      performByEmployeeId: performByEmployeeId || null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      tenantId,
      metaData: metaData || null,
    });

    return log;
  }

  // ========== LISTING SPECIFIC METHODS ==========

  buildAuditConditions(userIds, tenantId, query) {
    const conditions = [
      inArray(auditLogTable.performByUserId, userIds),
      eq(auditLogTable.tenantId, tenantId),
    ];

    if (query.entityType && query.entityType !== 'ALL') {
      conditions.push(eq(auditLogTable.entityType, query.entityType));
    }

    if (query.action && query.action !== 'ALL') {
      conditions.push(eq(auditLogTable.action, query.action));
    }

    if (query.fromDate) {
      conditions.push(gte(auditLogTable.createdAt, new Date(query.fromDate)));
    }

    if (query.toDate) {
      conditions.push(lte(auditLogTable.createdAt, new Date(query.toDate)));
    }

    if (query.search) {
      const searchTerm = `%${query.search}%`;
      conditions.push(
        sql`(
          ${auditLogTable.entityType} LIKE ${searchTerm} OR
          ${auditLogTable.action} LIKE ${searchTerm} OR
          ${auditLogTable.entityId} LIKE ${searchTerm}
        )`,
      );
    }

    return conditions;
  }

  getAuditSortColumn(sortBy, sortOrder) {
    const columnMap = {
      createdAt: auditLogTable.createdAt,
      entityType: auditLogTable.entityType,
      action: auditLogTable.action,
      performByUserId: auditLogTable.performByUserId,
    };

    const column = columnMap[sortBy] || auditLogTable.createdAt;
    return sortOrder === 'asc' ? asc(column) : desc(column);
  }

  async listAll(actor, query) {
    if (!actor?.id) throw ApiError.unauthorized('Actor is required');

    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    let user = await this.getUserWithRole(actor.id);
    let roleCode = user?.role?.roleCode;
    let actorId = actor.id;

    let tenantId = user?.tenantId;

    // Handle EMPLOYEE actor
    if (actor.type === 'EMPLOYEE') {
      const empData = await this.validateEmployeeActor(actor);
      roleCode = empData.tenant?.userType;
      tenantId = empData.employee.tenantId;

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
    if (!tenantId) throw ApiError.forbidden('Tenant not found');

    const visibleUserIds = await this.getVisibleUserIds(
      { id: actorId },
      roleCode,
    );

    if (visibleUserIds.length === 0) {
      return {
        logs: [],
        meta: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    const auditConditions = this.buildAuditConditions(
      visibleUserIds,
      tenantId,
      query,
    );

    const [auditCountResult] = await db
      .select({ count: sql`COUNT(*)`.mapWith(Number) })
      .from(auditLogTable)
      .where(and(...auditConditions));

    const logs = await db
      .select({
        id: auditLogTable.id,
        entityType: auditLogTable.entityType,
        entityId: auditLogTable.entityId,
        action: auditLogTable.action,
        oldData: auditLogTable.oldData,
        newData: auditLogTable.newData,
        performByUserId: auditLogTable.performByUserId,
        performByEmployeeId: auditLogTable.performByEmployeeId,
        ipAddress: auditLogTable.ipAddress,
        userAgent: auditLogTable.userAgent,
        tenantId: auditLogTable.tenantId,
        metaData: auditLogTable.metaData,
        createdAt: auditLogTable.createdAt,
        updatedAt: auditLogTable.updatedAt,
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
      })
      .from(auditLogTable)
      .leftJoin(usersTable, eq(auditLogTable.performByUserId, usersTable.id))
      .leftJoin(roleTable, eq(usersTable.roleId, roleTable.id))
      .where(and(...auditConditions))
      .orderBy(this.getAuditSortColumn(query.sortBy, query.sortOrder))
      .limit(limit)
      .offset(offset);

    return {
      logs,
      meta: {
        page,
        limit,
        total: auditCountResult.count,
        totalPages: Math.ceil(auditCountResult.count / limit),
      },
    };
  }
}

export default new AuditService();
