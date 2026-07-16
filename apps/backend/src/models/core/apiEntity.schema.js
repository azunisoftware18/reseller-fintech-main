import {
  mysqlTable,
  varchar,
  json,
  datetime,
  mysqlEnum,
  foreignKey,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

import {
  tenantsTable,
  usersTable,
  ServiceProviderMappingTable,
} from './index.js';

// API Entity Table - Tracks all API requests
export const apiEntityTable = mysqlTable(
  'api_entity',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),

    tenantId: varchar('tenant_id', { length: 36 }).notNull(),
    reference: varchar('reference', { length: 255 }).notNull(),

    userId: varchar('user_id', { length: 36 }).notNull(),
    serviceProviderMappingId: varchar('service_provider_mapping_id', {
      length: 36,
    }),

    status: mysqlEnum('status', [
      'PENDING',
      'PROCESSING',
      'COMPLETED',
      'FAILED',
    ])
      .notNull()
      .default('PENDING'),

    requestPayload: json('request_payload'),
    providerInitData: json('provider_init_data'),
    providerFinalData: json('provider_final_data'),
    errorData: json('error_data'),

    createdAt: datetime('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: datetime('updated_at')
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
      .notNull(),
    completedAt: datetime('completed_at'),
  },
  (table) => ({
    // Foreign keys
    tenantFk: foreignKey({
      name: 'api_entity_tenant_fk',
      columns: [table.tenantId],
      foreignColumns: [tenantsTable.id],
    }),

    userFk: foreignKey({
      name: 'api_entity_user_fk',
      columns: [table.userId],
      foreignColumns: [usersTable.id],
    }),

    serviceProviderMappingFk: foreignKey({
      name: 'api_entity_sp_mapping_fk',
      columns: [table.serviceProviderMappingId],
      foreignColumns: [ServiceProviderMappingTable.id],
    }),

    // Unique constraint for reference within tenant
    uniqApiEntityReference: uniqueIndex('uniq_api_entity_reference').on(
      table.tenantId,
      table.reference,
    ),

    // Indexes for performance
    idxTenantId: index('idx_api_entity_tenant_id').on(table.tenantId),
    idxUserId: index('idx_api_entity_user_id').on(table.userId),
    idxStatusCreated: index('idx_api_entity_status_created').on(
      table.status,
      table.createdAt,
    ),
    idxTenantStatus: index('idx_api_entity_tenant_status').on(
      table.tenantId,
      table.status,
    ),
  }),
);
