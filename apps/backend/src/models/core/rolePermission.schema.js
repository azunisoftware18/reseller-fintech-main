import {
  mysqlTable,
  timestamp,
  foreignKey,
  varchar,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

import { permissionTable, roleTable } from './index.js';

export const rolePermissionTable = mysqlTable(
  'role_permissions',
  {
    id: varchar('id', { length: 36 })
  .primaryKey()
  .default(sql`(UUID())`),

    roleId: varchar('role_id', { length: 36 }).notNull(),
    permissionId: varchar('permission_id', { length: 36 }).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },

  (table) => ({
    rolePermissionRoleFk: foreignKey({
      name: 'rp_role_fk',
      columns: [table.roleId],
      foreignColumns: [roleTable.id],
    }),

    rolePermissionPermissionFk: foreignKey({
      name: 'rp_permission_fk',
      columns: [table.permissionId],
      foreignColumns: [permissionTable.id],
    }),

    uniqRolePermission: uniqueIndex('uniq_role_permission').on(
      table.roleId,
      table.permissionId,
    ),
  }),
);
