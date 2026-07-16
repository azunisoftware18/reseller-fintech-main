import {
  mysqlTable,
  timestamp,
  foreignKey,
  varchar,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

import { departmentTable, permissionTable } from './index.js';

export const departmentPermissionTable = mysqlTable(
  'department_permissions',
  {
    id: varchar('id', { length: 36 })
  .primaryKey()
  .default(sql`(UUID())`),

    departmentId: varchar('department_id', { length: 36 }).notNull(),
    permissionId: varchar('permission_id', { length: 36 }).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },

  (table) => ({
    deptPermissionDepartmentFk: foreignKey({
      name: 'dp_department_fk',
      columns: [table.departmentId],
      foreignColumns: [departmentTable.id],
    }),

    deptPermissionPermissionFk: foreignKey({
      name: 'dp_permission_fk',
      columns: [table.permissionId],
      foreignColumns: [permissionTable.id],
    }),

    uniqDepartmentPermission: uniqueIndex('uniq_department_permission').on(
      table.departmentId,
      table.permissionId,
    ),
  }),
);
