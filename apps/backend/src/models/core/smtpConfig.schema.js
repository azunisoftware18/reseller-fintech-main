import {
  mysqlTable,
  timestamp,
  foreignKey,
  varchar,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

import { tenantsTable, usersTable } from './index.js';

export const smtpConfigTable = mysqlTable(
  'tenants_smtp_config',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),

    smtpHost: varchar('smtp_host', { length: 255 }).notNull(),
    smtpPort: varchar('smtp_port', { length: 10 }).notNull(),

    smtpUsername: varchar('smtp_username', { length: 255 }).notNull(),
    smtpPassword: varchar('smtp_password', { length: 255 }).notNull(),

    encryptionType: varchar('encryption_type', { length: 50 }), // TLS | SSL | STARTTLS
    fromName: varchar('from_name', { length: 255 }).notNull(),
    fromEmail: varchar('from_email', { length: 255 }).notNull(),

    createdByUserId: varchar('created_by_user_id', {
      length: 36,
    }).notNull(),

    createdByEmployeeId: varchar('created_by_employee_id', {
      length: 36,
    }),

    tenantId: varchar('tenant_id', { length: 36 }).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },

  (table) => ({
    smtpTenantFk: foreignKey({
      name: 'smtp_tenant_fk',
      columns: [table.tenantId],
      foreignColumns: [tenantsTable.id],
    }),

    smtpCreatedByUserFk: foreignKey({
      name: 'smtp_created_by_user_fk',
      columns: [table.createdByUserId],
      foreignColumns: [usersTable.id],
    }),

    uniqTenantSmtp: uniqueIndex('uniq_tenant_smtp_config').on(table.tenantId),
  }),
);
