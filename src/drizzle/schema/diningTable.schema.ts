import {
  boolean,
  integer,
  pgTable,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const diningTable = pgTable('diningTable', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  table_number: integer('table_number').notNull(),
  is_occupied: boolean('is_occupied').notNull().default(false),
  updated_at: timestamp('updated_at').defaultNow(),
});
