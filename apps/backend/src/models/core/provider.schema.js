import {
  mysqlTable,
  timestamp,
  varchar,
  boolean,
  uniqueIndex,
  index,
  json,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const ProviderTable = mysqlTable(
  'providers',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),

    code: varchar('code', { length: 40 }).notNull(),

    providerName: varchar('provider_name', {
      length: 100,
    }).notNull(),

    handler: varchar('handler', { length: 200 }).notNull(),

    isActive: boolean('is_active').default(true).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqProviderCode: uniqueIndex('uniq_provider_code').on(table.code),
    idxProviderActive: index('idx_provider_active').on(table.isActive),
  }),
);
