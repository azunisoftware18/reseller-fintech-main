// db/schema/tables/states.table.ts
import { mysqlTable, varchar, timestamp, index } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const statesTable = mysqlTable(
  'states',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),

    stateName: varchar('state_name', { length: 255 }).notNull(),
    stateCode: varchar('state_code', { length: 10 }).notNull().unique(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    idxStateCode: index('idx_state_code').on(table.stateCode),
  }),
);
