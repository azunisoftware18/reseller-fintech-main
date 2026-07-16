import {
  mysqlTable,
  varchar,
  timestamp,
  json,
  index,
  boolean,
  foreignKey,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { usersKycTable, usersTable } from './index.js';

export const kycDocumentTable = mysqlTable(
  'kyc_documents',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),

    userKycId: varchar('user_kyc_id', { length: 36 }).notNull(),
    userId: varchar('user_id', { length: 36 }).notNull(),
    tenantId: varchar('tenant_id', { length: 36 }).notNull(),

    documentType: varchar('document_type', { length: 50 }).notNull(),

    // S3 URLs
    documentUrl: varchar('document_url', { length: 500 }).notNull(),
    documentBackUrl: varchar('document_back_url', { length: 500 }),

    // For Aadhaar Front/Back - same number
    documentNumber: varchar('document_number', { length: 255 }),

    verificationStatus: varchar('verification_status', { length: 20 })
      .notNull()
      .default('PENDING'),

    isActive: boolean('is_active').notNull().default(true),

    rawResponse: json('raw_response'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    docUserKycFk: foreignKey({
      name: 'doc_user_kyc_fk',
      columns: [table.userKycId],
      foreignColumns: [usersKycTable.id],
    }),

    docUserFk: foreignKey({
      name: 'doc_user_fk',
      columns: [table.userId],
      foreignColumns: [usersTable.id],
    }),

    idxUserKyc: index('idx_user_kyc').on(table.userKycId),
    idxUser: index('idx_user').on(table.userId),
    idxDocType: index('idx_doc_type').on(table.documentType),
    idxActive: index('idx_active').on(table.isActive),
  }),
);
