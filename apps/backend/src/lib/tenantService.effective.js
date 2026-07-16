import { db } from '../database/core/core-db.js';
import { sql } from 'drizzle-orm';

class TenantServiceEffective {
  async isServiceEffectivelyEnabled(tenantId, serviceId) {
    const query = sql`
      WITH RECURSIVE tenant_tree AS (
        SELECT id, parent_tenant_id
        FROM tenants
        WHERE id = ${tenantId}

        UNION ALL

        SELECT t.id, t.parent_tenant_id
        FROM tenants t
        INNER JOIN tenant_tree tt
          ON t.id = tt.parent_tenant_id
      )
      SELECT EXISTS (
        SELECT 1
        FROM tenant_tree tt
        JOIN tenant_services ts
          ON ts.tenant_id = tt.id
         AND ts.platform_service_id = ${serviceId}
        WHERE ts.is_enabled = false
      ) AS has_disabled
    `;

    const result = await db.execute(query);

    const hasDisabled = result[0]?.has_disabled;

    return !hasDisabled;
  }
}

export default new TenantServiceEffective();
