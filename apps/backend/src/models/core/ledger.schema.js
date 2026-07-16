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
  refundTable,
  transactionTable,
  walletTable,
  tenantsTable,
} from './index.js';

export const ledgerTable = mysqlTable(
  'ledgers',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),

    tenantId: varchar('tenant_id', { length: 36 }).notNull(),

    walletId: varchar('wallet_id', { length: 36 }).notNull(),

    transactionId: varchar('transaction_id', { length: 36 }),

    refundId: varchar('refund_id', { length: 36 }),

    apiEntityId: varchar('api_entity_id', { length: 36 }),

    reference: varchar('reference', { length: 255 }).notNull(),

    entryType: varchar('entry_type', { length: 20 }).notNull(),

    amount: bigint('amount', { mode: 'bigint' }).notNull().default(0),

    balanceAfter: bigint('balance_after', { mode: 'bigint' })
      .notNull()
      .default(0),

    blockedAfter: bigint('blocked_after', { mode: 'bigint' })
      .notNull()
      .default(0),

    availableAfter: bigint('available_after', { mode: 'bigint' })
      .notNull()
      .default(0),

    metadata: json('metadata'),

    createdAt: timestamp('created_at').defaultNow().notNull(),

    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },

  (table) => ({
    ledgerTenantFk: foreignKey({
      name: 'ledger_tenant_fk',
      columns: [table.tenantId],
      foreignColumns: [tenantsTable.id],
    }),

    ledgerWalletFk: foreignKey({
      name: 'ledger_wallet_fk',
      columns: [table.walletId],
      foreignColumns: [walletTable.id],
    }),

    // ✅ Optional FK - onDelete SET NULL
    ledgerTransactionFk: foreignKey({
      name: 'ledger_tx_fk',
      columns: [table.transactionId],
      foreignColumns: [transactionTable.id],
    }).onDelete('set null'), // ✅ Important!

    // ✅ Optional FK - onDelete SET NULL
    ledgerRefundFk: foreignKey({
      name: 'ledger_refund_fk',
      columns: [table.refundId],
      foreignColumns: [refundTable.id],
    }).onDelete('set null'), // ✅ Important!

    // ✅ Index for apiEntityId (no FK constraint)
    idxLedgerApiEntity: index('idx_ledger_api_entity').on(table.apiEntityId),

    uniqLedgerReference: uniqueIndex('uniq_ledger_tenant_reference').on(
      table.tenantId,
      table.reference,
    ),

    idxLedgerWalletCreated: index('idx_ledger_wallet_created').on(
      table.walletId,
      table.createdAt,
    ),

    idxLedgerTransaction: index('idx_ledger_transaction').on(
      table.transactionId,
    ),

    idxLedgerTenantCreated: index('idx_ledger_tenant_created').on(
      table.tenantId,
      table.createdAt,
    ),

    idxLedgerEntryType: index('idx_ledger_entry_type').on(
      table.tenantId,
      table.entryType,
    ),
  }),
);
