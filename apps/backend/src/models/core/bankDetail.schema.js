import {
  mysqlTable,
  timestamp,
  varchar,
  foreignKey,
  uniqueIndex,
  index,
  boolean,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

import {
  banksTable,
  usersTable,
  employeesTable,
  tenantsTable,
} from './index.js';

export const bankDetailTable = mysqlTable(
  'user_bank_detail',
  {
    id: varchar('id', { length: 36  })
      .primaryKey()
      .default(sql`(UUID())`),

    tenantId: varchar('tenant_id', { length: 36 }).notNull(),

    // Reference to bank master
    bankId: varchar('bank_id', { length: 36 }).notNull(),

    userId: varchar('user_id', { length: 36 }).notNull(),

    bankName: varchar('bank_name', { length: 255 }).notNull(),
    accountHolderName: varchar('account_holder_name', {
      length: 255,
    }).notNull(),
    accountNumber: varchar('account_number', { length: 255 }).notNull(),
    ifscCode: varchar('ifsc_code', { length: 255 }).notNull(),
    branchName: varchar('branch_name', { length: 255 }).notNull(),

    isPrimary: boolean('is_primary').default(false).notNull(),

    verificationStatus: varchar('verification_status', {
      length: 20,
    })
      .notNull()
      .default('PENDING'), // PENDING | VERIFIED | REJECTED

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

    isActive: boolean('is_active').default(true).notNull(),
  },

  (table) => ({
    bankDetailTenantFk: foreignKey({
      name: 'bd_tenant_fk',
      columns: [table.tenantId],
      foreignColumns: [tenantsTable.id],
    }),

    bankDetailBankFk: foreignKey({
      name: 'bd_bank_fk',
      columns: [table.bankId],
      foreignColumns: [banksTable.id],
    }),

    bankDetailSubmittedByUserFk: foreignKey({
      name: 'bd_submitted_by_user_fk',
      columns: [table.submittedByUserId],
      foreignColumns: [usersTable.id],
    }),

    bankDetailApprovedByUserFk: foreignKey({
      name: 'bd_approved_by_user_fk',
      columns: [table.approvedByUserId],
      foreignColumns: [usersTable.id],
    }),

    bankDetailApprovedByEmployeeFk: foreignKey({
      name: 'bd_approved_by_employee_fk',
      columns: [table.approvedByEmployeeId],
      foreignColumns: [employeesTable.id],
    }),

    bankDetailRejectedByUserFk: foreignKey({
      name: 'bd_rejected_by_user_fk',
      columns: [table.rejectedByUserId],
      foreignColumns: [usersTable.id],
    }),

    bankDetailRejectedByEmployeeFk: foreignKey({
      name: 'bd_rejected_by_employee_fk',
      columns: [table.rejectedByEmployeeId],
      foreignColumns: [employeesTable.id],
    }),

    bankDetailUserFk: foreignKey({
      name: 'bd_user_fk',
      columns: [table.userId],
      foreignColumns: [usersTable.id],
    }),

    uniqBankDetail: uniqueIndex('uniq_bank_detail').on(
      table.userId,
      table.accountNumber,
    ),

    idxBankDetailVerificationStatus: index(
      'idx_bank_detail_verification_status',
    ).on(table.verificationStatus),
    idxBankDetailSubmittedAt: index('idx_bank_detail_submitted_at').on(
      table.submittedAt,
    ),
    idxBankDetailIsPrimary: index('idx_bank_detail_is_primary').on(
      table.isPrimary,
    ),
  }),
);
