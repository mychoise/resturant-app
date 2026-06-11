import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../src/drizzle/schema/schema';
import { menu_category, menu_item } from '../src/drizzle/schema/menu.schema';
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

  console.log('🌱 Seeding menu...');

  const categories = await db
    .insert(menu_category)
    .values([
      { name: 'Starters' },
      { name: 'Main Course' },
      { name: 'Beverages' },
      { name: 'Desserts' },
    ])
    .returning();

  const byName = Object.fromEntries(categories.map((c) => [c.name, c.id]));

  await db.insert(menu_item).values([
    // Starters
    {
      category_id: byName['Starters'],
      name: 'Spring Rolls',
      description: 'Crispy veg spring rolls',
      price: 250,
    },
    {
      category_id: byName['Starters'],
      name: 'Chicken Soup',
      description: 'Hot and sour chicken soup',
      price: 300,
    },
    {
      category_id: byName['Starters'],
      name: 'Garlic Bread',
      description: 'Toasted bread with garlic butter',
      price: 180,
    },

    // Main Course
    {
      category_id: byName['Main Course'],
      name: 'Dal Bhat',
      description: 'Traditional Nepali set',
      price: 350,
    },
    {
      category_id: byName['Main Course'],
      name: 'Chicken Curry',
      description: 'Spiced chicken with rice',
      price: 450,
    },
    {
      category_id: byName['Main Course'],
      name: 'Veg Fried Rice',
      description: 'Wok-tossed fried rice',
      price: 320,
    },
    {
      category_id: byName['Main Course'],
      name: 'Momo (Steamed)',
      description: '8 pcs steamed buffalo momo',
      price: 200,
    },

    // Beverages
    {
      category_id: byName['Beverages'],
      name: 'Masala Chiya',
      description: 'Spiced milk tea',
      price: 80,
    },
    {
      category_id: byName['Beverages'],
      name: 'Cold Coffee',
      description: 'Blended iced coffee',
      price: 200,
    },
    {
      category_id: byName['Beverages'],
      name: 'Fresh Lime Soda',
      description: 'Sweet or salted',
      price: 150,
    },

    // Desserts
    {
      category_id: byName['Desserts'],
      name: 'Juju Dhau',
      description: 'Bhaktapur king curd',
      price: 180,
    },
    {
      category_id: byName['Desserts'],
      name: 'Chocolate Brownie',
      description: 'Warm brownie with ice cream',
      price: 280,
    },
  ]);

  console.log('✅ Menu seeded successfully');
  await pool.end();
  await app.close();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
