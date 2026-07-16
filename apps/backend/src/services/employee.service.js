import { and, desc, eq, like, or, inArray, ne, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

import { db } from '../database/core/core-db.js';
import { ApiError } from '../lib/ApiError.js';
import {
  encrypt,
  generateNumber,
  generatePassword,
  generatePrefix,
} from '../lib/lib.js';
import { eventBus } from '../events/events.js';
import { EVENTS } from '../events/events.constants.js';
import s3Service from '../lib/S3Service.js';
import { resolvePermissions } from './permission.resolver.js';

import {
  employeesTable,
  employeePermissionTable,
  permissionTable,
  departmentTable,
  tenantsTable,
  smtpConfigTable,
  departmentPermissionTable,
} from '../models/core/index.js';

// Helper to strip sensitive fields
function sanitizeEmployee(row) {
  if (!row) return row;
  const {
    passwordHash,
    refreshTokenHash,
    passwordResetTokenHash,
    passwordResetTokenExpiry,
    ...safe
  } = row;
  return safe;
}

class EmployeeService {
  //  CREATE EMPLOYEE
  static async create(payload, actor) {
    if (!actor?.tenantId) {
      throw ApiError.badRequest('Tenant context missing');
    }

    // Tenant check
    const [tenant] = await db
      .select({ id: tenantsTable.id })
      .from(tenantsTable)
      .where(eq(tenantsTable.id, actor.tenantId))
      .limit(1);

    if (!tenant) {
      throw ApiError.badRequest('Invalid tenant');
    }

    // Department check
    const [department] = await db
      .select({
        id: departmentTable.id,
        departmentCode: departmentTable.departmentCode,
      })
      .from(departmentTable)
      .where(
        and(
          eq(departmentTable.id, payload.departmentId),
          eq(departmentTable.tenantId, actor.tenantId),
        ),
      )
      .limit(1);

    if (!department) {
      throw ApiError.badRequest('Invalid department');
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

    // Duplicate check
    const [existing] = await db
      .select({ id: employeesTable.id })
      .from(employeesTable)
      .where(
        and(
          eq(employeesTable.tenantId, actor.tenantId),
          or(
            eq(employeesTable.email, payload.email),
            eq(employeesTable.mobileNumber, payload.mobileNumber),
          ),
        ),
      )
      .limit(1);

    if (existing) {
      throw ApiError.conflict('Employee already exists');
    }

    // Credentials
    const password = generatePassword();
    const passwordHash = encrypt(password);

    const employeeId = randomUUID();
    const prefix = generatePrefix('EMP');

    const employeePayload = {
      id: employeeId,
      employeeNumber: generateNumber(prefix),

      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      mobileNumber: payload.mobileNumber,
      departmentId: payload.departmentId,

      passwordHash,
      tenantId: actor.tenantId,

      employeeStatus: 'INACTIVE',
      emailVerifiedAt: new Date(),
      actionReason: 'Kindly contact the administrator to activate your account',

      createdByUserId: actor.type === 'USER' ? actor.id : null,
      createdByEmployeeId: actor.type === 'EMPLOYEE' ? actor.id : null,

      createdAt: new Date(),
      updatedAt: new Date(),
      actionedAt: new Date(),
    };

    // DB INSERT FIRST
    await db.insert(employeesTable).values(employeePayload);

    // EVENT AFTER DB SUCCESS
    eventBus.emit(EVENTS.EMPLOYEE_CREATED, {
      employeeId,
      employeeNumber: employeePayload.employeeNumber,
      email: payload.email,
      password,
      tenantId: actor.tenantId,
    });

    return this.findOne(employeeId, actor);
  }

  //  FIND ONE
  static async findOne(id, actor) {
    if (!id || !actor?.tenantId) {
      throw ApiError.badRequest('Invalid request');
    }

    const [row] = await db
      .select()
      .from(employeesTable)
      .where(
        and(
          eq(employeesTable.id, id),
          eq(employeesTable.tenantId, actor.tenantId),
        ),
      )
      .limit(1);

    if (!row) {
      throw ApiError.notFound('Employee not found');
    }

    const safe = sanitizeEmployee(row);

    return {
      ...safe,
      profilePictureUrl: safe.profilePicture
        ? s3Service.buildS3Url(safe.profilePicture)
        : null,
    };
  }

  //  FIND ALL
  static async findAll(query = {}, actor) {
    if (!actor?.tenantId) {
      throw ApiError.badRequest('Tenant context missing');
    }

    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    const offset = (page - 1) * limit;

    const conditions = [eq(employeesTable.tenantId, actor.tenantId)];

    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(
        or(
          like(employeesTable.firstName, term),
          like(employeesTable.lastName, term),
          like(employeesTable.email, term),
          like(employeesTable.employeeNumber, term),
        ),
      );
    }

    if (query.status && query.status !== 'all') {
      conditions.push(eq(employeesTable.employeeStatus, query.status));
    }

    const [{ total }] = await db
      .select({ total: sql`COUNT(*)`.mapWith(Number) })
      .from(employeesTable)
      .where(and(...conditions));

    const statsRows = await db
      .select({
        status: employeesTable.employeeStatus,
        count: sql`COUNT(*)`.mapWith(Number),
      })
      .from(employeesTable)
      .where(eq(employeesTable.tenantId, actor.tenantId)) // stats for tenant only, not filtered by search
      .groupBy(employeesTable.employeeStatus);

    const stats = { ACTIVE: 0, INACTIVE: 0, SUSPENDED: 0 };
    statsRows.forEach((r) => (stats[r.status] = r.count));

    const rows = await db
      .select()
      .from(employeesTable)
      .where(and(...conditions))
      .orderBy(desc(employeesTable.createdAt))
      .limit(limit)
      .offset(offset);

    const employeeIds = rows.map((e) => e.id);
    const departmentIds = [...new Set(rows.map((e) => e.departmentId))];

    const departmentPermissions = await db
      .select({
        departmentId: departmentPermissionTable.departmentId,
        permissionId: permissionTable.id,
        resource: permissionTable.resource,
        action: permissionTable.action,
      })
      .from(departmentPermissionTable)
      .leftJoin(
        permissionTable,
        eq(permissionTable.id, departmentPermissionTable.permissionId),
      )
      .where(inArray(departmentPermissionTable.departmentId, departmentIds));

    const employeePermissions = await db
      .select({
        employeeId: employeePermissionTable.employeeId,
        permissionId: permissionTable.id,
        resource: permissionTable.resource,
        action: permissionTable.action,
        effect: employeePermissionTable.effect,
      })
      .from(employeePermissionTable)
      .leftJoin(
        permissionTable,
        eq(permissionTable.id, employeePermissionTable.permissionId),
      )
      .where(inArray(employeePermissionTable.employeeId, employeeIds));

    const deptPermMap = new Map();
    departmentPermissions.forEach((p) => {
      if (!deptPermMap.has(p.departmentId)) deptPermMap.set(p.departmentId, []);
      deptPermMap.get(p.departmentId).push({
        id: p.permissionId,
        resource: p.resource,
        action: p.action,
        source: 'DEPARTMENT',
      });
    });

    const empPermMap = new Map();
    employeePermissions.forEach((p) => {
      if (!empPermMap.has(p.employeeId)) empPermMap.set(p.employeeId, []);
      empPermMap.get(p.employeeId).push({
        id: p.permissionId,
        resource: p.resource,
        action: p.action,
        effect: p.effect,
        source: 'EMPLOYEE',
      });
    });

    const data = rows.map((e) => {
      const safe = sanitizeEmployee(e);
      return {
        ...safe,
        profilePictureUrl: safe.profilePicture
          ? s3Service.buildS3Url(safe.profilePicture)
          : null,
        departmentPermissions: deptPermMap.get(e.departmentId) || [],
        employeePermissions: empPermMap.get(e.id) || [],
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        stats,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  //  UPDATE EMPLOYEE (USER-LEVEL SAFE)
  static async update(id, payload, actor, file) {
    if (!actor?.tenantId) {
      throw ApiError.badRequest('Tenant context missing');
    }

    const [existing] = await db
      .select({
        id: employeesTable.id,
        tenantId: employeesTable.tenantId,
        email: employeesTable.email,
        mobileNumber: employeesTable.mobileNumber,
        employeeStatus: employeesTable.employeeStatus,
        profilePicture: employeesTable.profilePicture,
      })
      .from(employeesTable)
      .where(eq(employeesTable.id, id))
      .limit(1);

    if (!existing) {
      throw ApiError.notFound('Employee not found');
    }

    if (existing.tenantId !== actor.tenantId) {
      throw ApiError.forbidden('Cross-tenant update denied');
    }

    // Self-status change block
    if (
      actor.type === 'EMPLOYEE' &&
      actor.id === id &&
      payload.employeeStatus
    ) {
      throw ApiError.forbidden('You cannot change your own status');
    }

    // Email duplicate
    if (payload.email && payload.email !== existing.email) {
      const [emailExists] = await db
        .select({ id: employeesTable.id })
        .from(employeesTable)
        .where(
          and(
            eq(employeesTable.email, payload.email),
            eq(employeesTable.tenantId, actor.tenantId),
            ne(employeesTable.id, id),
          ),
        )
        .limit(1);

      if (emailExists) {
        throw ApiError.badRequest('Email already exists');
      }
    }

    // Mobile duplicate
    if (
      payload.mobileNumber &&
      payload.mobileNumber !== existing.mobileNumber
    ) {
      const [mobileExists] = await db
        .select({ id: employeesTable.id })
        .from(employeesTable)
        .where(
          and(
            eq(employeesTable.mobileNumber, payload.mobileNumber),
            eq(employeesTable.tenantId, actor.tenantId),
            ne(employeesTable.id, id),
          ),
        )
        .limit(1);

      if (mobileExists) {
        throw ApiError.badRequest('Mobile number already exists');
      }
    }

    const UPDATABLE = [
      'firstName',
      'lastName',
      'email',
      'mobileNumber',
      'departmentId',
      'employeeStatus',
      'actionReason',
    ];

    const updates = { updatedAt: new Date() };

    for (const key of UPDATABLE) {
      if (payload[key] !== undefined) {
        updates[key] = payload[key];
      }
    }

    updates.updatedByUserId = actor.type === 'USER' ? actor.id : null;
    updates.updatedByEmployeeId = actor.type === 'EMPLOYEE' ? actor.id : null;

    // Profile image
    if (file) {
      const uploaded = await s3Service.upload(file.path, 'employee-profile');

      if (existing.profilePicture) {
        await s3Service.deleteByKey(existing.profilePicture);
      }

      updates.profilePicture = uploaded.key;
    }

    // Status event
    if (
      payload.employeeStatus &&
      payload.employeeStatus !== existing.employeeStatus
    ) {
      eventBus.emit(EVENTS.EMPLOYEE_STATUS_CHANGED, {
        tenantId: actor.tenantId,
        employeeId: id,
        email: existing.email,
        oldStatus: existing.employeeStatus,
        newStatus: payload.employeeStatus,
        actionReason: payload.actionReason || null,
      });

      updates.actionedAt = new Date();
    }

    await db
      .update(employeesTable)
      .set(updates)
      .where(eq(employeesTable.id, id));

    return this.findOne(id, actor);
  }

  // DELETE
  static async delete(id, actor) {
    if (!actor?.tenantId) {
      throw ApiError.badRequest('Tenant context missing');
    }

    const employee = await this.findOne(id, actor);

    if (employee.profilePicture) {
      await s3Service.deleteByKey(employee.profilePicture).catch(() => {});
    }

    await db
      .delete(employeesTable)
      .where(
        and(
          eq(employeesTable.id, id),
          eq(employeesTable.tenantId, actor.tenantId),
        ),
      );

    return true;
  }

  static async assignPermissions(employeeId, permissions, actor) {
    if (!actor?.tenantId || !actor?.id || !actor?.type) {
      throw ApiError.unauthorized('Invalid actor context');
    }

    if (!Array.isArray(permissions) || permissions.length === 0) {
      throw ApiError.badRequest('Permissions array is required');
    }

    // 1️⃣ Employee validation (tenant-safe)
    const [target] = await db
      .select({
        id: employeesTable.id,
        tenantId: employeesTable.tenantId,
      })
      .from(employeesTable)
      .where(eq(employeesTable.id, employeeId))
      .limit(1);

    if (!target) throw ApiError.notFound('Employee not found');

    if (target.tenantId !== actor.tenantId) {
      throw ApiError.forbidden(
        'Cross-tenant permission modification not allowed',
      );
    }

    // 🚫 Self block
    if (actor.type === 'EMPLOYEE' && actor.id === employeeId) {
      throw ApiError.forbidden('You cannot modify your own permissions');
    }

    // 2️⃣ Extract IDs
    const permissionIds = permissions.map((p) => p.permissionId);

    if (permissionIds.some((id) => !id)) {
      throw ApiError.badRequest('Invalid permission payload');
    }

    // 3️⃣ Fetch permission KEYS
    const rows = await db
      .select({
        id: permissionTable.id,
        key: sql`CONCAT(${permissionTable.resource}, '.', ${permissionTable.action})`,
      })
      .from(permissionTable)
      .where(inArray(permissionTable.id, permissionIds));

    if (rows.length !== permissionIds.length) {
      throw ApiError.badRequest('One or more permission IDs are invalid');
    }

    const idToKeyMap = new Map(rows.map((r) => [r.id, r.key]));

    // 4️⃣ Actor permission enforcement
    const { permissions: actorPerms } = await resolvePermissions(actor);

    if (!actorPerms.includes('*')) {
      const forbidden = permissionIds.filter((pid) => {
        const key = idToKeyMap.get(pid);
        return !actorPerms.includes(key);
      });

      if (forbidden.length) {
        throw ApiError.forbidden(
          `You cannot assign permissions you do not have`,
        );
      }
    }

    // 5️⃣ Replace permissions (transaction safe)
    await db.transaction(async (tx) => {
      await tx
        .delete(employeePermissionTable)
        .where(eq(employeePermissionTable.employeeId, employeeId));

      await tx.insert(employeePermissionTable).values(
        permissions.map((p) => ({
          employeeId,
          permissionId: p.permissionId,
          effect: p.effect ?? 'ALLOW',
        })),
      );
    });

    return true;
  }
}

export { EmployeeService };
