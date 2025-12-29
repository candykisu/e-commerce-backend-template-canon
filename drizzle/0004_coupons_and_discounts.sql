-- Coupons table
CREATE TABLE IF NOT EXISTS "coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(20) NOT NULL,
	"value" numeric(10,2) NOT NULL,
	"minimum_order_amount" numeric(10,2),
	"maximum_discount_amount" numeric(10,2),
	"usage_limit" integer,
	"usage_count" integer DEFAULT 0,
	"user_usage_limit" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"is_public" boolean DEFAULT true,
	"stackable" boolean DEFAULT false,
	"first_time_customer_only" boolean DEFAULT false,
	"valid_from" timestamp NOT NULL,
	"valid_until" timestamp NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);

-- Coupon usage tracking
CREATE TABLE IF NOT EXISTS "coupon_usages" (
	"id" serial PRIMARY KEY NOT NULL,
	"coupon_id" integer NOT NULL,
	"user_id" uuid,
	"order_id" integer,
	"discount_amount" numeric(10,2) NOT NULL,
	"original_amount" numeric(10,2) NOT NULL,
	"used_at" timestamp DEFAULT now()
);

-- Coupon conditions
CREATE TABLE IF NOT EXISTS "coupon_conditions" (
	"id" serial PRIMARY KEY NOT NULL,
	"coupon_id" integer NOT NULL,
	"condition_type" varchar(20) NOT NULL,
	"condition_value" text NOT NULL,
	"is_inclusive" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);

-- Buy X Get Y promotions
CREATE TABLE IF NOT EXISTS "buy_x_get_y_promotions" (
	"id" serial PRIMARY KEY NOT NULL,
	"coupon_id" integer NOT NULL,
	"buy_quantity" integer NOT NULL,
	"get_quantity" integer NOT NULL,
	"buy_product_ids" integer[],
	"get_product_ids" integer[],
	"buy_category_ids" integer[],
	"get_category_ids" integer[],
	"get_discount_type" varchar(20) DEFAULT 'free' NOT NULL,
	"get_discount_value" numeric(10,2) DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);

-- User-specific coupon assignments
CREATE TABLE IF NOT EXISTS "user_coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"coupon_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"assigned_by" uuid NOT NULL,
	"assigned_at" timestamp DEFAULT now(),
	"used_at" timestamp,
	"is_used" boolean DEFAULT false
);

-- Automatic discount rules
CREATE TABLE IF NOT EXISTS "automatic_discounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(20) NOT NULL,
	"value" numeric(10,2) NOT NULL,
	"minimum_order_amount" numeric(10,2),
	"maximum_discount_amount" numeric(10,2),
	"priority" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"stackable" boolean DEFAULT false,
	"valid_from" timestamp NOT NULL,
	"valid_until" timestamp NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Automatic discount conditions
CREATE TABLE IF NOT EXISTS "automatic_discount_conditions" (
	"id" serial PRIMARY KEY NOT NULL,
	"discount_id" integer NOT NULL,
	"condition_type" varchar(20) NOT NULL,
	"condition_value" text NOT NULL,
	"is_inclusive" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_coupons_code" ON "coupons" ("code");
CREATE INDEX IF NOT EXISTS "idx_coupons_type" ON "coupons" ("type");
CREATE INDEX IF NOT EXISTS "idx_coupons_active" ON "coupons" ("is_active");
CREATE INDEX IF NOT EXISTS "idx_coupons_validity" ON "coupons" ("valid_from", "valid_until");

CREATE INDEX IF NOT EXISTS "idx_coupon_usages_coupon_id" ON "coupon_usages" ("coupon_id");
CREATE INDEX IF NOT EXISTS "idx_coupon_usages_user_id" ON "coupon_usages" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_coupon_usages_order_id" ON "coupon_usages" ("order_id");

CREATE INDEX IF NOT EXISTS "idx_coupon_conditions_coupon_id" ON "coupon_conditions" ("coupon_id");
CREATE INDEX IF NOT EXISTS "idx_coupon_conditions_type" ON "coupon_conditions" ("condition_type");

CREATE INDEX IF NOT EXISTS "idx_buy_x_get_y_coupon_id" ON "buy_x_get_y_promotions" ("coupon_id");

CREATE INDEX IF NOT EXISTS "idx_user_coupons_coupon_user" ON "user_coupons" ("coupon_id", "user_id");
CREATE INDEX IF NOT EXISTS "idx_user_coupons_user_id" ON "user_coupons" ("user_id");

CREATE INDEX IF NOT EXISTS "idx_automatic_discounts_active" ON "automatic_discounts" ("is_active");
CREATE INDEX IF NOT EXISTS "idx_automatic_discounts_priority" ON "automatic_discounts" ("priority");
CREATE INDEX IF NOT EXISTS "idx_automatic_discounts_validity" ON "automatic_discounts" ("valid_from", "valid_until");

CREATE INDEX IF NOT EXISTS "idx_auto_discount_conditions_discount_id" ON "automatic_discount_conditions" ("discount_id");

-- Add foreign key constraints
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE CASCADE;
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL;

ALTER TABLE "coupon_conditions" ADD CONSTRAINT "coupon_conditions_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE CASCADE;

ALTER TABLE "buy_x_get_y_promotions" ADD CONSTRAINT "buy_x_get_y_promotions_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE CASCADE;

ALTER TABLE "user_coupons" ADD CONSTRAINT "user_coupons_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE CASCADE;
ALTER TABLE "user_coupons" ADD CONSTRAINT "user_coupons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "user_coupons" ADD CONSTRAINT "user_coupons_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "automatic_discounts" ADD CONSTRAINT "automatic_discounts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "automatic_discount_conditions" ADD CONSTRAINT "automatic_discount_conditions_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "automatic_discounts"("id") ON DELETE CASCADE;

-- Add check constraints
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_type_check" CHECK ("type" IN ('percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y'));
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_value_check" CHECK ("value" >= 0);
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_percentage_check" CHECK (("type" != 'percentage') OR ("value" <= 100));
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_date_check" CHECK ("valid_from" < "valid_until");

ALTER TABLE "automatic_discounts" ADD CONSTRAINT "automatic_discounts_type_check" CHECK ("type" IN ('percentage', 'fixed_amount', 'free_shipping'));
ALTER TABLE "automatic_discounts" ADD CONSTRAINT "automatic_discounts_value_check" CHECK ("value" >= 0);
ALTER TABLE "automatic_discounts" ADD CONSTRAINT "automatic_discounts_date_check" CHECK ("valid_from" < "valid_until");

-- Add unique constraint to prevent duplicate user coupon assignments
ALTER TABLE "user_coupons" ADD CONSTRAINT "user_coupons_coupon_user_unique" UNIQUE("coupon_id", "user_id");