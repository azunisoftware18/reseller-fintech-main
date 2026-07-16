import { eq, or, and } from 'drizzle-orm';
import { usersTable, tenantsTable } from '../models/core/index.js';

export function buildVisibilityCondition(actor, actorRole) {
  // AZZUNIQUE / RESELLER
  if (actorRole.roleLevel <= 1) {
    return or(
      // users in own tenant
      eq(usersTable.tenantId, actor.tenantId),

      // users in direct child tenants
      eq(tenantsTable.parentTenantId, actor.tenantId),
    );
  }

  // Normal users
  return and(
    eq(usersTable.tenantId, actor.tenantId),
    eq(usersTable.ownerUserId, actor.id),
  );
}
