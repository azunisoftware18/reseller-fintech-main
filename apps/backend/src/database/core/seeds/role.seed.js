import { roleTable } from '../../../models/core/role.schema.js';
import { db } from '../core-db.js';
import { and, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

export async function seedRoles(tenantId) {
  const roles = [
    {
      roleCode: 'AZZUNIQUE',
      roleName: 'Azzunique System Admin',
      roleDescription: 'System administrator with full access',
      roleLevel: 0, // 🔑 ROOT POWER
      isSystem: true,
    },
  ];

  for (const role of roles) {
    const [existingByCode] = await db
      .select({ id: roleTable.id })
      .from(roleTable)
      .where(
        and(
          eq(roleTable.roleCode, role.roleCode),
          eq(roleTable.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (existingByCode) {
      console.log(`⚠️ Role ${role.roleCode} already exists`);
      continue;
    }

    const [existingByLevel] = await db
      .select({ id: roleTable.id })
      .from(roleTable)
      .where(
        and(
          eq(roleTable.roleLevel, role.roleLevel),
          eq(roleTable.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (existingByLevel) {
      throw new Error(
        `❌ roleLevel ${role.roleLevel} already exists for tenant ${tenantId}`,
      );
    }

    await db.insert(roleTable).values({
      id: randomUUID(),
      roleCode: role.roleCode,
      roleName: role.roleName,
      roleDescription: role.roleDescription,

      roleLevel: role.roleLevel,
      tenantId,

      isSystem: role.isSystem,

      createdByUserId: null,
      createdByEmployeeId: null,

      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`✅ Role ${role.roleCode} seeded with level ${role.roleLevel}`);
  }
}
