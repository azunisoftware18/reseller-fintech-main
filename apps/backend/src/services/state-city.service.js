import { db } from '../database/core/core-db.js';
import { statesTable, citiesTable } from '../models/core/index.js';
import { and, eq, sql, like, or } from 'drizzle-orm';
import { ApiError } from '../lib/ApiError.js';

class StateCityService {
  // ==================== STATE SERVICES ====================

  static async getAllStates(query = {}) {
    const search = query.search;

    let whereConditions = [];

    if (search) {
      whereConditions.push(
        or(
          like(statesTable.stateName, `%${search}%`),
          like(statesTable.stateCode, `%${search}%`),
        ),
      );
    }

    const states = await db
      .select()
      .from(statesTable)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(statesTable.stateName);

    return {
      data: states,
    };
  }

  // ==================== CITY SERVICES ====================

  static async getCitiesByState(stateCode, query = {}) {
    if (!stateCode) throw ApiError.badRequest('State code is required');

    // Verify state exists
    const [state] = await db
      .select({
        id: statesTable.id,
        stateName: statesTable.stateName,
        stateCode: statesTable.stateCode,
      })
      .from(statesTable)
      .where(eq(statesTable.stateCode, stateCode))
      .limit(1);

    if (!state) {
      throw ApiError.notFound(`State with code ${stateCode} not found`);
    }

    const search = query.search;

    let whereConditions = [];

    // Filter cities by state code prefix
    whereConditions.push(sql`${citiesTable.cityCode} LIKE ${`${stateCode}_%`}`);

    if (search) {
      whereConditions.push(like(citiesTable.cityName, `%${search}%`));
    }

    const cities = await db
      .select({
        id: citiesTable.id,
        cityName: citiesTable.cityName,
        cityCode: citiesTable.cityCode,
        createdAt: citiesTable.createdAt,
        updatedAt: citiesTable.updatedAt,
      })
      .from(citiesTable)
      .where(and(...whereConditions))
      .orderBy(citiesTable.cityName);

    return {
      state: {
        code: state.stateCode,
        name: state.stateName,
      },
      data: cities,
    };
  }
}

export default StateCityService;
