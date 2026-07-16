import {
  mysqlTable,
  timestamp,
  foreignKey,
  varchar,
  boolean,
  uniqueIndex,
  bigint,
  json,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { ProviderTable, ServiceTable } from './index.js';

export const ServiceProviderMappingTable = mysqlTable(
  'service_providers_mapping',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),

    ServiceId: varchar('service_id', { length: 36 }).notNull(),
    ProviderId: varchar('provider_id', { length: 36 }).notNull(),

    mode: varchar('mode', { length: 40 }),
    pricingValueType: varchar('pricing_value_type', { length: 40 }),

    providerCost: bigint('provider_cost', { mode: 'bigint' })
      .notNull()
      .default(0),

    commissionStartLevel: varchar('commission_start_level', {
      length: 40,
    }).notNull(), //  HIERARCHY, AZZUNIQUE, NONE

    applyTDS: boolean('apply_tds').notNull().default(false),
    tdsPercent: bigint('tds_percent', { mode: 'bigint' }),

    applyGST: boolean('apply_gst').notNull().default(false),
    gstPercent: bigint('gst_percent', { mode: 'bigint' }),

    supportsSlab: boolean('support_slab').notNull().default(false),

    config: json('config'),
    isActive: boolean('is_active').default(true).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },

  (table) => ({
    ServiceFk: foreignKey({
      name: 'service_fk',
      columns: [table.ServiceId],
      foreignColumns: [ServiceTable.id],
    }),

    ProviderFk: foreignKey({
      name: 'provider_fk',
      columns: [table.ProviderId],
      foreignColumns: [ProviderTable.id],
    }),

    uniqProvider: uniqueIndex('uniq_provider').on(
      table.ServiceId,
      table.ProviderId,
    ),
  }),
);
