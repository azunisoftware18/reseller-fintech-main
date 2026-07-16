import {
  mysqlTable,
  timestamp,
  foreignKey,
  varchar,
  boolean,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

import { tenantPagesTable } from './index.js';

export const tenantSeoTable = mysqlTable(
  'tenants_seo',
  {
    id: varchar('id', { length: 36 })
  .primaryKey()
  .default(sql`(UUID())`),

    tenantPageId: varchar('tenant_page_id', {
      length: 36,
    }).notNull(),

    metaTitle: varchar('meta_title', { length: 255 }).notNull(),
    metaDescription: varchar('meta_description', { length: 1000 }),
    metaKeywords: varchar('meta_keywords', { length: 500 }),

    isIndexed: boolean('is_indexed').notNull().default(true),
    isFollowed: boolean('is_followed').notNull().default(true),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },

  (table) => ({
    tenantSeoPageFk: foreignKey({
      name: 'tseo_page_fk',
      columns: [table.tenantPageId],
      foreignColumns: [tenantPagesTable.id],
    }),

    uniqTenantPageSeo: uniqueIndex('uniq_tenant_page_seo').on(
      table.tenantPageId,
    ),
  }),
);
