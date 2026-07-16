import { db } from '../database/core/core-db.js';
import { usersTable, roleTable } from '../models/core/index.js';
import { eq, and, isNull } from 'drizzle-orm';

export async function deriveTenantOwnership(actor) {
  if (!actor?.id || !actor?.tenantId || actor.type !== 'USER') {
    return {
      isTenantOwner: false,
      ownedTenantId: null,
    };
  }

  // Owner = root user of that tenant
  const [owner] = await db
    .select({
      id: usersTable.id,
      isSystem: roleTable.isSystem,
    })
    .from(usersTable)
    .leftJoin(roleTable, eq(usersTable.roleId, roleTable.id))
    .where(
      and(
        eq(usersTable.tenantId, actor.tenantId),
        isNull(usersTable.ownerUserId),
        eq(usersTable.id, actor.id),
      ),
    )
    .limit(1);

  return {
    isTenantOwner: !!owner,
    ownedTenantId: owner ? actor.tenantId : null,
  };
}
