CREATE TYPE "public"."payment_method_enum" AS ENUM('cash', 'online', 'card');--> statement-breakpoint
CREATE TYPE "public"."statusEnum" AS ENUM('pending', 'preparing', 'ready', 'served', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."roleEnum" AS ENUM('waiter', 'kitchen', 'admin');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('cash', 'online');--> statement-breakpoint
CREATE TABLE "menu_category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "menu_category_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "menu_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_id" uuid NOT NULL,
	"status" "statusEnum" DEFAULT 'pending' NOT NULL,
	"total_price" integer DEFAULT 0 NOT NULL,
	"is_paid" boolean DEFAULT false,
	"payment_method" "payment_method_enum" DEFAULT 'cash',
	"ordered_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"closed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "order-item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"order_taken_by" uuid NOT NULL,
	"item_name" varchar NOT NULL,
	"status" "statusEnum" DEFAULT 'pending' NOT NULL,
	"price_snapshot" integer NOT NULL,
	"quantity" integer NOT NULL,
	"subtotal" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "diningTable" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_number" integer NOT NULL,
	"is_occupied" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" "roleEnum" NOT NULL,
	"performance_score" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_group_id" uuid NOT NULL,
	"total_price" integer NOT NULL,
	"payment_type" "payment_type" NOT NULL,
	"transaction_id" uuid,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "payment_order_group_id_unique" UNIQUE("order_group_id")
);
--> statement-breakpoint
ALTER TABLE "menu_item" ADD CONSTRAINT "menu_item_category_id_menu_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."menu_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_table_id_diningTable_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."diningTable"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order-item" ADD CONSTRAINT "order-item_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order-item" ADD CONSTRAINT "order-item_menu_item_id_menu_item_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order-item" ADD CONSTRAINT "order-item_order_taken_by_user_id_fk" FOREIGN KEY ("order_taken_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_order_group_id_order_id_fk" FOREIGN KEY ("order_group_id") REFERENCES "public"."order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_menu_category_name" ON "menu_category" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_name" ON "menu_item" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_category_id" ON "menu_item" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_user_email" ON "user" USING btree ("email");