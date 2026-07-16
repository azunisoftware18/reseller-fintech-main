import {
  mysqlTable,
  varchar,
  timestamp,
  foreignKey,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

import { tenantsTable, usersTable, employeesTable } from './index.js';

export const departmentTable = mysqlTable(
  'departments',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),

    departmentCode: varchar('department_code', { length: 50 }).notNull(),

    departmentName: varchar('department_name', { length: 100 }).notNull(),
    departmentDescription: varchar('department_description', {
      length: 255,
    }),

    tenantId: varchar('tenant_id', { length: 36 }).notNull(),

    createdByUserId: varchar('created_by_user_id', { length: 36 }),
    createdByEmployeeId: varchar('created_by_employee_id', { length: 36 }),

    updatedByUserId: varchar('updated_by_user_id', { length: 36 }),
    updatedByEmployeeId: varchar('updated_by_employee_id', { length: 36 }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },

  (table) => ({
    uniqDeptCodeTenant: uniqueIndex('uniq_dept_code_tenant').on(
      table.departmentCode,
      table.tenantId,
    ),

    departmentCreatedByUserFk: foreignKey({
      name: 'dept_created_by_user_fk',
      columns: [table.createdByUserId],
      foreignColumns: [usersTable.id],
    }),

    departmentCreatedByEmployeeFk: foreignKey({
      name: 'dept_created_by_employee_fk',
      columns: [table.createdByEmployeeId],
      foreignColumns: [employeesTable.id],
    }),

    departmentUpdatedByUserFk: foreignKey({
      name: 'dept_updated_by_user_fk',
      columns: [table.updatedByUserId],
      foreignColumns: [usersTable.id],
    }),

    departmentUpdatedByEmployeeFk: foreignKey({
      name: 'dept_updated_by_employee_fk',
      columns: [table.updatedByEmployeeId],
      foreignColumns: [employeesTable.id],
    }),

    tenantIdFk: foreignKey({
      name: 'dept_tenant_fk',
      columns: [table.tenantId],
      foreignColumns: [tenantsTable.id],
    }),
  }),
);
