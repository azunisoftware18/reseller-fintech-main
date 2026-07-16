import { drizzle } from 'drizzle-orm/mysql2';
import { fundRequestPool } from './mysql.js';
import * as schema from '../../models/fund-request/index.js';

export const fundRequestDb = drizzle(fundRequestPool, {
  schema,
  mode: 'default',
});
