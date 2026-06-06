ALTER TABLE "order" ALTER COLUMN "total_price" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "order-item" ALTER COLUMN "price_snapshot" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "order-item" ALTER COLUMN "quantity" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "order-item" ALTER COLUMN "subtotal" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "diningTable" ALTER COLUMN "table_number" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "performance_score" SET DATA TYPE integer;