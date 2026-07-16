import {
  foreignKey,
  mysqlTable,
  timestamp,
  varchar,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

import { departmentTable, tenantsTable, usersTable } from './index.js';

export const employeesTable = mysqlTable(
  'employees',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),

    employeeNumber: varchar('employee_number', { length: 30 })
      .notNull()
      .unique(),

    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),

    email: varchar('email', { length: 255 }).notNull(),
    emailVerifiedAt: timestamp('email_verified_at'),

    mobileNumber: varchar('mobile_number', { length: 20 }).notNull(),

    profilePicture: varchar('profile_picture', { length: 255 }),

    passwordHash: varchar('password_hash', { length: 255 }).notNull(),

    employeeStatus: varchar('employee_status', { length: 20 })
      .notNull()
      .default('INACTIVE'),

    departmentId: varchar('department_id', { length: 36 }).notNull(),

    refreshTokenHash: varchar('refresh_token_hash', { length: 255 }),
    passwordResetTokenHash: varchar('password_reset_token_hash', {
      length: 255,
    }),
    passwordResetTokenExpiry: timestamp('password_reset_token_expiry'),

    actionReason: varchar('action_reason', { length: 500 }),
    actionedAt: timestamp('actioned_at'),

    tenantId: varchar('tenant_id', { length: 36 }).notNull(),

    createdByUserId: varchar('created_by_user_id', { length: 36 }),
    createdByEmployeeId: varchar('created_by_employee_id', { length: 36 }),
    updatedByUserId: varchar('updated_by_user_id', { length: 36 }),
    updatedByEmployeeId: varchar('updated_by_employee_id', { length: 36 }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },

  (table) => ({
    employeeDepartmentFk: foreignKey({
      name: 'emp_department_fk',
      columns: [table.departmentId],
      foreignColumns: [departmentTable.id],
    }),

    employeeTenantFk: foreignKey({
      name: 'emp_tenant_fk',
      columns: [table.tenantId],
      foreignColumns: [tenantsTable.id],
    }),

    createdByUserFk: foreignKey({
      name: 'cs_created_by_user_fk',
      columns: [table.createdByUserId],
      foreignColumns: [usersTable.id],
    }),

    createdByEmployeeFk: foreignKey({
      name: 'cs_created_by_employee_fk',
      columns: [table.createdByEmployeeId],
      foreignColumns: [table.id],
    }),

    updatedByUserFk: foreignKey({
      name: 'cs_updated_by_user_fk',
      columns: [table.updatedByUserId],
      foreignColumns: [usersTable.id],
    }),

    updatedByEmployeeFk: foreignKey({
      name: 'cs_updated_by_employee_fk',
      columns: [table.updatedByEmployeeId],
      foreignColumns: [table.id],
    }),

    // Composite unique indexes (per tenant)
    uniqEmailTenant: uniqueIndex('uniq_email_tenant').on(
      table.email,
      table.tenantId,
    ),

    uniqMobileTenant: uniqueIndex('uniq_mobile_tenant').on(
      table.mobileNumber,
      table.tenantId,
    ),

    idxEmployeeTenantStatus: index('idx_emp_tenant_status').on(
      table.tenantId,
      table.employeeStatus,
    ),

    idxEmployeeDepartment: index('idx_emp_department').on(table.departmentId),
  }),
);
