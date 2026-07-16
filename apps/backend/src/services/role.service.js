import { db } from '../database/core/core-db.js';
import {
  roleTable,
  rolePermissionTable,
  permissionTable,
  usersTable,
  employeesTable,
  tenantsTable,
} from '../models/core/index.js';
import { eq, and, ne, sql, inArray } from 'drizzle-orm';
import { ApiError } from '../lib/ApiError.js';
import crypto from 'crypto';
import { resolvePermissions } from './permission.resolver.js';

const ROLE_HIERARCHY = {
  AZZUNIQUE: { next: 'RESELLER', level: 1 },
  RESELLER: { next: 'WHITE_LABEL', level: 2 },
  WHITE_LABEL: {
    next: ['STATE_HEAD', 'MASTER_DISTRIBUTOR', 'DISTRIBUTOR', 'RETAILER'],
    startLevel: 3,
  },
  STATE_HEAD: null,
  MASTER_DISTRIBUTOR: null,
  DISTRIBUTOR: null,
  RETAILER: null,
};

class RoleService {
  // 🔥 EMPLOYEE VALIDATION — same pattern as KycService
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

    return employee.tenantId;
  }

  // 🔥 Get tenantId for both USER and EMPLOYEE
  async getActorTenantId(actor) {
    if (actor.type === 'EMPLOYEE') {
      return await this.validateEmployeeActor(actor);
    }
    return actor?.tenantId;
  }

  // 🔥 Get actor role data for hierarchy checks
  async getActorRoleData(actor) {
    if (actor.type === 'EMPLOYEE') {
      const tenantId = await this.validateEmployeeActor(actor);

      const [tenant] = await db
        .select({ userType: tenantsTable.userType })
        .from(tenantsTable)
        .where(eq(tenantsTable.id, tenantId))
        .limit(1);

      // Tenant owner ki role le lo hierarchy check ke liye
      const [tenantOwner] = await db
        .select({
          roleId: roleTable.id,
          roleCode: roleTable.roleCode,
          roleLevel: roleTable.roleLevel,
        })
        .from(usersTable)
        .leftJoin(roleTable, eq(usersTable.roleId, roleTable.id))
        .where(
          and(
            eq(usersTable.tenantId, tenantId),
            eq(roleTable.roleCode, tenant.userType),
          ),
        )
        .limit(1);

      if (!tenantOwner) {
        throw ApiError.forbidden('Tenant owner not found');
      }

      return tenantOwner;
    }

    const [actorRoleData] = await db
      .select({
        roleCode: roleTable.roleCode,
        roleLevel: roleTable.roleLevel,
      })
      .from(roleTable)
      .where(eq(roleTable.id, actor.roleId))
      .limit(1);

    return actorRoleData;
  }

  async create(payload, actor) {
    const tenantId = await this.getActorTenantId(actor);
    if (!tenantId) {
      throw ApiError.badRequest('Tenant missing');
    }

    const actorRoleData = await this.getActorRoleData(actor);
    if (!actorRoleData) {
      throw ApiError.forbidden('Invalid actor role');
    }

    const actorRoleCode = actorRoleData.roleCode;
    const hierarchyConfig = ROLE_HIERARCHY[actorRoleCode];

    if (!hierarchyConfig) {
      throw ApiError.forbidden(`${actorRoleCode} cannot create roles`);
    }

    let isAllowed = false;
    let nextRoleLevel;

    if (actorRoleCode === 'WHITE_LABEL') {
      const allowedRoles = hierarchyConfig.next;
      isAllowed =
        Array.isArray(allowedRoles) && allowedRoles.includes(payload.roleCode);

      if (!isAllowed) {
        throw ApiError.forbidden(
          `${actorRoleCode} cannot create role ${payload.roleCode}`,
        );
      }

      const existingRoles = await db
        .select({ roleCode: roleTable.roleCode })
        .from(roleTable)
        .where(
          and(
            eq(roleTable.tenantId, tenantId),
            inArray(roleTable.roleCode, allowedRoles),
          ),
        );

      const createdRoles = existingRoles.map((r) => r.roleCode);
      const roleIndex = allowedRoles.indexOf(payload.roleCode);

      let rolesCreatedBefore = 0;
      for (let i = 0; i < roleIndex; i++) {
        if (createdRoles.includes(allowedRoles[i])) {
          rolesCreatedBefore++;
        }
      }

      nextRoleLevel = hierarchyConfig.startLevel + rolesCreatedBefore;
    } else {
      isAllowed = hierarchyConfig.next === payload.roleCode;

      if (!isAllowed) {
        throw ApiError.forbidden(
          `${actorRoleCode} cannot create role ${payload.roleCode}`,
        );
      }

      nextRoleLevel = hierarchyConfig.level;
    }

    const [existingCode] = await db
      .select({ id: roleTable.id })
      .from(roleTable)
      .where(
        and(
          eq(roleTable.tenantId, tenantId),
          eq(roleTable.roleCode, payload.roleCode),
        ),
      )
      .limit(1);

    if (existingCode) {
      throw ApiError.conflict('Role code already exists');
    }

    const id = crypto.randomUUID();

    await db.insert(roleTable).values({
      id,
      roleCode: payload.roleCode,
      roleName: payload.roleName,
      roleDescription: payload.roleDescription,
      roleLevel: nextRoleLevel,
      tenantId: tenantId,
      isSystem: false,

      createdByUserId: actor.type === 'USER' ? actor.id : null,
      createdByEmployeeId: actor.type === 'EMPLOYEE' ? actor.id : null,

      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.findOne(id, actor);
  }

  async findAll(actor) {
    const tenantId = await this.getActorTenantId(actor);
    if (!tenantId) {
      throw ApiError.badRequest('Tenant context missing');
    }

    const conditions = [eq(roleTable.tenantId, tenantId)];

    // 🔥 EMPLOYEE: Owner ka role hide karo
    if (actor.type === 'EMPLOYEE') {
      const [tenant] = await db
        .select({ userType: tenantsTable.userType })
        .from(tenantsTable)
        .where(eq(tenantsTable.id, tenantId))
        .limit(1);

      if (tenant?.userType) {
        conditions.push(ne(roleTable.roleCode, tenant.userType));
      }
    } else {
      // Self-lock sirf USER actors ke liye
      if (actor.roleId) {
        conditions.push(ne(roleTable.id, actor.roleId));
      }
    }

    const rows = await db
      .select({
        roleId: roleTable.id,
        roleCode: roleTable.roleCode,
        roleName: roleTable.roleName,
        roleDescription: roleTable.roleDescription,
        roleLevel: roleTable.roleLevel,
        isSystem: roleTable.isSystem,
        permissionId: permissionTable.id,
        resource: permissionTable.resource,
        action: permissionTable.action,
      })
      .from(roleTable)
      .leftJoin(
        rolePermissionTable,
        eq(rolePermissionTable.roleId, roleTable.id),
      )
      .leftJoin(
        permissionTable,
        eq(permissionTable.id, rolePermissionTable.permissionId),
      )
      .where(and(...conditions))
      .orderBy(roleTable.roleLevel);

    const roleMap = new Map();

    for (const r of rows) {
      if (!roleMap.has(r.roleId)) {
        roleMap.set(r.roleId, {
          id: r.roleId,
          roleCode: r.roleCode,
          roleName: r.roleName,
          roleDescription: r.roleDescription,
          roleLevel: r.roleLevel,
          isSystem: r.isSystem,
          permissions: [],
        });
      }

      if (r.permissionId) {
        roleMap.get(r.roleId).permissions.push({
          id: r.permissionId,
          resource: r.resource,
          action: r.action,
        });
      }
    }

    return [...roleMap.values()];
  }

  async findOne(id, actor) {
    const tenantId = await this.getActorTenantId(actor);

    const rows = await db
      .select({
        roleId: roleTable.id,
        roleCode: roleTable.roleCode,
        roleName: roleTable.roleName,
        roleDescription: roleTable.roleDescription,
        roleLevel: roleTable.roleLevel,
        isSystem: roleTable.isSystem,
        permissionId: permissionTable.id,
        resource: permissionTable.resource,
        action: permissionTable.action,
      })
      .from(roleTable)
      .leftJoin(
        rolePermissionTable,
        eq(rolePermissionTable.roleId, roleTable.id),
      )
      .leftJoin(
        permissionTable,
        eq(permissionTable.id, rolePermissionTable.permissionId),
      )
      .where(and(eq(roleTable.id, id), eq(roleTable.tenantId, tenantId)));

    if (!rows.length) {
      throw ApiError.notFound('Role not found');
    }

    const role = {
      id: rows[0].roleId,
      roleCode: rows[0].roleCode,
      roleName: rows[0].roleName,
      roleDescription: rows[0].roleDescription,
      roleLevel: rows[0].roleLevel,
      isSystem: rows[0].isSystem,
      permissions: rows
        .filter((r) => r.permissionId)
        .map((r) => ({
          id: r.permissionId,
          resource: r.resource,
          action: r.action,
        })),
    };

    // 🔥 EMPLOYEE: Owner ka role access nahi kar sakta
    if (actor.type === 'EMPLOYEE') {
      const [tenant] = await db
        .select({ userType: tenantsTable.userType })
        .from(tenantsTable)
        .where(eq(tenantsTable.id, tenantId))
        .limit(1);

      if (tenant?.userType && role.roleCode === tenant.userType) {
        throw ApiError.forbidden('You cannot access tenant owner role');
      }
    }

    return role;
  }

  async update(id, payload, actor) {
    const tenantId = await this.getActorTenantId(actor);
    if (!tenantId) {
      throw ApiError.badRequest('Tenant context missing');
    }

    const role = await this.findOne(id, actor);

    if (role.isSystem) {
      throw ApiError.forbidden('System roles cannot be modified');
    }

    // Self-modification check sirf USER ke liye
    if (actor.type !== 'EMPLOYEE' && actor.roleId === id) {
      if (payload.roleCode || payload.isSystem) {
        throw ApiError.forbidden('You cannot modify your own role');
      }
    }

    delete payload.isSystem;
    delete payload.tenantId;
    delete payload.roleLevel;

    if (payload.roleCode && payload.roleCode !== role.roleCode) {
      const [existing] = await db
        .select({ id: roleTable.id })
        .from(roleTable)
        .where(
          and(
            eq(roleTable.tenantId, tenantId),
            eq(roleTable.roleCode, payload.roleCode),
            ne(roleTable.id, id),
          ),
        )
        .limit(1);

      if (existing) {
        throw ApiError.conflict('Role code already exists in this tenant');
      }
    }

    await db
      .update(roleTable)
      .set({
        ...payload,
        updatedAt: new Date(),
      })
      .where(and(eq(roleTable.id, id), eq(roleTable.tenantId, tenantId)));

    return this.findOne(id, actor);
  }

  async delete(id, actor) {
    const role = await this.findOne(id, actor);

    if (role.isSystem) {
      throw ApiError.forbidden('System roles cannot be deleted');
    }

    // Self-delete check sirf USER ke liye
    if (actor.type !== 'EMPLOYEE' && actor.roleId === id) {
      throw ApiError.forbidden('You cannot delete your own role');
    }

    const [{ count }] = await db
      .select({ count: sql`COUNT(*)`.mapWith(Number) })
      .from(usersTable)
      .where(
        and(eq(usersTable.roleId, id), eq(usersTable.tenantId, role.tenantId)),
      );

    if (count > 0) {
      throw ApiError.conflict(
        `Role is assigned to ${count} user(s). Please delete users first.`,
      );
    }

    await db
      .delete(rolePermissionTable)
      .where(eq(rolePermissionTable.roleId, id));

    await db.delete(roleTable).where(eq(roleTable.id, id));
  }

  async assignPermissions(roleId, permissionIds, actor) {
    const role = await this.findOne(roleId, actor);

    if (role.isSystem) {
      throw ApiError.forbidden('System role permissions cannot be modified');
    }

    if (!Array.isArray(permissionIds)) {
      throw ApiError.badRequest('permissionIds must be an array');
    }

    const existing = await db
      .select({ id: permissionTable.id })
      .from(permissionTable)
      .where(inArray(permissionTable.id, permissionIds));

    const existingIds = existing.map((p) => p.id);

    if (existingIds.length !== permissionIds.length) {
      throw ApiError.badRequest('One or more permission IDs are invalid');
    }

    // 🔥 EMPLOYEE ke liye permission ownership check skip karo
    // (Employee already tenant-level validate ho chuka hai)
    if (actor.type !== 'EMPLOYEE') {
      const { permissions: actorPerms } = await resolvePermissions(actor);

      if (!actorPerms.includes('*') && actor.roleId === roleId) {
        throw ApiError.forbidden(
          'You cannot modify permissions of your own role',
        );
      }

      const permissionKeys = await db
        .select({
          id: permissionTable.id,
          key: sql`CONCAT(${permissionTable.resource}, '.', ${permissionTable.action})`,
        })
        .from(permissionTable)
        .where(inArray(permissionTable.id, existingIds));

      const idToKeyMap = new Map(permissionKeys.map((p) => [p.id, p.key]));

      if (!actorPerms.includes('*')) {
        const forbidden = existingIds.filter((pid) => {
          const key = idToKeyMap.get(pid);
          return !actorPerms.includes(key);
        });

        if (forbidden.length) {
          throw ApiError.forbidden(
            'You cannot assign permissions you do not have',
          );
        }
      }
    }

    await db.transaction(async (trx) => {
      await trx
        .delete(rolePermissionTable)
        .where(eq(rolePermissionTable.roleId, roleId));

      if (!existingIds.length) return;

      await trx.insert(rolePermissionTable).values(
        existingIds.map((pid) => ({
          id: crypto.randomUUID(),
          roleId,
          permissionId: pid,
        })),
      );
    });
  }
}

export default new RoleService();
