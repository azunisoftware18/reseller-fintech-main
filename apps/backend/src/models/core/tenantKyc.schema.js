import {
  mysqlTable,
  timestamp,
  foreignKey,
  varchar,
  uniqueIndex,
  index,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

import { tenantsTable, usersTable } from './index.js';

export const tenantKycTable = mysqlTable(
  'tenants_kyc',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),

    tenantId: varchar('tenant_id', { length: 36 }).notNull(),

    status: varchar('status', { length: 20 }).notNull().default('PENDING'), // PENDING | VERIFIED | REJECTED

    submittedByUserId: varchar('submitted_by_user_id', {
      length: 36,
    }),

    verifiedByUserId: varchar('verified_by_user_id', {
      length: 36,
    }),

    verifiedByEmployeeId: varchar('verified_by_employee_id', {
      length: 36,
    }),

    actionedAt: timestamp('actioned_at'),
    actionReason: varchar('action_reason', { length: 500 }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },

  (table) => ({
    tenantKycTenantFk: foreignKey({
      name: 'tk_tenant_fk',
      columns: [table.tenantId],
      foreignColumns: [tenantsTable.id],
    }),

    tenantKycSubmittedByUserFk: foreignKey({
      name: 'tk_submitted_by_user_fk',
      columns: [table.submittedByUserId],
      foreignColumns: [usersTable.id],
    }),

    tenantKycVerifiedByUserFk: foreignKey({
      name: 'tk_verified_by_user_fk',
      columns: [table.verifiedByUserId],
      foreignColumns: [usersTable.id],
    }),

    uniqTenantKyc: uniqueIndex('uniq_tenant_kyc').on(table.tenantId),

    idxTenantKycStatus: index('idx_tenant_kyc_status').on(table.status),
  }),
);
