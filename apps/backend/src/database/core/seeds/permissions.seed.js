import { db } from '../core-db.js';
import { PermissionsRegistry } from '../../../lib/PermissionsRegistry.js';
import { permissionTable } from '../../../models/core/permission.schema.js';
import { sql } from 'drizzle-orm';

function extractPermissions(obj) {
  const permissions = [];

  for (const resource in obj) {
    const actions = obj[resource];

    if (typeof actions === 'object' && actions !== null) {
      for (const action in actions) {
        permissions.push({
          resource,
          action,
        });
      }
    }
  }

  return permissions;
}

const resourceToServiceMap = {
  RECHARGE: 'RECHARGE',
  AADHAAR: 'AADHAAR',
  PAYOUT: 'PAYOUT',
  BANK: 'BANK',
};

export async function seedPermissions() {
  const permissions = extractPermissions(PermissionsRegistry);

  await db
    .insert(permissionTable)
    .values(
      permissions.map((p) => ({
        resource: p.resource,
        action: p.action,
        serviceCode: resourceToServiceMap[p.resource] || null,
        isActive: true,
      })),
    )
    .onDuplicateKeyUpdate({
      set: {
        isActive: true,
        serviceCode: sql`VALUES(service_code)`, // update on conflict
      },
    });

  console.log(`Seeded ${permissions.length} permissions`);
}
