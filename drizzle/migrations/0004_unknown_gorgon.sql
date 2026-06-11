ALTER TABLE "order" DROP CONSTRAINT "order_order_taken_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "menu_item" ALTER COLUMN "price" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "order-item" ADD COLUMN "order_taken_by" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "order-item" ADD CONSTRAINT "order-item_order_taken_by_user_id_fk" FOREIGN KEY ("order_taken_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" DROP COLUMN "order_taken_by";