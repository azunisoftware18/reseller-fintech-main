import { db } from '../../database/core/core-db.js';
import { eq, and } from 'drizzle-orm';

import {
  tenantServiceTable,
  platformServiceProviderTable,
  platformServiceTable,
  serviceProviderTable,
} from '../../models/core/index.js';

import { ApiError } from '../../lib/ApiError.js';

class PancardRuntimeService {
  static async resolve({ tenantChain, platformServiceCode }) {
    const [service] = await db
      .select({
        id: platformServiceTable.id,
        code: platformServiceTable.code,
        name: platformServiceTable.name,
      })
      .from(platformServiceTable)
      .where(eq(platformServiceTable.code, platformServiceCode))
      .limit(1);

    if (!service) {
      throw ApiError.notFound('PAN service not configured');
    }

    // Hierarchy check
    for (const tenantId of tenantChain) {
      const [enabled] = await db
        .select()
        .from(tenantServiceTable)
        .where(
          and(
            eq(tenantServiceTable.tenantId, tenantId),
            eq(tenantServiceTable.platformServiceId, service.id),
            eq(tenantServiceTable.isEnabled, true),
          ),
        )
        .limit(1);

      if (!enabled) {
        throw ApiError.forbidden('PAN service disabled');
      }
    }

    // Resolve provider
    const [row] = await db
      .select({
        providerId: platformServiceProviderTable.id,
        providerCode: serviceProviderTable.code,
        config: platformServiceProviderTable.config,
      })
      .from(platformServiceProviderTable)
      .innerJoin(
        serviceProviderTable,
        eq(
          serviceProviderTable.id,
          platformServiceProviderTable.serviceProviderId,
        ),
      )
      .where(
        and(
          eq(platformServiceProviderTable.platformServiceId, service.id),
          eq(platformServiceProviderTable.isActive, true),
        ),
      )
      .limit(1);

    if (!row) {
      throw ApiError.internal('PAN provider not configured');
    }

    return {
      service,
      provider: {
        providerId: row.providerId,
        code: row.providerCode,
        config: row.config,
      },
    };
  }
}

export default PancardRuntimeService;
