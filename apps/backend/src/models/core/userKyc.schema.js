import {
  mysqlTable,
  timestamp,
  varchar,
  foreignKey,
  uniqueIndex,
  index,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

import { usersTable, employeesTable } from './index.js';

export const usersKycTable = mysqlTable(
  'users_kyc',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),

    userId: varchar('user_id', { length: 36 }).notNull(),

    status: varchar('status', { length: 20 }).notNull().default('PENDING'),

    submittedByUserId: varchar('submitted_by_user_id', { length: 36 }),
    submittedAt: timestamp('submitted_at'),

    approvedByUserId: varchar('approved_by_user_id', { length: 36 }),
    approvedByEmployeeId: varchar('approved_by_employee_id', { length: 36 }),
    approvedAt: timestamp('approved_at'),
    approvalNotes: varchar('approval_notes', { length: 1000 }),

    rejectedByUserId: varchar('rejected_by_user_id', { length: 36 }),
    rejectedByEmployeeId: varchar('rejected_by_employee_id', { length: 36 }),
    rejectedAt: timestamp('rejected_at'),
    rejectionReason: varchar('rejection_reason', { length: 500 }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },

  (table) => ({
    userKycUserFk: foreignKey({
      name: 'uk_user_fk',
      columns: [table.userId],
      foreignColumns: [usersTable.id],
    }),

    userKycSubmittedByUserFk: foreignKey({
      name: 'uk_submitted_by_user_fk',
      columns: [table.submittedByUserId],
      foreignColumns: [usersTable.id],
    }),

    userKycApprovedByUserFk: foreignKey({
      name: 'uk_approved_by_user_fk',
      columns: [table.approvedByUserId],
      foreignColumns: [usersTable.id],
    }),

    userKycApprovedByEmployeeFk: foreignKey({
      name: 'uk_approved_by_employee_fk',
      columns: [table.approvedByEmployeeId],
      foreignColumns: [employeesTable.id],
    }),

    userKycRejectedByUserFk: foreignKey({
      name: 'uk_rejected_by_user_fk',
      columns: [table.rejectedByUserId],
      foreignColumns: [usersTable.id],
    }),

    userKycRejectedByEmployeeFk: foreignKey({
      name: 'uk_rejected_by_employee_fk',
      columns: [table.rejectedByEmployeeId],
      foreignColumns: [employeesTable.id],
    }),

    uniqUserKyc: uniqueIndex('uniq_user_kyc').on(table.userId),

    idxUserKycStatus: index('idx_user_kyc_status').on(table.status),
    idxUserKycSubmittedAt: index('idx_user_kyc_submitted_at').on(
      table.submittedAt,
    ),
  }),
);
