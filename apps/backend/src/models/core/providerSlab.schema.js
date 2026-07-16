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
import { ServiceProviderMappingTable } from './index.js';

export const ProviderSlabTable = mysqlTable(
  'provider_slab',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),

    serviceProviderMappingId: varchar('service_provider_mapping_id', {
      length: 36,
    }).notNull(),

    minAmount: bigint('min_amount', { mode: 'bigint' }).notNull(),
    maxAmount: bigint('max_amount', { mode: 'bigint' }).notNull(),

    providerCost: bigint('provider_cost', { mode: 'bigint' }).notNull(),

    isActive: boolean('is_active').default(true).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    idxProviderActive: index('idx_provider_active').on(table.isActive),

    ServiceProviderMappingFk: foreignKey({
      name: 'service_provider_mapping_fk',
      columns: [table.serviceProviderMappingId],
      foreignColumns: [ServiceProviderMappingTable.id],
    }),
  }),
);
