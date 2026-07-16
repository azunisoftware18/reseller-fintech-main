import {
  mysqlTable,
  varchar,
  timestamp,
  foreignKey,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

import { employeesTable, permissionTable } from './index.js';

export const employeePermissionTable = mysqlTable(
  'employee_permissions',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),

    employeeId: varchar('employee_id', { length: 36 }).notNull(),
    permissionId: varchar('permission_id', { length: 36 }).notNull(),

    effect: varchar('effect', { length: 10 }).notNull().default('ALLOW'), // ALLOW | DENY

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },

  (table) => ({
    empPermissionEmployeeFk: foreignKey({
      name: 'ep_employee_fk',
      columns: [table.employeeId],
      foreignColumns: [employeesTable.id],
    }),

    empPermissionPermissionFk: foreignKey({
      name: 'ep_permission_fk',
      columns: [table.permissionId],
      foreignColumns: [permissionTable.id],
    }),

    uniqEmployeePermission: uniqueIndex('uniq_employee_permission').on(
      table.employeeId,
      table.permissionId,
    ),
  }),
);
