import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

export const corePool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  connectionLimit: 10,
});
