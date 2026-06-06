import { text } from 'drizzle-orm/pg-core';
import { pgTable, uuid, boolean, timestamp, index } from 'drizzle-orm/pg-core';

export const menu_category = pgTable(
  'menu_category',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    name: uuid('name').unique().notNull(),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at').defaultNow(),
  },
  (table) => [index('idx_menu_category_name').on(table.name)],
);

export const menu_item = pgTable(
  'menu_item',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    category_id: uuid('category_id')
      .references(() => menu_category.id)
      .notNull(),
    name: text('name').notNull(),
    description: text('description'),
    price: text('price').notNull(),
    is_available: boolean('is_available').notNull().default(true),
    created_at: timestamp('created_at').defaultNow(),
  },
  (table) => [
    index('idx_name').on(table.name),
    index('idx_category_id').on(table.category_id),
  ],
);
