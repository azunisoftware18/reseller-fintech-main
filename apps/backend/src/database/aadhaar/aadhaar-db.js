import { drizzle } from 'drizzle-orm/mysql2';
import { aadhaarPool } from './mysql.js';
import * as schema from '../../models/aadhaar/index.js';

export const aadhaarDb = drizzle(aadhaarPool, {
  schema,
  mode: 'default',
});
