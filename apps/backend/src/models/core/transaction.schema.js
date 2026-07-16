import {
  mysqlTable,
  varchar,
  json,
  bigint,
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
  walletTable,
  apiEntityTable,
  ServiceProviderMappingTable,
} from './index.js';

// Transaction Table - Unified for all service types (recharge, payout, etc.)
export const transactionTable = mysqlTable(
  'transactions',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),

    tenantId: varchar('tenant_id', { length: 36 }).notNull(),
    idempotencyKey: varchar('idempotency_key', { length: 255 }).notNull(),
    txnId: varchar('txn_id', { length: 255 }).notNull(),

    amount: bigint('amount', { mode: 'bigint' }).notNull(),
    netAmount: bigint('net_amount', { mode: 'bigint' }).notNull(),

    status: mysqlEnum('status', [
      'PENDING',
      'PROCESSING',
      'SUCCESS',
      'FAILED',
      'REFUNDED',
    ])
      .notNull()
      .default('PENDING'),

    serviceProviderMappingId: varchar('service_provider_mapping_id', {
      length: 36,
    }),
    pricing: json('pricing'),

    userId: varchar('user_id', { length: 36 }).notNull(),
    walletId: varchar('wallet_id', { length: 36 }).notNull(),
    apiEntityId: varchar('api_entity_id', { length: 36 }).notNull(),

    providerReference: varchar('provider_reference', { length: 255 }),
    providerResponse: json('provider_response'),

    initiatedAt: datetime('initiated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    processedAt: datetime('processed_at'),
    completedAt: datetime('completed_at'),
    lastStatusCheckAt: datetime('last_status_check_at'),

    // Service-specific fields stored as JSON for flexibility
    serviceType: mysqlEnum('service_type', [
      'RECHARGE',
      'PAYOUT',
      'BILL_PAYMENT',
      'DMT',
    ]).notNull(),
    serviceData: json('service_data'), // Stores service-specific data like mobileNumber, operatorCode, etc.
  },
  (table) => ({
    // Foreign keys
    tenantFk: foreignKey({
      name: 'txn_tenant_fk',
      columns: [table.tenantId],
      foreignColumns: [tenantsTable.id],
    }),

    userFk: foreignKey({
      name: 'txn_user_fk',
      columns: [table.userId],
      foreignColumns: [usersTable.id],
    }),

    walletFk: foreignKey({
      name: 'txn_wallet_fk',
      columns: [table.walletId],
      foreignColumns: [walletTable.id],
    }),

    apiEntityFk: foreignKey({
      name: 'txn_api_entity_fk',
      columns: [table.apiEntityId],
      foreignColumns: [apiEntityTable.id],
    }),

    serviceProviderMappingFk: foreignKey({
      name: 'txn_sp_mapping_fk',
      columns: [table.serviceProviderMappingId],
      foreignColumns: [ServiceProviderMappingTable.id],
    }),

    // Unique constraints
    uniqTxnIdempotency: uniqueIndex('uniq_txn_tenant_idempotency').on(
      table.tenantId,
      table.idempotencyKey,
    ),

    uniqTxnId: uniqueIndex('uniq_txn_tenant_txn_id').on(
      table.tenantId,
      table.txnId,
    ),

    uniqApiEntityId: uniqueIndex('uniq_txn_api_entity_id').on(
      table.tenantId,
      table.apiEntityId,
    ),

    // Indexes for performance
    idxTenantId: index('idx_txn_tenant_id').on(table.tenantId),
    idxUserStatus: index('idx_txn_user_status').on(table.userId, table.status),
    idxStatusInitiated: index('idx_txn_status_initiated').on(
      table.status,
      table.initiatedAt,
    ),
    idxTenantStatus: index('idx_txn_tenant_status').on(
      table.tenantId,
      table.status,
    ),
    idxTenantServiceType: index('idx_txn_tenant_service_type').on(
      table.tenantId,
      table.serviceType,
    ),
    idxTenantCreated: index('idx_txn_tenant_created').on(
      table.tenantId,
      table.initiatedAt,
    ),
    idxLastStatusCheck: index('idx_txn_last_status_check').on(
      table.lastStatusCheckAt,
    ),
  }),
);
