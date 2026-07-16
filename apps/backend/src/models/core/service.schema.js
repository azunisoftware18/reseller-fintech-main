import {
  mysqlTable,
  varchar,
  timestamp,
  boolean,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const ServiceTable = mysqlTable(
  'services',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),

    code: varchar('code', { length: 40 }).notNull(),

    name: varchar('name', { length: 100 }).notNull(),

    isActive: boolean('is_active').default(true).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },

  (table) => ({
    uniqServiceCode: uniqueIndex('uniq_service_code').on(table.code),
  }),
);
