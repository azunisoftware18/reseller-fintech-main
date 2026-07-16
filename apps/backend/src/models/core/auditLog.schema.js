import {
  mysqlTable,
  timestamp,
  foreignKey,
  varchar,
  json,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

import { tenantsTable, usersTable } from './index.js';

export const auditLogTable = mysqlTable(
  'audit_log',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),

    entityType: varchar('entity_type', { length: 100 }).notNull(),
    entityId: varchar('entity_id', { length: 36 }).notNull(),

    action: varchar('action', { length: 100 }).notNull(),

    oldData: json('old_data'),
    newData: json('new_data'),

    performByUserId: varchar('perform_by_user_id', { length: 36 }),
    performByEmployeeId: varchar('perform_by_employee_id', { length: 36 }),

    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: varchar('user_agent', { length: 500 }),

    tenantId: varchar('tenant_id', { length: 36 }),
    metaData: json('meta_data'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },

  (table) => ({
    auditUserFk: foreignKey({
      name: 'audit_user_fk',
      columns: [table.performByUserId],
      foreignColumns: [usersTable.id],
    }),

    auditTenantFk: foreignKey({
      name: 'audit_tenant_fk',
      columns: [table.tenantId],
      foreignColumns: [tenantsTable.id],
    }),
  }),
);
