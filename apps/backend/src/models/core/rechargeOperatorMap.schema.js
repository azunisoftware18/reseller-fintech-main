import { mysqlTable, timestamp, varchar, unique } from 'drizzle-orm/mysql-core';

export const rechargeOperatorMapTable = mysqlTable(
  'recharge_operator_map',
  {
    id: varchar('id', { length: 36 }).primaryKey(),

    serviceProviderMappingId: varchar('service_provider_mapping_id', {
      length: 36,
    }).notNull(),

    internalOperatorCode: varchar('internal_operator_code', {
      length: 20,
    }).notNull(),

    providerOperatorCode: varchar('provider_operator_code', {
      length: 20,
    }).notNull(),

    // 'PLAN_FETCH' (Mplan) ya 'RECHARGE_EXECUTE' (Recharge Exchange)
    direction: varchar('direction', { length: 20 }).notNull(),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    uniq: unique('uq_rom_int_ps_feat_prov_dir').on(
      table.internalOperatorCode,
      table.serviceProviderMappingId,
      table.direction,
    ),
  }),
);
