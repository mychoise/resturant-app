CREATE TABLE "payment" (
	"id" uuid NOT NULL,
	"total_price" integer NOT NULL,
	"transaction_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_id_order_id_fk" FOREIGN KEY ("id") REFERENCES "public"."order"("id") ON DELETE no action ON UPDATE no action;