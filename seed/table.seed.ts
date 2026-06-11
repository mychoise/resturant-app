import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../src/drizzle/schema/schema';
import { diningTable } from '../src/drizzle/schema/diningTable.schema';
import { NestFactory } from '@nestjs/core';

@Module({
  imports: [ConfigModule.forRoot()],
})
class SeedModule {}

async function seed() {
  const app = await NestFactory.createApplicationContext(SeedModule);
  const configService = app.get(ConfigService);

  const pool = new Pool({
    connectionString: configService.get<string>('DATABASE_URL'),
  });
  const db = drizzle(pool, { schema });

  console.log('🌱 Seeding dining tables...');

  await db
    .insert(diningTable)
    .values([
      { table_number: 1 },
      { table_number: 2 },
      { table_number: 3 },
      { table_number: 4 },
      { table_number: 5 },
      { table_number: 6 },
      { table_number: 7 },
      { table_number: 8 },
      { table_number: 9 },
      { table_number: 10 },
    ]);

  console.log('✅ Dining tables seeded successfully');
  await pool.end();
  await app.close();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
