import { pgTable, serial, text, boolean, timestamp, integer, decimal, uuid, varchar, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, products } from './ecommerce.schema';

// Product reviews table
export const productReviews = pgTable('product_reviews', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull(),
  userId: uuid('user_id').notNull(),
  orderId: integer('order_id'), // Optional: link to order for verified purchases
  rating: integer('rating').notNull(), // 1-5 stars
  title: varchar('title', { length: 255 }),
  comment: text('comment'),
  isVerifiedPurchase: boolean('is_verified_purchase').default(false),
  isRecommended: boolean('is_recommended').default(true),
  helpfulCount: integer('helpful_count').default(0),
  unhelpfulCount: integer('unhelpful_count').default(0),
  isApproved: boolean('is_approved').default(false), // For moderation
  moderatorNotes: text('moderator_notes'),
  moderatedBy: uuid('moderated_by'),
  moderatedAt: timestamp('moderated_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  productIdIdx: index('idx_product_reviews_product_id').on(table.productId),
  userIdIdx: index('idx_product_reviews_user_id').on(table.userId),
  ratingIdx: index('idx_product_reviews_rating').on(table.rating),
  approvedIdx: index('idx_product_reviews_approved').on(table.isApproved),
  createdAtIdx: index('idx_product_reviews_created_at').on(table.createdAt),
}));

// Review helpfulness tracking
export const reviewHelpfulness = pgTable('review_helpfulness', {
  id: serial('id').primaryKey(),
  reviewId: integer('review_id').notNull(),
  userId: uuid('user_id').notNull(),
  isHelpful: boolean('is_helpful').notNull(), // true = helpful, false = not helpful
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  reviewUserIdx: index('idx_review_helpfulness_review_user').on(table.reviewId, table.userId),
}));

// Review images/media
export const reviewMedia = pgTable('review_media', {
  id: serial('id').primaryKey(),
  reviewId: integer('review_id').notNull(),
  mediaType: varchar('media_type', { length: 20 }).notNull(), // 'image', 'video'
  mediaUrl: text('media_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  caption: text('caption'),
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  reviewIdIdx: index('idx_review_media_review_id').on(table.reviewId),
}));

// Product rating summary (aggregated data for performance)
export const productRatingSummary = pgTable('product_rating_summary', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull().unique(),
  totalReviews: integer('total_reviews').default(0),
  averageRating: decimal('average_rating', { precision: 3, scale: 2 }).default('0'),
  rating1Count: integer('rating_1_count').default(0),
  rating2Count: integer('rating_2_count').default(0),
  rating3Count: integer('rating_3_count').default(0),
  rating4Count: integer('rating_4_count').default(0),
  rating5Count: integer('rating_5_count').default(0),
  verifiedPurchaseCount: integer('verified_purchase_count').default(0),
  recommendedCount: integer('recommended_count').default(0),
  lastReviewAt: timestamp('last_review_at'),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  productIdIdx: index('idx_product_rating_summary_product_id').on(table.productId),
  averageRatingIdx: index('idx_product_rating_summary_avg_rating').on(table.averageRating),
}));

// Review questions and answers
export const reviewQuestions = pgTable('review_questions', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull(),
  userId: uuid('user_id').notNull(),
  question: text('question').notNull(),
  isApproved: boolean('is_approved').default(false),
  answerCount: integer('answer_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  productIdIdx: index('idx_review_questions_product_id').on(table.productId),
  approvedIdx: index('idx_review_questions_approved').on(table.isApproved),
}));

export const reviewAnswers = pgTable('review_answers', {
  id: serial('id').primaryKey(),
  questionId: integer('question_id').notNull(),
  userId: uuid('user_id').notNull(),
  answer: text('answer').notNull(),
  isVerifiedPurchase: boolean('is_verified_purchase').default(false),
  isApproved: boolean('is_approved').default(false),
  helpfulCount: integer('helpful_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  questionIdIdx: index('idx_review_answers_question_id').on(table.questionId),
  approvedIdx: index('idx_review_answers_approved').on(table.isApproved),
}));

// Define relations
export const productReviewsRelations = relations(productReviews, ({ one, many }) => ({
  product: one(products, {
    fields: [productReviews.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [productReviews.userId],
    references: [users.id],
  }),
  moderator: one(users, {
    fields: [productReviews.moderatedBy],
    references: [users.id],
  }),
  helpfulness: many(reviewHelpfulness),
  media: many(reviewMedia),
}));

export const reviewHelpfulnessRelations = relations(reviewHelpfulness, ({ one }) => ({
  review: one(productReviews, {
    fields: [reviewHelpfulness.reviewId],
    references: [productReviews.id],
  }),
  user: one(users, {
    fields: [reviewHelpfulness.userId],
    references: [users.id],
  }),
}));

export const reviewMediaRelations = relations(reviewMedia, ({ one }) => ({
  review: one(productReviews, {
    fields: [reviewMedia.reviewId],
    references: [productReviews.id],
  }),
}));

export const productRatingSummaryRelations = relations(productRatingSummary, ({ one }) => ({
  product: one(products, {
    fields: [productRatingSummary.productId],
    references: [products.id],
  }),
}));

export const reviewQuestionsRelations = relations(reviewQuestions, ({ one, many }) => ({
  product: one(products, {
    fields: [reviewQuestions.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [reviewQuestions.userId],
    references: [users.id],
  }),
  answers: many(reviewAnswers),
}));

export const reviewAnswersRelations = relations(reviewAnswers, ({ one }) => ({
  question: one(reviewQuestions, {
    fields: [reviewAnswers.questionId],
    references: [reviewQuestions.id],
  }),
  user: one(users, {
    fields: [reviewAnswers.userId],
    references: [users.id],
  }),
}));

// Export types
export type ProductReview = typeof productReviews.$inferSelect;
export type NewProductReview = typeof productReviews.$inferInsert;

export type ReviewHelpfulness = typeof reviewHelpfulness.$inferSelect;
export type NewReviewHelpfulness = typeof reviewHelpfulness.$inferInsert;

export type ReviewMedia = typeof reviewMedia.$inferSelect;
export type NewReviewMedia = typeof reviewMedia.$inferInsert;

export type ProductRatingSummary = typeof productRatingSummary.$inferSelect;
export type NewProductRatingSummary = typeof productRatingSummary.$inferInsert;

export type ReviewQuestion = typeof reviewQuestions.$inferSelect;
export type NewReviewQuestion = typeof reviewQuestions.$inferInsert;

export type ReviewAnswer = typeof reviewAnswers.$inferSelect;
export type NewReviewAnswer = typeof reviewAnswers.$inferInsert;