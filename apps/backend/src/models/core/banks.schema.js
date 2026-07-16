import {
  mysqlTable,
  timestamp,
  varchar,
  int,
  boolean,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const banksTable = mysqlTable('banks', {
  id: varchar('id', { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),

  bankId: int('bank_id').notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  ifscAlias: varchar('ifsc_alias', { length: 50 }).notNull(),
  ifscGlobal: varchar('ifsc_global', { length: 50 }).notNull(),

  // RTGS (missing in original)
  rtgsEnabled: boolean('rtgs_enabled').default(false).notNull(),
  rtgsFailureRate: varchar('rtgs_failure_rate', { length: 10 })
    .default('0')
    .notNull(),

  neftEnabled: boolean('neft_enabled').default(false).notNull(),
  neftFailureRate: varchar('neft_failure_rate', { length: 10 })
    .default('0')
    .notNull(),

  impsEnabled: boolean('imps_enabled').default(false).notNull(),
  impsFailureRate: varchar('imps_failure_rate', { length: 10 })
    .default('0')
    .notNull(),

  upiEnabled: boolean('upi_enabled').default(false).notNull(),
  upiFailureRate: varchar('upi_failure_rate', { length: 10 })
    .default('0')
    .notNull(),

  // Visa Direct (missing in original)
  visaDirectCredit: varchar('visa_direct_credit', { length: 50 })
    .default('INACTIVE')
    .notNull(),
  visaDirectDebit: varchar('visa_direct_debit', { length: 50 })
    .default('INACTIVE')
    .notNull(),

  // Mastercard Send (missing in original)
  mastercardSendCredit: varchar('mastercard_send_credit', { length: 50 })
    .default('INACTIVE')
    .notNull(),
  mastercardSendDebit: varchar('mastercard_send_debit', { length: 50 })
    .default('INACTIVE')
    .notNull(),

  // Credit Card flags (missing in original)
  creditCardUpi: boolean('credit_card_upi').default(false).notNull(),
  creditCardImps: boolean('credit_card_imps').default(false).notNull(),
  creditCardNeft: boolean('credit_card_neft').default(false).notNull(),

  isActive: boolean('is_active').default(true).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});
