import {
  mysqlTable,
  timestamp,
  varchar,
  boolean,
  index,
  foreignKey,
  bigint,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { commissionSettingTable } from './index.js';

export const commissionSettingSlabTable = mysqlTable(
  'commission_setting_slabs',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),

    commissionSettingId: varchar('commission_setting_id', {
      length: 36,
    }).notNull(),

    minAmount: bigint('min_amount', { mode: 'bigint' }).notNull(),
    maxAmount: bigint('max_amount', { mode: 'bigint' }).notNull(),

    value: bigint('value', { mode: 'bigint' }).notNull(),

    isActive: boolean('is_active').default(true).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    idxIsActive: index('idx_commission_slab_is_active').on(table.isActive),

    fkCommissionSetting: foreignKey({
      name: 'fk_commission_slab_commission_setting',
      columns: [table.commissionSettingId],
      foreignColumns: [commissionSettingTable.id],
    }),
  }),
);
