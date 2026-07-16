import {
  mysqlTable,
  varchar,
  timestamp,
  boolean,
  uniqueIndex,
  index,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const permissionTable = mysqlTable(
  'permissions',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),

    resource: varchar('resource', { length: 100 }).notNull(),
    action: varchar('action', { length: 50 }).notNull(),

    serviceCode: varchar('service_code', { length: 40 }),

    isActive: boolean('is_active').notNull().default(true),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },

  (table) => ({
    uniqPermission: uniqueIndex('uniq_permission_resource_action').on(
      table.resource,
      table.action,
    ),
    idxServiceCode: index('idx_permission_service_code').on(table.serviceCode),
  }),
);
