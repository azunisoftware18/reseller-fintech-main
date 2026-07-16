import { randomUUID } from 'node:crypto';
import { db } from '../core-db.js';
import { eq } from 'drizzle-orm';
import { tenantsDomainsTable } from '../../../models/core/tenantDomain.schema.js';

export async function createDefaultDomain(tenantId, userId) {
  const domainName = 'azzunique.cloud';

  const [existingDomain] = await db
    .select()
    .from(tenantsDomainsTable)
    .where(eq(tenantsDomainsTable.domainName, domainName))
    .limit(1);

  if (existingDomain) {
    console.log('⚠️ Domain already exists');
    return;
  }

  await db.insert(tenantsDomainsTable).values({
    id: randomUUID(),
    tenantId,
    domainName,
    status: 'ACTIVE',
    actionReason: null,
    actionedAt: null,
    createdByEmployeeId: null,
    createdByUserId: userId, // ✅ now exists
    serverDetailId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('🌍 Default domain created');
}
