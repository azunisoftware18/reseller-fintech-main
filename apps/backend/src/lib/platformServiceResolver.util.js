import { and, eq } from 'drizzle-orm';

import { db } from '../database/core/core-db.js';
import {
  ServiceTable,
  ProviderTable,
  ServiceProviderMappingTable,
} from '../models/core/index.js';
import { ApiError } from './ApiError.js';

export async function platformServiceResolve({
  tenantChain,
  platformServiceCode,
}) {
  // Future use
  void tenantChain;

  // Step 1: Check service exists
  const [service] = await db
    .select()
    .from(ServiceTable)
    .where(
      and(
        eq(ServiceTable.code, platformServiceCode),
        eq(ServiceTable.isActive, true),
      ),
    )
    .limit(1);

  if (!service) {
    throw ApiError.notFound(
      `Service '${platformServiceCode}' not found`,
    );
  }

  // Step 2: Resolve active provider mapping
  const [row] = await db
    .select({
      service: ServiceTable,
      provider: ProviderTable,
      mapping: ServiceProviderMappingTable,
    })
    .from(ServiceProviderMappingTable)
    .innerJoin(
      ServiceTable,
      eq(ServiceProviderMappingTable.ServiceId, ServiceTable.id),
    )
    .innerJoin(
      ProviderTable,
      eq(ServiceProviderMappingTable.ProviderId, ProviderTable.id),
    )
    .where(
      and(
        eq(ServiceProviderMappingTable.ServiceId, service.id),
        eq(ServiceProviderMappingTable.isActive, true),
        eq(ProviderTable.isActive, true),
      ),
    )
    .limit(1);

  if (!row) {
    throw ApiError.notFound(
      `Service '${platformServiceCode}' exists but no active provider mapping found`,
    );
  }

  return {
    service: row.service,

    provider: {
      providerId: row.provider.id,
      code: row.provider.code,
      handler: row.provider.handler,
      config: row.mapping.config || {},
    },
  };
}