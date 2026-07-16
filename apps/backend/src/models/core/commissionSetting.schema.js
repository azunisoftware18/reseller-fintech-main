import {
  mysqlTable,
  timestamp,
  varchar,
  boolean,
  foreignKey,
  uniqueIndex,
  index,
  decimal,
  bigint,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

import {
  ServiceTable,
  tenantsTable,
  roleTable,
  usersTable,
  ServiceProviderMappingTable,
  employeesTable,
} from './index.js';

export const commissionSettingTable = mysqlTable(
  'commission_settings',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),

    tenantId: varchar('tenant_id', { length: 36 }).notNull(),

    scope: varchar('scope', { length: 20 }).notNull(), // ROLE | USER

    roleId: varchar('role_id', { length: 36 }),
    targetUserId: varchar('target_user_id', { length: 36 }),

    serviceProviderMappingId: varchar('service_provider_mapping_id', {
      length: 36,
    }).notNull(),

    mode: varchar('mode', { length: 20 }).notNull(), // COMMISSION | SURCHARGE
    type: varchar('type', { length: 20 }).notNull(), // FLAT | PERCENTAGE

    // ✅ bigint safe (no precision loss)
    value: bigint('value', { mode: 'bigint' }).notNull().default(0),

    applyTDS: boolean('apply_tds').default(false).notNull(),
    tdsPercent: decimal('tds_percent', { precision: 5, scale: 2 }).default('0'),

    applyGST: boolean('apply_gst').default(false).notNull(),
    gstPercent: decimal('gst_percent', { precision: 5, scale: 2 }).default('0'),

    supportsSlab: boolean('supports_slab').notNull().default(false),
    isActive: boolean('is_active').default(true).notNull(),

    /** 👤 EMPLOYEE TRACKING */
    createdByUserId: varchar('created_by_user_id', { length: 36 }),
    createdByEmployeeId: varchar('created_by_employee_id', { length: 36 }),
    updatedByUserId: varchar('updated_by_user_id', { length: 36 }),
    updatedByEmployeeId: varchar('updated_by_employee_id', { length: 36 }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqRoleRule: uniqueIndex('cs_role_rule_uniq').on(
      table.tenantId,
      table.serviceProviderMappingId,
      table.roleId,
      table.mode,
    ),

    uniqUserRule: uniqueIndex('cs_user_rule_uniq').on(
      table.tenantId,
      table.serviceProviderMappingId,
      table.targetUserId,
      table.mode,
    ),

    tenantFk: foreignKey({
      name: 'cs_tenant_fk',
      columns: [table.tenantId],
      foreignColumns: [tenantsTable.id],
    }),

    serviceFk: foreignKey({
      name: 'cs_service_fk',
      columns: [table.serviceProviderMappingId],
      foreignColumns: [ServiceProviderMappingTable.id],
    }),

    roleFk: foreignKey({
      name: 'cs_role_fk',
      columns: [table.roleId],
      foreignColumns: [roleTable.id],
    }),

    userFk: foreignKey({
      name: 'cs_user_fk',
      columns: [table.targetUserId],
      foreignColumns: [usersTable.id],
    }),

    createdByUserFk: foreignKey({
      name: 'cs_created_by_user_fk_v1',
      columns: [table.createdByUserId],
      foreignColumns: [usersTable.id],
    }),

    createdByEmployeeFk: foreignKey({
      name: 'cs_created_by_employee_fk_v1',
      columns: [table.createdByEmployeeId],
      foreignColumns: [employeesTable.id],
    }),

    updatedByUserFk: foreignKey({
      name: 'cs_updated_by_user_fk_v2',
      columns: [table.updatedByUserId],
      foreignColumns: [usersTable.id],
    }),

    updatedByEmployeeFk: foreignKey({
      name: 'cs_updated_by_employee_fk_v2',
      columns: [table.updatedByEmployeeId],
      foreignColumns: [employeesTable.id],
    }),

    idxResolve: index('cs_resolve_idx').on(
      table.tenantId,
      table.scope,
      table.roleId,
      table.targetUserId,
      table.isActive,
    ),
  }),
);
