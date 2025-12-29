import { pgTable, serial, text, timestamp, integer, jsonb, varchar } from 'drizzle-orm/pg-core';

// Search analytics table for tracking search queries and results
export const searchAnalytics = pgTable('search_analytics', {
  id: serial('id').primaryKey(),
  query: text('query').notNull(),
  resultsCount: integer('results_count').notNull().default(0),
  filters: jsonb('filters').$type<{
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    tags?: string[];
    inStock?: boolean;
    featured?: boolean;
    sortBy?: string;
  }>(),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }), // IPv6 compatible
  sessionId: varchar('session_id', { length: 255 }),
  userId: varchar('user_id', { length: 255 }),
  clickedProductId: integer('clicked_product_id'), // Track which product was clicked from search results
  searchDuration: integer('search_duration'), // Time taken for search in milliseconds
  createdAt: timestamp('created_at').defaultNow(),
});

// Popular searches view (would be created as a materialized view in production)
export const popularSearches = pgTable('popular_searches', {
  id: serial('id').primaryKey(),
  query: text('query').notNull().unique(),
  searchCount: integer('search_count').notNull().default(1),
  lastSearched: timestamp('last_searched').defaultNow(),
  avgResultsCount: integer('avg_results_count').default(0),
  clickThroughRate: integer('click_through_rate').default(0), // Percentage * 100
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type SearchAnalytic = typeof searchAnalytics.$inferSelect;
export type NewSearchAnalytic = typeof searchAnalytics.$inferInsert;

export type PopularSearch = typeof popularSearches.$inferSelect;
export type NewPopularSearch = typeof popularSearches.$inferInsert;