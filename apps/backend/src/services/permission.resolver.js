import { db } from '../database/core/core-db.js';
import {
  roleTable,
  rolePermissionTable,
  userPermissionTable,
  departmentPermissionTable,
  employeePermissionTable,
  permissionTable,
} from '../models/core/index.js';
import { eq, sql, and } from 'drizzle-orm';
import { ApiError } from '../lib/ApiError.js';

export async function resolvePermissions(actor) {
  if (actor.type !== 'USER' && actor.type !== 'EMPLOYEE') {
    return { permissions: [], enabledServices: [] };
  }

  // key => { key, serviceCode }
  const permissionMap = new Map();

  // =========================
  // USER PERMISSIONS
  // =========================
  if (actor.type === 'USER') {
    const [role] = await db
      .select({
        id: roleTable.id,
        isSystem: roleTable.isSystem,
      })
      .from(roleTable)
      .where(eq(roleTable.id, actor.roleId))
      .limit(1);

    if (!role) {
      return { permissions: [], enabledServices: [] };
    }

    // SYSTEM ROLE
    if (role.isSystem) {
      if (!actor.isTenantOwner) {
        throw ApiError.forbidden('System role restricted to tenant owners');
      }

      return {
        permissions: ['*'],
        enabledServices: ['*'], // full access
      };
    }

    // Role permissions
    const rolePerms = await db
      .select({
        key: sql`CONCAT(${permissionTable.resource}, '.', ${permissionTable.action})`,
        serviceCode: permissionTable.serviceCode,
      })
      .from(rolePermissionTable)
      .leftJoin(
        permissionTable,
        eq(permissionTable.id, rolePermissionTable.permissionId),
      )
      .where(eq(rolePermissionTable.roleId, actor.roleId));

    rolePerms.forEach((p) => {
      if (!p.key) return;
      permissionMap.set(p.key, {
        key: p.key,
        serviceCode: p.serviceCode,
      });
    });

    // User overrides
    const userPerms = await db
      .select({
        key: sql`CONCAT(${permissionTable.resource}, '.', ${permissionTable.action})`,
        serviceCode: permissionTable.serviceCode,
        effect: userPermissionTable.effect,
      })
      .from(userPermissionTable)
      .leftJoin(
        permissionTable,
        eq(permissionTable.id, userPermissionTable.permissionId),
      )
      .where(eq(userPermissionTable.userId, actor.id));

    userPerms.forEach((p) => {
      if (!p.key) return;

      if (p.effect === 'ALLOW') {
        permissionMap.set(p.key, {
          key: p.key,
          serviceCode: p.serviceCode,
        });
      } else {
        permissionMap.delete(p.key);
      }
    });
  }

  // =========================
  // EMPLOYEE PERMISSIONS
  // =========================
  if (actor.type === 'EMPLOYEE') {
    // Department permissions
    const deptPerms = await db
      .select({
        key: sql`CONCAT(${permissionTable.resource}, '.', ${permissionTable.action})`,
        serviceCode: permissionTable.serviceCode,
      })
      .from(departmentPermissionTable)
      .leftJoin(
        permissionTable,
        eq(permissionTable.id, departmentPermissionTable.permissionId),
      )
      .where(eq(departmentPermissionTable.departmentId, actor.departmentId));

    deptPerms.forEach((p) => {
      if (!p.key) return;
      permissionMap.set(p.key, {
        key: p.key,
        serviceCode: p.serviceCode,
      });
    });

    // Employee overrides
    const empPerms = await db
      .select({
        key: sql`CONCAT(${permissionTable.resource}, '.', ${permissionTable.action})`,
        serviceCode: permissionTable.serviceCode,
        effect: employeePermissionTable.effect,
      })
      .from(employeePermissionTable)
      .leftJoin(
        permissionTable,
        eq(permissionTable.id, employeePermissionTable.permissionId),
      )
      .where(eq(employeePermissionTable.employeeId, actor.id));

    empPerms.forEach((p) => {
      if (!p.key) return;

      if (p.effect === 'ALLOW') {
        permissionMap.set(p.key, {
          key: p.key,
          serviceCode: p.serviceCode,
        });
      } else {
        permissionMap.delete(p.key);
      }
    });
  }

  const finalPermissions = [...permissionMap.values()];

  const enabledServices = [
    ...new Set(
      finalPermissions.filter((p) => p.serviceCode).map((p) => p.serviceCode),
    ),
  ];

  return {
    permissions: finalPermissions.map((p) => p.key),
    enabledServices,
  };
}
