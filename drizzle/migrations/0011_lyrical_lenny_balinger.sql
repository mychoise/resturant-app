CREATE TYPE "public"."payment_type" AS ENUM('cash', 'online');--> statement-breakpoint
ALTER TABLE "payment" ALTER COLUMN "transaction_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payment" ADD COLUMN "payment_type" "payment_type" NOT NULL;