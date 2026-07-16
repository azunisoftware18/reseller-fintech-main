import { drizzle } from 'drizzle-orm/mysql2';
import { pancardPool } from './mysql.js';
import * as schema from '../../models/aadhaar/index.js';

export const pancardDb = drizzle(pancardPool, {
  schema,
  mode: 'default',
});
