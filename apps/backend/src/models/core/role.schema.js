import {
  mysqlTable,
  varchar,
  timestamp,
  boolean,
  foreignKey,
  uniqueIndex,
  index,
  int,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

import { tenantsTable, usersTable, employeesTable } from './index.js';

export const roleTable = mysqlTable(
  'roles',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),

    roleLevel: int('role_level').notNull(),

    roleCode: varchar('role_code', { length: 50 }).notNull(),
    roleName: varchar('role_name', { length: 100 }).notNull(),
    roleDescription: varchar('role_description', { length: 255 }),

    tenantId: varchar('tenant_id', { length: 36 }).notNull(),

    isSystem: boolean('is_system').notNull().default(false),

    createdByUserId: varchar('created_by_user_id', { length: 36 }),
    createdByEmployeeId: varchar('created_by_employee_id', { length: 36 }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },

  (table) => ({
    roleTenantFk: foreignKey({
      name: 'role_tenant_fk',
      columns: [table.tenantId],
      foreignColumns: [tenantsTable.id],
    }),

    roleCreatedByUserFk: foreignKey({
      name: 'role_created_by_user_fk',
      columns: [table.createdByUserId],
      foreignColumns: [usersTable.id],
    }),

    roleCreatedByEmployeeFk: foreignKey({
      name: 'role_created_by_employee_fk',
      columns: [table.createdByEmployeeId],
      foreignColumns: [employeesTable.id],
    }),

    uniqRoleCodeTenant: uniqueIndex('uniq_role_code_tenant').on(
      table.tenantId,
      table.roleCode,
    ),

    uniqRoleLevelTenant: uniqueIndex('uniq_role_level_tenant').on(
      table.tenantId,
      table.roleLevel,
    ),

    idxRoleTenantLevel: index('idx_role_tenant_level').on(
      table.tenantId,
      table.roleLevel,
    ),

    idxRoleTenant: index('idx_role_tenant').on(table.tenantId),
  }),
);
