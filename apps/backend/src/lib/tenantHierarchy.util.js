import { db } from '../database/core/core-db.js';
import { tenantsTable } from '../models/core/index.js';
import { eq } from 'drizzle-orm';

/**
 * Bottom → Top tenant chain
 * Example: [WL, Reseller, Azzunique]
 */
export async function buildTenantChain(startTenantId) {
  const chain = [];
  let currentTenantId = startTenantId;

  while (currentTenantId) {
    chain.push(currentTenantId);

    const [tenant] = await db
      .select({
        parentTenantId: tenantsTable.parentTenantId,
      })
      .from(tenantsTable)
      .where(eq(tenantsTable.id, currentTenantId))
      .limit(1);

    if (!tenant?.parentTenantId) break;

    currentTenantId = tenant.parentTenantId;
  }

  return chain;
}
