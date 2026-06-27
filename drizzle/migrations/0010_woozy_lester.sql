ALTER TABLE "payment" DROP CONSTRAINT "payment_id_order_id_fk";
--> statement-breakpoint
ALTER TABLE "payment" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "payment" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "payment" ADD COLUMN "order_group_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_order_group_id_order_id_fk" FOREIGN KEY ("order_group_id") REFERENCES "public"."order"("id") ON DELETE no action ON UPDATE no action;`
