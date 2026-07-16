import { randomUUID } from 'node:crypto';
import { db } from '../core-db.js';
import { tenantsTable } from '../../../models/core/tenant.schema.js';
import { generateNumber } from '../../../lib/lib.js';
import { eq } from 'drizzle-orm';

export async function seedTenants() {
  const tenantEmail = 'admin@azzunique.com';

  const [existingTenant] = await db
    .select()
    .from(tenantsTable)
    .where(eq(tenantsTable.tenantEmail, tenantEmail))
    .limit(1);

  if (existingTenant) {
    console.log(`⚠️ Tenant ${tenantEmail} already exists`);
    return existingTenant.id;
  }

  const tenantId = randomUUID();

  await db.insert(tenantsTable).values({
    id: tenantId,
    tenantNumber: generateNumber('TNT'),
    tenantName: 'Azzunique',
    tenantLegalName: 'Azzunique Private Limited',
    tenantType: 'PRIVATE_LIMITED',
    userType: 'AZZUNIQUE',
    tenantEmail,
    tenantWhatsapp: '9999999999',
    tenantMobileNumber: '9999999999',
    tenantStatus: 'ACTIVE',
    createdByUserId: null,
    createdByEmployeeId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('✅ AZZUNIQUE tenant seeded');
  return tenantId;
}
