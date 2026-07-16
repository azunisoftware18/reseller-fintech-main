// db/schema/tables/cities.table.ts
import { mysqlTable, varchar, timestamp, index } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const citiesTable = mysqlTable(
  'cities',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`(UUID())`),

    cityName: varchar('city_name', { length: 255 }).notNull(),
    cityCode: varchar('city_code', { length: 50 }).notNull().unique(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    idxCityCode: index('idx_city_code').on(table.cityCode),
  }),
);
