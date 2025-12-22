-- Search analytics table for tracking search queries and results
CREATE TABLE IF NOT EXISTS "search_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"query" text NOT NULL,
	"results_count" integer DEFAULT 0 NOT NULL,
	"filters" jsonb,
	"user_agent" text,
	"ip_address" varchar(45),
	"session_id" varchar(255),
	"user_id" varchar(255),
	"clicked_product_id" integer,
	"search_duration" integer,
	"created_at" timestamp DEFAULT now()
);

-- Popular searches table
CREATE TABLE IF NOT EXISTS "popular_searches" (
	"id" serial PRIMARY KEY NOT NULL,
	"query" text NOT NULL,
	"search_count" integer DEFAULT 1 NOT NULL,
	"last_searched" timestamp DEFAULT now(),
	"avg_results_count" integer DEFAULT 0,
	"click_through_rate" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "popular_searches_query_unique" UNIQUE("query")
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_search_analytics_query" ON "search_analytics" ("query");
CREATE INDEX IF NOT EXISTS "idx_search_analytics_created_at" ON "search_analytics" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_search_analytics_session_user" ON "search_analytics" ("session_id", "user_id");
CREATE INDEX IF NOT EXISTS "idx_popular_searches_search_count" ON "popular_searches" ("search_count" DESC);
CREATE INDEX IF NOT EXISTS "idx_popular_searches_last_searched" ON "popular_searches" ("last_searched" DESC);