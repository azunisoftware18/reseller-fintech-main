import {
  mysqlTable,
  varchar,
  timestamp,
  foreignKey,
  uniqueIndex,
  index,
  check,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

import { usersTable } from './index.js';

export const tenantsTable = mysqlTable(
  'tenants',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),

    tenantNumber: varchar('tenant_number', { length: 30 }).notNull(),

    tenantName: varchar('tenant_name', { length: 255 }).notNull(),
    tenantLegalName: varchar('tenant_legal_name', { length: 255 }).notNull(),

    tenantType: varchar('tenant_type', { length: 30 }).notNull(),
    // PROPRIETORSHIP | PARTNERSHIP | PRIVATE_LIMITED

    userType: varchar('user_type', { length: 20 }).notNull(),
    // AZZUNIQUE | RESELLER | WHITELABEL

    tenantEmail: varchar('tenant_email', { length: 255 }).notNull(),
    tenantWhatsapp: varchar('tenant_whatsapp', { length: 20 }).notNull(),

    parentTenantId: varchar('parent_tenant_id', { length: 36 }),
    createdByUserId: varchar('created_by_user_id', { length: 36 }),
    createdByEmployeeId: varchar('created_by_employee_id', { length: 36 }),

    tenantStatus: varchar('tenant_status', { length: 20 }).notNull(),
    // ACTIVE | INACTIVE | SUSPENDED

    tenantMobileNumber: varchar('tenant_mobile_number', {
      length: 20,
    }).notNull(),

    actionReason: varchar('action_reason', { length: 255 }),
    actionedAt: timestamp('actioned_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    /** CHECK constraint */
    chkUserType: check(
      'chk_tenants_user_type',
      sql`${table.userType} IN ('AZZUNIQUE','RESELLER','WHITELABEL')`,
    ),

    tenantParentFk: foreignKey({
      name: 'tenant_parent_fk',
      columns: [table.parentTenantId],
      foreignColumns: [table.id],
    }),

    tenantCreatedByUserFk: foreignKey({
      name: 'tenant_created_by_user_fk',
      columns: [table.createdByUserId],
      foreignColumns: [usersTable.id],
    }),

    uniqTenantNumber: uniqueIndex('uniq_tenant_number').on(table.tenantNumber),

    uniqTenantWhatsapp: uniqueIndex('uniq_tenant_whatsapp').on(
      table.parentTenantId,
      table.tenantWhatsapp,
    ),

    uniqTenantMobileNumber: uniqueIndex('uniq_tenant_mobile_number').on(
      table.parentTenantId,
      table.tenantMobileNumber,
    ),

    uniqTenantEmail: uniqueIndex('uniq_tenant_email').on(
      table.parentTenantId,
      table.tenantEmail,
    ),

    idxTenantParent: index('idx_tenant_parent').on(table.parentTenantId),
    idxTenantStatus: index('idx_tenant_status').on(table.tenantStatus),
  }),
);
