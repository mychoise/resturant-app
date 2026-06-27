import { integer, timestamp, uuid } from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';
import { order } from './order.schema';

export const payment = pgTable('payment', {
  id: uuid('id').primaryKey().defaultRandom(),
  order_group_id: uuid('order_group_id')
    .references(() => order.id)
    .notNull(),
  total_price: integer('total_price').notNull(),
  transaction_id: uuid('transaction_id').notNull(),
  created_at: timestamp('created_at').defaultNow(),
});
