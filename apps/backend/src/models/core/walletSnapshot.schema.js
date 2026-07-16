import {
  mysqlTable,
  varchar,
  timestamp,
  int,
  foreignKey,
  index,
} from 'drizzle-orm/mysql-core';
import { walletTable } from './index.js';

export const walletSnapshotTable = mysqlTable(
  'wallet_snapshots',
  {
    id: varchar('id', { length: 36 }).primaryKey(),

    walletId: varchar('wallet_id', { length: 36 }).notNull(),

    balance: int('balance').notNull(),
    blockedAmount: int('blocked_amount').notNull(),

    snapshotDate: timestamp('snapshot_date').notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    walletFk: foreignKey({
      columns: [table.walletId],
      foreignColumns: [walletTable.id],
    }),

    idxWalletSnapshotsWallet: index('idx_wallet_snapshots_wallet').on(
      table.walletId,
    ),
  }),
);
