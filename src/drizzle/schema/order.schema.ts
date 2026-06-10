import { pgEnum } from 'drizzle-orm/pg-core';
import { boolean } from 'drizzle-orm/pg-core';
import { integer } from 'drizzle-orm/pg-core';
import { uuid, varchar } from 'drizzle-orm/pg-core';
import { pgTable, timestamp } from 'drizzle-orm/pg-core';
import { diningTable } from './diningTable.schema';
import { users } from './user.schema';
import { menu_item } from './menu.schema';

export const statusEnum = pgEnum('statusEnum', [
  'pending',
  'preparing',
  'ready',
  'served',
  'cancelled',
]);

export const payment_method_enum = pgEnum('payment_method_enum', [
  'cash',
  'online',
  'card',
]);

export const order = pgTable('order', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  table_id: uuid('table_id')
    .references(() => diningTable.id)
    .notNull(),
  order_taken_by: uuid('order_taken_by')
    .references(() => users.id)
    .notNull(),
  status: statusEnum('status').notNull().default('pending'),
  total_price: integer('total_price').notNull().default(0),
  is_paid: boolean('is_paid').default(false),
  payment_method: payment_method_enum('payment_method').default('cash'),
  ordered_at: timestamp('ordered_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

export const order_item = pgTable('order-item', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  order_id: uuid('order_id')
    .references(() => order.id)
    .notNull(),
  menu_item_id: uuid('menu_item_id')
    .references(() => menu_item.id)
    .notNull(),
  item_name: varchar('item_name').notNull(),
  status: statusEnum('status').notNull().default('pending'),
  price_snapshot: integer('price_snapshot').notNull(),
  quantity: integer('quantity').notNull(),
  subtotal: integer('subtotal').notNull(),
  created_at: timestamp('created_at').defaultNow(),
});
