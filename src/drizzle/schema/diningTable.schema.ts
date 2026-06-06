import {
  boolean,
  numeric,
  pgTable,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const diningTable = pgTable('diningTable', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  table_number: numeric('table_number', { precision: 10, scale: 2 }).notNull(),
  is_occupied: boolean('is_occupied').notNull().default(false),
  updated_at: timestamp('updated_at').defaultNow(),
});
