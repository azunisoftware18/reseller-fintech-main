import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config({ path: './.env' });

export default defineConfig({
  schema: './src/models/fund-request/index.js',
  out: './drizzle/fund-request',
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
