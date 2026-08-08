import { seedPermissions } from './permissions.seed.js';
import { seedRoles } from './role.seed.js';
import { createDefaultDomain } from './tenantDoamin.seed.js';
import { seedTenants } from './tenants.seed.js';
import { seedUsers } from './user.seed.js';
import { seedStatesAndCities } from './state-city.seed.js';
import { seedBanks } from './banks.seed.js';

async function run() {
  console.log('🌱 Seeding started...\n');

  try {
    console.log('➡️ Seeding tenants...');
    const tenantId = await seedTenants();
    console.log(`✅ Tenants seeded successfully`);

    console.log('➡️ Seeding roles...');
    await seedRoles(tenantId);
    console.log('✅ Roles seeded successfully\n');

    console.log('➡️ Seeding users...');
    const userId = await seedUsers(tenantId);
    console.log('✅ Users seeded successfully\n');

    console.log('➡️ Seeding tenant domains...');
    await createDefaultDomain(tenantId, userId);
    console.log('✅ Tenant domains seeded successfully\n');

    console.log('➡️ Seeding permissions...');
    await seedPermissions();
    console.log('✅ Permissions seeded successfully\n');

    console.log('➡️ Seeding states and cities...');
    await seedStatesAndCities();
    console.log('✅ States and cities seeded successfully\n');

    console.log('➡️ Seeding banks...');
    await seedBanks();
    console.log('✅ Banks seeded successfully\n');

    console.log('🎉 All seeds completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed');
    console.error(error);
    process.exit(1);
  }
}

run();
