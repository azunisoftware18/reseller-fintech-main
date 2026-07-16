import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config({ path: './.env' });

export default defineConfig({
  schema: './src/models/pancard/index.js',
  out: './drizzle/pancard',
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
