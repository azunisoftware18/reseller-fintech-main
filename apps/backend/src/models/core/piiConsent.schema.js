import {
  mysqlTable,
  varchar,
  timestamp,
  foreignKey,
  boolean,
  uniqueIndex,
  index,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

import { tenantsTable, usersTable } from './index.js';

export const piiConsentTable = mysqlTable(
  'pii_consent',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),

    userId: varchar('user_id', { length: 36 }).notNull(),
    tenantId: varchar('tenant_id', { length: 36 }).notNull(),

    purpose: varchar('purpose', { length: 255 }).notNull(),

    consentGiven: boolean('consent_given').notNull(),

    consentSource: varchar('consent_source', { length: 10 }).notNull(), // WEB | MOBILE

    consentVersion: varchar('consent_version', { length: 50 }).notNull(),

    consentAt: timestamp('consent_at').notNull(),
    expireAt: timestamp('expire_at'),

    consentRevokedAt: timestamp('consent_revoked_at'),
    consentRevokedReason: varchar('consent_revoked_reason', { length: 500 }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },

  (table) => ({
    piiConsentUserFk: foreignKey({
      name: 'pii_consent_user_fk',
      columns: [table.userId],
      foreignColumns: [usersTable.id],
    }),

    piiConsentTenantFk: foreignKey({
      name: 'pii_consent_tenant_fk',
      columns: [table.tenantId],
      foreignColumns: [tenantsTable.id],
    }),

    uniqPiiConsent: uniqueIndex('uniq_pii_consent').on(
      table.userId,
      table.tenantId,
      table.purpose,
      table.consentVersion,
    ),

    idxPiiConsentUser: index('idx_pii_consent_user').on(table.userId),

    idxPiiConsentTenant: index('idx_pii_consent_tenant').on(table.tenantId),
  }),
);
