-- Product reviews table
CREATE TABLE IF NOT EXISTS "product_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"order_id" integer,
	"rating" integer NOT NULL,
	"title" varchar(255),
	"comment" text,
	"is_verified_purchase" boolean DEFAULT false,
	"is_recommended" boolean DEFAULT true,
	"helpful_count" integer DEFAULT 0,
	"unhelpful_count" integer DEFAULT 0,
	"is_approved" boolean DEFAULT false,
	"moderator_notes" text,
	"moderated_by" uuid,
	"moderated_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Review helpfulness tracking
CREATE TABLE IF NOT EXISTS "review_helpfulness" (
	"id" serial PRIMARY KEY NOT NULL,
	"review_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"is_helpful" boolean NOT NULL,
	"created_at" timestamp DEFAULT now()
);

-- Review media (images/videos)
CREATE TABLE IF NOT EXISTS "review_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"review_id" integer NOT NULL,
	"media_type" varchar(20) NOT NULL,
	"media_url" text NOT NULL,
	"thumbnail_url" text,
	"caption" text,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);

-- Product rating summary (aggregated data for performance)
CREATE TABLE IF NOT EXISTS "product_rating_summary" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"total_reviews" integer DEFAULT 0,
	"average_rating" numeric(3,2) DEFAULT 0,
	"rating_1_count" integer DEFAULT 0,
	"rating_2_count" integer DEFAULT 0,
	"rating_3_count" integer DEFAULT 0,
	"rating_4_count" integer DEFAULT 0,
	"rating_5_count" integer DEFAULT 0,
	"verified_purchase_count" integer DEFAULT 0,
	"recommended_count" integer DEFAULT 0,
	"last_review_at" timestamp,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "product_rating_summary_product_id_unique" UNIQUE("product_id")
);

-- Review questions
CREATE TABLE IF NOT EXISTS "review_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"question" text NOT NULL,
	"is_approved" boolean DEFAULT false,
	"answer_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Review answers
CREATE TABLE IF NOT EXISTS "review_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"answer" text NOT NULL,
	"is_verified_purchase" boolean DEFAULT false,
	"is_approved" boolean DEFAULT false,
	"helpful_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_product_reviews_product_id" ON "product_reviews" ("product_id");
CREATE INDEX IF NOT EXISTS "idx_product_reviews_user_id" ON "product_reviews" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_product_reviews_rating" ON "product_reviews" ("rating");
CREATE INDEX IF NOT EXISTS "idx_product_reviews_approved" ON "product_reviews" ("is_approved");
CREATE INDEX IF NOT EXISTS "idx_product_reviews_created_at" ON "product_reviews" ("created_at");

CREATE INDEX IF NOT EXISTS "idx_review_helpfulness_review_user" ON "review_helpfulness" ("review_id", "user_id");

CREATE INDEX IF NOT EXISTS "idx_review_media_review_id" ON "review_media" ("review_id");

CREATE INDEX IF NOT EXISTS "idx_product_rating_summary_product_id" ON "product_rating_summary" ("product_id");
CREATE INDEX IF NOT EXISTS "idx_product_rating_summary_avg_rating" ON "product_rating_summary" ("average_rating");

CREATE INDEX IF NOT EXISTS "idx_review_questions_product_id" ON "review_questions" ("product_id");
CREATE INDEX IF NOT EXISTS "idx_review_questions_approved" ON "review_questions" ("is_approved");

CREATE INDEX IF NOT EXISTS "idx_review_answers_question_id" ON "review_answers" ("question_id");
CREATE INDEX IF NOT EXISTS "idx_review_answers_approved" ON "review_answers" ("is_approved");

-- Add foreign key constraints
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "review_helpfulness" ADD CONSTRAINT "review_helpfulness_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "product_reviews"("id") ON DELETE CASCADE;
ALTER TABLE "review_helpfulness" ADD CONSTRAINT "review_helpfulness_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "review_media" ADD CONSTRAINT "review_media_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "product_reviews"("id") ON DELETE CASCADE;

ALTER TABLE "product_rating_summary" ADD CONSTRAINT "product_rating_summary_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;

ALTER TABLE "review_questions" ADD CONSTRAINT "review_questions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;
ALTER TABLE "review_questions" ADD CONSTRAINT "review_questions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "review_answers" ADD CONSTRAINT "review_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "review_questions"("id") ON DELETE CASCADE;
ALTER TABLE "review_answers" ADD CONSTRAINT "review_answers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- Add unique constraint to prevent duplicate helpfulness votes
ALTER TABLE "review_helpfulness" ADD CONSTRAINT "review_helpfulness_review_user_unique" UNIQUE("review_id", "user_id");