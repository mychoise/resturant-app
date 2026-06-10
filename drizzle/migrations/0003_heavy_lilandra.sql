ALTER TABLE "order" ALTER COLUMN "total_price" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "order" ALTER COLUMN "payment_method" SET DEFAULT 'cash';--> statement-breakpoint
ALTER TABLE "order-item" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "order-item" ADD COLUMN "status" "statusEnum" DEFAULT 'pending' NOT NULL;