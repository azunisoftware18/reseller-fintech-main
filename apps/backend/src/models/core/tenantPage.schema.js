import {
  mysqlTable,
  timestamp,
  foreignKey,
  varchar,
  text,
  uniqueIndex,
  index,
  boolean,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

import {  tenantsTable, usersTable } from './index.js';

export const tenantPagesTable = mysqlTable(
  'tenants_pages',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),

    tenantId: varchar('tenant_id', { length: 36 }).notNull(),

    pageTitle: varchar('page_title', { length: 255 }).notNull(),
    pageContent: text('page_content'),

    pageUrl: varchar('page_url', { length: 255 }).notNull(),
    pageType: varchar('page_type', { length: 30 }).notNull(),

    isHomePage: boolean('is_home_page').notNull().default(false),

    status: varchar('status', { length: 20 }).notNull().default('DRAFT'),

    createdByUserId: varchar('created_by_user_id', { length: 36 }).notNull(),
    createdByEmployeeId: varchar('created_by_employee_id', { length: 36 }),

    sourceMasterPageId: varchar('source_master_page_id', { length: 36 }),

    deletedAt: timestamp('deleted_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    tenantPageTenantFk: foreignKey({
      name: 'tp_tenant_fk',
      columns: [table.tenantId],
      foreignColumns: [tenantsTable.id],
    }),

    tenantPageCreatedByUserFk: foreignKey({
      name: 'tp_created_by_user_fk',
      columns: [table.createdByUserId],
      foreignColumns: [usersTable.id],
    }),

    uniqTenantPageUrl: uniqueIndex('uniq_tenant_page_url').on(
      table.tenantId,
      table.pageUrl,
    ),

    idxTenantPageType: index('idx_tenant_page_type').on(table.pageType),
    idxTenantStatus: index('idx_tenant_pages_status').on(table.status),
  }),
);
