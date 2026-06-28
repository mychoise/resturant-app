import { integer, timestamp, uuid } from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';
import { order } from './order.schema';
import { pgEnum } from 'drizzle-orm/pg-core';

export const payment_type = pgEnum('payment_type', ['cash', 'online']);

export const payment = pgTable('payment', {
  id: uuid('id').primaryKey().defaultRandom(),
  order_group_id: uuid('order_group_id')
    .references(() => order.id)
    .notNull()
    .unique(),
  total_price: integer('total_price').notNull(),
  payment_type: payment_type('payment_type').notNull(),
  transaction_id: uuid('transaction_id'),
  created_at: timestamp('created_at').defaultNow(),
});
