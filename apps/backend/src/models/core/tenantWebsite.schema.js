import {
  mysqlTable,
  timestamp,
  foreignKey,
  varchar,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

import { tenantsTable } from './index.js';

export const tenantsWebsitesTable = mysqlTable(
  'tenants_websites',
  {
    id: varchar('id', { length: 36 })
  .primaryKey()
  .default(sql`(UUID())`),

    tenantId: varchar('tenant_id', {
      length: 36,
    }).notNull(),

    /** branding */
    brandName: varchar('brand_name', { length: 255 }).notNull(),
    tagLine: varchar('tag_line', { length: 500 }),

    logoUrl: varchar('logo_url', { length: 1000 }),
    favIconUrl: varchar('fav_icon_url', { length: 1000 }),

    /** theming */
    primaryColor: varchar('primary_color', { length: 7 }), // #FFFFFF
    secondaryColor: varchar('secondary_color', { length: 7 }),

    /** support details */
    supportEmail: varchar('support_email', { length: 255 }),
    supportPhone: varchar('support_phone', { length: 20 }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },

  (table) => ({
    tenantWebsiteTenantFk: foreignKey({
      name: 'tw_tenant_fk',
      columns: [table.tenantId],
      foreignColumns: [tenantsTable.id],
    }),

    uniqTenantWebsite: uniqueIndex('uniq_tenant_website').on(table.tenantId),
  }),
);
