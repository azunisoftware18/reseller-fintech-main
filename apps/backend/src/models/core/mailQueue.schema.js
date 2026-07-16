// models/core/mailQueue.schema.js

import {
  mysqlTable,
  varchar,
  timestamp,
  text,
  int,
  index,
  foreignKey,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { tenantsTable } from './tenant.schema.js';

export const mailQueueTable = mysqlTable(
  'mail_queue',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),

    tenantId: varchar('tenant_id', { length: 36 }).notNull(),

    to: varchar('recipient_email', { length: 255 }).notNull(),
    subject: varchar('subject', { length: 255 }).notNull(),
    html: text('html').notNull(),

    status: varchar('status', { length: 20 }).default('PENDING').notNull(), // PENDING | PROCESSING | SENT | FAILED

    attempts: int('attempts').default(0).notNull(),

    nextAttemptAt: timestamp('next_attempt_at').defaultNow().notNull(),

    errorMessage: text('error_message'),

    createdAt: timestamp('created_at').defaultNow().notNull(),

    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },

  (table) => ({
    mailTenantFk: foreignKey({
      name: 'mail_queue_tenant_fk',
      columns: [table.tenantId],
      foreignColumns: [tenantsTable.id],
    }),

    idxMailStatusRetry: index('idx_mail_status_retry').on(
      table.status,
      table.nextAttemptAt,
    ),
  }),
);
