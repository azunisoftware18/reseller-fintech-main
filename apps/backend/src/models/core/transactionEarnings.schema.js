import {
  mysqlTable,
  varchar,
  timestamp,
  foreignKey,
  uniqueIndex,
  index,
  bigint,
  json,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

import {
  ServiceTable,
  tenantsTable,
  transactionTable,
  usersTable,
  walletTable,
} from './index.js';

export const transactionEarningsTable = mysqlTable(
  'transaction_earnings',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),

    userId: varchar('user_id', { length: 36 }).notNull(),
    tenantId: varchar('tenant_id', { length: 36 }).notNull(),
    walletId: varchar('wallet_id', { length: 36 }).notNull(),
    transactionId: varchar('transaction_id', { length: 36 }).notNull(),

    serviceId: varchar('service_id', { length: 36 }).notNull(),

    // ✅ Mode differentiates between COMMISSION and SURCHARGE
    mode: varchar('mode', { length: 20 }).notNull(), // 'COMMISSION' | 'SURCHARGE'
    type: varchar('type', { length: 20 }).notNull(), // 'PERCENTAGE' | 'FIXED'

    value: bigint('value', { mode: 'bigint' }).notNull(), // Percentage or fixed value

    // For COMMISSION: baseAmount is commission before tax
    // For SURCHARGE: baseAmount is surcharge before GST
    baseAmount: bigint('base_amount', { mode: 'bigint' }).notNull(),

    // Tax amounts
    gstAmount: bigint('gst_amount', { mode: 'bigint' }).notNull(),
    tdsAmount: bigint('tds_amount', { mode: 'bigint' }).notNull().default(0), // Only for COMMISSION

    // Final amount credited (for commission) or debited (for surcharge)
    finalAmount: bigint('final_amount', { mode: 'bigint' }).notNull(),

    // Status tracking for surcharge lifecycle
    status: varchar('status', { length: 20 }).default('COMPLETED'), // COMPLETED | BLOCKED | RELEASED

    // For slab-based rules
    appliedSlabMin: bigint('applied_slab_min', { mode: 'bigint' }),
    appliedSlabMax: bigint('applied_slab_max', { mode: 'bigint' }),

    // Additional metadata
    metadata: json('metadata'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    /* UNIQUE (Idempotency Lock) */
    uniqEntry: uniqueIndex('uniq_entry').on(
      table.transactionId,
      table.userId,
      table.mode, // ✅ Mode included to allow both commission and surcharge per transaction
    ),

    /* FOREIGN KEYS */
    teTenantFk: foreignKey({
      name: 'te_tenant_fk',
      columns: [table.tenantId],
      foreignColumns: [tenantsTable.id],
    }),

    teUserFk: foreignKey({
      name: 'te_user_fk',
      columns: [table.userId],
      foreignColumns: [usersTable.id],
    }),

    teWalletFk: foreignKey({
      name: 'te_wallet_fk',
      columns: [table.walletId],
      foreignColumns: [walletTable.id],
    }),

    teTransactionFk: foreignKey({
      name: 'te_tx_fk',
      columns: [table.transactionId],
      foreignColumns: [transactionTable.id],
    }),

    teServiceFk: foreignKey({
      name: 'te_service_fk',
      columns: [table.serviceId],
      foreignColumns: [ServiceTable.id],
    }),

    /* INDEXES */
    idxTenant: index('idx_te_tenant').on(table.tenantId),
    idxUser: index('idx_te_user').on(table.userId),
    idxTransaction: index('idx_te_transaction').on(table.transactionId),
    idxMode: index('idx_te_mode').on(table.mode),
    idxStatus: index('idx_te_status').on(table.status),
    idxCreatedAt: index('idx_te_created_at').on(table.createdAt),
  }),
);
