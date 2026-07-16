import { db } from '../core-db.js';
import { statesTable, citiesTable } from '../../../models/core/index.js';

const gstStateCodes = {
  JK: '01',
  HP: '02',
  PB: '03',
  CH: '04',
  UK: '05',
  HR: '06',
  DL: '07',
  RJ: '08',
  UP: '09',
  BR: '10',
  SK: '11',
  AR: '12',
  NL: '13',
  MN: '14',
  MZ: '15',
  TR: '16',
  ML: '17',
  AS: '18',
  WB: '19',
  JH: '20',
  OR: '21',
  CT: '22',
  MP: '23',
  GJ: '24',
  DH: '26',
  MH: '27',
  KA: '29',
  GA: '30',
  LD: '31',
  KL: '32',
  TN: '33',
  PY: '34',
  AN: '35',
  TG: '36',
  AP: '37',
  LA: '38',
};

export async function seedStatesAndCities() {
  console.log('🚀 Starting GST-based state & city seed...');

  const countryCode = 'IN';

  const statesRes = await fetch(
    `https://top100movies-5f84e.web.app/city/states-by-countrycode?countrycode=${countryCode}`,
  );
  const states = await statesRes.json();

  console.log(`📍 Total States Found: ${states.length}`);

  for (const stateData of states) {
    const gstCode = gstStateCodes[stateData.isoCode];

    if (!gstCode) {
      console.log(`⚠️ Skipping ${stateData.name} (No GST mapping)`);
      continue;
    }

    console.log(`\n🌍 Processing State: ${stateData.name} (${gstCode})`);

    // ✅ Insert / Update State
    await db
      .insert(statesTable)
      .values({
        stateName: stateData.name,
        stateCode: gstCode,
      })
      .onDuplicateKeyUpdate({
        set: {
          stateName: stateData.name,
          updatedAt: new Date(),
        },
      });

    // 🔹 Fetch Cities
    const citiesRes = await fetch(
      `https://top100movies-5f84e.web.app/city/cities-by-countrycode-and-statecode?countrycode=${countryCode}&statecode=${stateData.isoCode}`,
    );
    const cities = await citiesRes.json();

    console.log(`   🏙 Cities Found: ${cities.length}`);

    for (const city of cities) {
      const cityCode = `${gstCode}_${city.name}`
        .toUpperCase()
        .replace(/\s+/g, '_');

      await db
        .insert(citiesTable)
        .values({
          cityName: city.name,
          cityCode,
        })
        .onDuplicateKeyUpdate({
          set: {
            cityName: city.name,
            updatedAt: new Date(),
          },
        });
    }

    console.log(`   ✅ Cities inserted for ${stateData.name}`);
  }

  console.log('\n🎉 GST-based seeding completed successfully!');
}
