import {
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';

export const rechargeCircleMapTable = mysqlTable(
  'recharge_circle_map',
  {
    id: varchar('id', { length: 36 }).primaryKey(),

    serviceProviderMappingId: varchar('service_provider_mapping_id', {
      length: 36,
    }).notNull(),

    internalCircleCode: varchar('internal_circle_code', {
      length: 20,
    }).notNull(),

    providerCircleCode: varchar('provider_circle_code', {
      length: 20,
    }).notNull(),

    direction: varchar('direction', { length: 20 }).notNull(),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    uqCircleMap: uniqueIndex('uq_circle_map_dir').on(
      table.serviceProviderMappingId,
      table.internalCircleCode,
      table.direction,
    ),
  }),
);
