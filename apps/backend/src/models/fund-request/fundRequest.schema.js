import {
  mysqlTable,
  timestamp,
  varchar,
  int,
  uniqueIndex,
  json,
} from 'drizzle-orm/mysql-core';

export const fundTransactionTable = mysqlTable(
  'fund_transactions',
  {
    id: varchar('id', { length: 36 }).primaryKey(),

    tenantId: varchar('tenant_id', { length: 36 }).notNull(),
    userId: varchar('user_id', { length: 36 }).notNull(),

    idempotencyKey: varchar('idempotency_key', { length: 64 }).notNull(),

    amount: int('amount').notNull(), // paise

    walletId: varchar('wallet_id', { length: 36 }).notNull(),

    platformServiceId: varchar('platform_service_id', { length: 36 }).notNull(),
    platformServiceFeatureId: varchar('platform_service_feature_id', {
      length: 36,
    }),

    providerCode: varchar('provider_code', { length: 40 }).notNull(),
    providerId: varchar('provider_id', { length: 36 }).notNull(),
    providerConfig: json('provider_config').notNull(),

    status: varchar('status', { length: 20 }).notNull(),
    // INITIATED | SUCCESS | FAILED | PENDING | REFUNDED

    providerResponse: json('provider_response'),
    providerTxnId: varchar('provider_txn_id', { length: 100 }),
    referenceId: varchar('reference_id', { length: 100 }),

    paymentMode: varchar('payment_mode', { length: 30 }).notNull(),
    // UPI | BANK_TRANSFER | CARD | NETBANKING

    failureReason: varchar('failure_reason', { length: 255 }),

    retryCount: int('retry_count').default(0),
    lastRetryAt: timestamp('last_retry_at'),

    processedBy: varchar('processed_by', { length: 36 }),
    processedAt: timestamp('processed_at'),

    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at'),
  },
  (table) => ({
    uniqRechargeIdempotency: uniqueIndex('uniq_recharge_idempotency').on(
      table.tenantId,
      table.idempotencyKey,
    ),
  }),
);
