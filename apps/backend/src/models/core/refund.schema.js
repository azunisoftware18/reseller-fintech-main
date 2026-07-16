import {
  mysqlTable,
  varchar,
  timestamp,
  foreignKey,
  index,
  uniqueIndex,
  bigint,
  json,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

import {
  tenantsTable,
  transactionTable,
  usersTable,
  walletTable,
} from './index.js';

export const refundTable = mysqlTable(
  'refunds',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),

    tenantId: varchar('tenant_id', { length: 36 }).notNull(),
    transactionId: varchar('transaction_id', { length: 36 }).notNull(),

    // ✅ Added wallet tracking
    walletId: varchar('wallet_id', { length: 36 }).notNull(),

    // ✅ Unique refund reference per tenant
    refundReference: varchar('refund_reference', { length: 255 }).notNull(),

    amount: bigint('amount', { mode: 'bigint' }).notNull(), // paise

    // ✅ Fee reversal tracking
    feeAmount: bigint('fee_amount', { mode: 'bigint' }).default(0),
    gstAmount: bigint('gst_amount', { mode: 'bigint' }).default(0),

    status: varchar('status', { length: 20 }).notNull().default('PENDING'),
    // PENDING | PROCESSING | COMPLETED | FAILED

    reason: varchar('reason', { length: 500 }),

    initiatedByUserId: varchar('initiated_by_user_id', {
      length: 36,
    }).notNull(),

    // Provider response
    providerRefundId: varchar('provider_refund_id', { length: 255 }),
    providerResponse: json('provider_response'),

    // Timestamps
    initiatedAt: timestamp('initiated_at').defaultNow().notNull(),
    processedAt: timestamp('processed_at'),
    completedAt: timestamp('completed_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },

  (table) => ({
    refundTenantFk: foreignKey({
      name: 'refund_tenant_fk',
      columns: [table.tenantId],
      foreignColumns: [tenantsTable.id],
    }),

    refundTransactionFk: foreignKey({
      name: 'refund_transaction_fk',
      columns: [table.transactionId],
      foreignColumns: [transactionTable.id],
    }),

    // ✅ Added wallet FK
    refundWalletFk: foreignKey({
      name: 'refund_wallet_fk',
      columns: [table.walletId],
      foreignColumns: [walletTable.id],
    }),

    refundInitiatedByUserFk: foreignKey({
      name: 'refund_initiated_by_user_fk',
      columns: [table.initiatedByUserId],
      foreignColumns: [usersTable.id],
    }),

    // ✅ Unique refund reference per tenant
    uniqRefundReference: uniqueIndex('uniq_refund_tenant_reference').on(
      table.tenantId,
      table.refundReference,
    ),

    // Multiple refunds allowed per transaction (partial refunds)
    idxRefundTransaction: index('idx_refund_transaction').on(
      table.transactionId,
    ),

    idxRefundTenantStatus: index('idx_refund_tenant_status').on(
      table.tenantId,
      table.status,
    ),

    idxRefundWallet: index('idx_refund_wallet').on(
      table.walletId,
      table.status,
    ),

    idxRefundCreated: index('idx_refund_created').on(
      table.tenantId,
      table.createdAt,
    ),
  }),
);
