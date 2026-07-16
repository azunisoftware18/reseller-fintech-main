import {
  mysqlTable,
  timestamp,
  foreignKey,
  varchar,
  boolean,
  uniqueIndex,
  index,
  text,
  date,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

import { roleTable, tenantsTable, usersTable as self } from './index.js';

export const usersTable = mysqlTable(
  'users',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),

    userNumber: varchar('user_number', { length: 30 }).notNull(),

    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    fatherName: varchar('father_name', { length: 100 }),
    dob: date('dob'),

    gender: varchar('gender', { length: 10 }),

    email: varchar('email', { length: 255 }).notNull(),
    emailVerifiedAt: timestamp('email_verified_at'),

    mobileNumber: varchar('mobile_number', { length: 20 }).notNull(),

    profilePicture: varchar('profile_picture', { length: 255 }),

    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    transactionPinHash: varchar('transaction_pin_hash', { length: 255 }),

    userStatus: varchar('user_status', { length: 20 })
      .notNull()
      .default('INACTIVE'),

    isKycVerified: boolean('is_kyc_verified').notNull().default(false),
    isBankDetailVerified: boolean('is_bank_detail_verified').default(false),

    roleId: varchar('role_id', { length: 36 }).notNull(),

    refreshTokenHash: text('refresh_token_hash'),
    passwordResetTokenHash: text('password_reset_token_hash'),
    passwordResetTokenExpiry: timestamp('password_reset_token_expiry'),

    actionReason: varchar('action_reason', { length: 500 }),
    actionedAt: timestamp('actioned_at'),
    deletedAt: timestamp('deleted_at'),

    /** 🔑 HIERARCHY */
    ownerUserId: varchar('owner_user_id', { length: 36 }),

    /** 🧾 AUDIT */
    createdByUserId: varchar('created_by_user_id', { length: 36 }),
    createdByEmployeeId: varchar('created_by_employee_id', { length: 36 }),

    tenantId: varchar('tenant_id', { length: 36 }).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },

  (table) => ({
    userRoleFk: foreignKey({
      name: 'user_role_fk',
      columns: [table.roleId],
      foreignColumns: [roleTable.id],
    }),

    userTenantFk: foreignKey({
      name: 'user_tenant_fk',
      columns: [table.tenantId],
      foreignColumns: [tenantsTable.id],
    }),

    /** OWNER (Hierarchy) */
    userOwnerFk: foreignKey({
      name: 'user_owner_fk',
      columns: [table.ownerUserId],
      foreignColumns: [self.id],
    }),

    /** CREATED BY USER (Audit) */
    userCreatedByUserFk: foreignKey({
      name: 'user_created_by_user_fk',
      columns: [table.createdByUserId],
      foreignColumns: [self.id],
    }),

    /** UNIQUE CONSTRAINTS */
    uniqUserNumber: uniqueIndex('uniq_user_number').on(table.userNumber),

    uniqUserEmail: uniqueIndex('uniq_user_email').on(
      table.tenantId,
      table.email,
    ),

    uniqUserMobile: uniqueIndex('uniq_user_mobile').on(
      table.tenantId,
      table.mobileNumber,
    ),

    /** INDEXES */
    idxUserTenantStatus: index('idx_user_tenant_status').on(
      table.tenantId,
      table.userStatus,
    ),

    idxUserOwner: index('idx_user_owner').on(table.ownerUserId),
  }),
);
