import {
  mysqlTable,
  timestamp,
  varchar,
  foreignKey,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

import { permissionTable, usersTable } from './index.js';

export const userPermissionTable = mysqlTable(
  'user_permissions',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),

    userId: varchar('user_id', { length: 36 }).notNull(),
    permissionId: varchar('permission_id', { length: 36 }).notNull(),

    effect: varchar('effect', { length: 20 }).notNull().default('ALLOW'), // ALLOW | DENY

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },

  (table) => ({
    upUserFk: foreignKey({
      name: 'up_user_fk',
      columns: [table.userId],
      foreignColumns: [usersTable.id],
    }),

    upPermissionFk: foreignKey({
      name: 'up_permission_fk',
      columns: [table.permissionId],
      foreignColumns: [permissionTable.id],
    }),

    uniqUserPermission: uniqueIndex('uniq_user_permission').on(
      table.userId,
      table.permissionId,
    ),
  }),
);
