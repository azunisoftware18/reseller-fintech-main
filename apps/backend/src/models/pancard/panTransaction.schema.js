import {
  mysqlTable,
  varchar,
  int,
  timestamp,
  json,
  foreignKey,
  index,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { usersTable } from '../core/index.js';
import { usersKycTable } from '../core/index.js';

export const panTransactionTable = mysqlTable(
  'pan_transactions',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),

    userId: varchar('user_id', { length: 36 }).notNull(),

    usersKycId: varchar('users_kyc_id', { length: 36 }),

    tenantId: varchar('tenant_id', { length: 36 }).notNull(),

    maskedPan: varchar('masked_pan', { length: 20 }).notNull(),
    panEncrypted: varchar('pan_encrypted', {
      length: 255,
    }).notNull(),

    referenceId: varchar('reference_id', { length: 100 }),
    providerTxnId: varchar('provider_txn_id', { length: 100 }),

    providerConfig: json('provider_config'),

    providerCode: varchar('provider_code', { length: 40 }).notNull(),
    providerResponse: json('provider_response'),

    status: varchar('status', { length: 20 }).notNull(),
    // INITIATED | OTP_SENT | VERIFIED | FAILED

    failureReason: varchar('failure_reason', { length: 255 }),
    attemptCount: int('attempt_count').default(0),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    fkUser: foreignKey({
      columns: [table.userId],
      foreignColumns: [usersTable.id],
    }),

    fkUserKyc: foreignKey({
      columns: [table.usersKycId],
      foreignColumns: [usersKycTable.id],
    }),

    idxUser: index('idx_pan_user').on(table.userId),
  }),
);
