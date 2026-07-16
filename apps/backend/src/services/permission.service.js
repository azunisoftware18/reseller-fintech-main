import { eq, and } from 'drizzle-orm';
import {
  roleTable,
  permissionTable,
  usersTable,
  userPermissionTable,
  rolePermissionTable,
  employeesTable,
  departmentTable,
  departmentPermissionTable,
  employeePermissionTable,
} from '../models/core/index.js';
import { db } from '../database/core/core-db.js';
import { ApiError } from '../lib/ApiError.js';

class PermissionService {
  async findAll(actor) {
    // 🔥 EMPLOYEE BRANCH
    if (actor.type === 'EMPLOYEE') {
      return this.findAllForEmployee(actor);
    }

    // 🔥 USER BRANCH (existing logic)
    const { roleId, id: userId } = actor;

    const [role] = await db
      .select({ roleCode: roleTable.roleCode })
      .from(roleTable)
      .where(eq(roleTable.id, roleId))
      .limit(1);

    if (!role) throw ApiError.forbidden('Role not found');

    // SYSTEM USER
    if (role?.roleCode === 'AZZUNIQUE') {
      return await db
        .select()
        .from(permissionTable)
        .where(eq(permissionTable.isActive, true));
    }

    // ROLE PERMISSIONS
    const rolePerms = await db
      .select({
        id: permissionTable.id,
        resource: permissionTable.resource,
        action: permissionTable.action,
      })
      .from(rolePermissionTable)
      .innerJoin(
        permissionTable,
        eq(permissionTable.id, rolePermissionTable.permissionId),
      )
      .where(
        and(
          eq(rolePermissionTable.roleId, roleId),
          eq(permissionTable.isActive, true),
        ),
      );

    // USER OVERRIDES
    const userPerms = await db
      .select({
        permissionId: userPermissionTable.permissionId,
        effect: userPermissionTable.effect,
        resource: permissionTable.resource,
        action: permissionTable.action,
      })
      .from(userPermissionTable)
      .innerJoin(
        permissionTable,
        eq(permissionTable.id, userPermissionTable.permissionId),
      )
      .where(eq(userPermissionTable.userId, userId));

    // MERGE
    const final = new Map();

    rolePerms.forEach((p) => final.set(p.id, p));

    userPerms.forEach((p) => {
      if (p.effect === 'DENY') {
        final.delete(p.permissionId);
      } else {
        final.set(p.permissionId, {
          id: p.permissionId,
          resource: p.resource,
          action: p.action,
        });
      }
    });

    return Array.from(final.values());
  }

  async findAllForEmployee(actor) {
    const employeeId = actor.id;

    const [employee] = await db
      .select({
        departmentId: employeesTable.departmentId,
        employeeStatus: employeesTable.employeeStatus,
      })
      .from(employeesTable)
      .where(eq(employeesTable.id, employeeId))
      .limit(1);

    if (!employee) throw ApiError.unauthorized('Employee not found');
    if (employee.employeeStatus !== 'ACTIVE')
      throw ApiError.forbidden('Employee not active');

    // 1️⃣ DEPARTMENT PERMISSIONS (base)
    let deptPerms = [];
    if (employee.departmentId) {
      deptPerms = await db
        .select({
          id: permissionTable.id,
          resource: permissionTable.resource,
          action: permissionTable.action,
        })
        .from(departmentPermissionTable)
        .innerJoin(
          permissionTable,
          eq(permissionTable.id, departmentPermissionTable.permissionId),
        )
        .where(
          and(
            eq(departmentPermissionTable.departmentId, employee.departmentId),
            eq(permissionTable.isActive, true),
          ),
        );
    }

    // 2️⃣ EMPLOYEE DIRECT PERMISSIONS (overrides)
    const empPerms = await db
      .select({
        permissionId: employeePermissionTable.permissionId,
        effect: employeePermissionTable.effect,
        resource: permissionTable.resource,
        action: permissionTable.action,
      })
      .from(employeePermissionTable)
      .innerJoin(
        permissionTable,
        eq(permissionTable.id, employeePermissionTable.permissionId),
      )
      .where(eq(employeePermissionTable.employeeId, employeeId));

    // 3️⃣ MERGE: Department as base, employee overrides on top
    const final = new Map();

    deptPerms.forEach((p) => final.set(p.id, p));

    empPerms.forEach((p) => {
      if (p.effect === 'DENY') {
        final.delete(p.permissionId);
      } else {
        final.set(p.permissionId, {
          id: p.permissionId,
          resource: p.resource,
          action: p.action,
        });
      }
    });

    return Array.from(final.values());
  }
}

export default new PermissionService();
