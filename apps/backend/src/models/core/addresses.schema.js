import {
  mysqlTable,
  varchar,
  timestamp,
  text,
  foreignKey,
  index,
  boolean,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { usersTable, statesTable, citiesTable } from './index.js';

export const addressesTable = mysqlTable(
  'addresses',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),

    userId: varchar('user_id', { length: 36 }).notNull(),
    tenantId: varchar('tenant_id', { length: 36 }).notNull(),

    address: text('address').notNull(),
    pinCode: varchar('pin_code', { length: 10 }).notNull(),
    stateId: varchar('state_id', { length: 36 }).notNull(),
    cityId: varchar('city_id', { length: 36 }).notNull(),

    // Address type for future (HOME, OFFICE, etc)
    addressType: varchar('address_type', { length: 20 }).default('HOME'),

    isActive: boolean('is_active').notNull().default(true),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userAddressUserFk: foreignKey({
      name: 'ua_user_fk',
      columns: [table.userId],
      foreignColumns: [usersTable.id],
    }),

    userAddressStateFk: foreignKey({
      name: 'ua_state_fk',
      columns: [table.stateId],
      foreignColumns: [statesTable.id],
    }),

    userAddressCityFk: foreignKey({
      name: 'ua_city_fk',
      columns: [table.cityId],
      foreignColumns: [citiesTable.id],
    }),

    idxUserAddressUser: index('idx_ua_user').on(table.userId),
    idxUserAddressActive: index('idx_ua_active').on(table.isActive),
  }),
);
