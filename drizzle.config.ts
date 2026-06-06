import type { Config } from 'drizzle-kit';

console.log('DATABASE_URL:', process.env.DATABASE_URL);

export default {
  schema: './src/drizzle/schema/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
