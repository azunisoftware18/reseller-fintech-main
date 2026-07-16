import {
  mysqlTable,
  varchar,
  timestamp,
  foreignKey,
  uniqueIndex,
  index,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { tenantsTable } from './tenant.schema.js';
import { usersTable } from './user.schema.js';
import { serverDetailTable } from './serverDetails.schema.js';

export const tenantsDomainsTable = mysqlTable(
  'tenants_domains',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),

    tenantId: varchar('tenant_id', { length: 36 }).notNull(),

    domainName: varchar('domain_name', { length: 255 }).notNull(),

    status: varchar('status', { length: 20 }).notNull(),
    // ACTIVE | INACTIVE | SUSPENDED | DELETED

    actionReason: varchar('action_reason', { length: 255 }),
    actionedAt: timestamp('actioned_at'),

    createdByEmployeeId: varchar('created_by_employee_id', {
      length: 36,
    }),

    createdByUserId: varchar('created_by_user_id', {
      length: 36,
    }).notNull(),

    serverDetailId: varchar('server_detail_id', {
      length: 36,
    }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    tenantDomainTenantFk: foreignKey({
      name: 'td_tenant_fk',
      columns: [table.tenantId],
      foreignColumns: [tenantsTable.id],
    }),

    tenantDomainUserFk: foreignKey({
      name: 'td_created_by_user_fk',
      columns: [table.createdByUserId],
      foreignColumns: [usersTable.id],
    }),

    tenantDomainServerFk: foreignKey({
      name: 'td_server_detail_fk',
      columns: [table.serverDetailId],
      foreignColumns: [serverDetailTable.id],
    }),

    uniqDomainName: uniqueIndex('uniq_tenant_domain').on(table.domainName),

    idxTenantDomainTenant: index('idx_tenant_domain_tenant').on(table.tenantId),

    idxTenantDomainStatus: index('idx_tenant_domain_status').on(table.status),
  }),
);
