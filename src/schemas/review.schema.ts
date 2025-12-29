import { z } from 'zod';

// Create review schema
export const createReviewSchema = z.object({
  body: z.object({
    productId: z.number().int().positive('Product ID must be a positive integer'),
    orderId: z.number().int().positive().optional(),
    rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
    title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters').optional(),
    comment: z.string().min(10, 'Comment must be at least 10 characters').max(2000, 'Comment must be less than 2000 characters').optional(),
    isRecommended: z.boolean().default(true),
    mediaUrls: z.array(z.string().url('Invalid media URL')).max(5, 'Maximum 5 media files allowed').optional(),
  }),
});

// Update review schema
export const updateReviewSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1).max(5).optional(),
    title: z.string().min(1).max(255).optional(),
    comment: z.string().min(10).max(2000).optional(),
    isRecommended: z.boolean().optional(),
  }),
});

// Review helpfulness schema
export const reviewHelpfulnessSchema = z.object({
  body: z.object({
    isHelpful: z.boolean(),
  }),
});

// Get reviews schema
export const getReviewsSchema = z.object({
  query: z.object({
    page: z.string().transform(val => parseInt(val) || 1).default(() => 1),
    limit: z.string().transform(val => Math.min(parseInt(val) || 10, 50)).default(() => 10),
    rating: z.string().transform(val => val ? parseInt(val) : undefined).optional(),
    sortBy: z.enum(['newest', 'oldest', 'rating_high', 'rating_low', 'helpful']).default('newest'),
    verifiedOnly: z.string().transform(val => val === 'true').optional(),
    withMedia: z.string().transform(val => val === 'true').optional(),
  }),
});

// Create question schema
export const createQuestionSchema = z.object({
  body: z.object({
    productId: z.number().int().positive('Product ID must be a positive integer'),
    question: z.string().min(10, 'Question must be at least 10 characters').max(500, 'Question must be less than 500 characters'),
  }),
});

// Create answer schema
export const createAnswerSchema = z.object({
  body: z.object({
    answer: z.string().min(5, 'Answer must be at least 5 characters').max(1000, 'Answer must be less than 1000 characters'),
  }),
});

// Get questions schema
export const getQuestionsSchema = z.object({
  query: z.object({
    page: z.string().transform(val => parseInt(val) || 1).default(() => 1),
    limit: z.string().transform(val => Math.min(parseInt(val) || 10, 20)).default(() => 10),
    sortBy: z.enum(['newest', 'oldest', 'most_answers']).default('newest'),
  }),
});

// Moderate review schema
export const moderateReviewSchema = z.object({
  body: z.object({
    isApproved: z.boolean(),
    moderatorNotes: z.string().max(500, 'Moderator notes must be less than 500 characters').optional(),
  }),
});

// Review statistics schema
export const reviewStatsSchema = z.object({
  query: z.object({
    period: z.enum(['7d', '30d', '90d', '1y', 'all']).default('30d'),
  }),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>['body'];
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>['body'];
export type ReviewHelpfulnessInput = z.infer<typeof reviewHelpfulnessSchema>['body'];
export type GetReviewsInput = z.infer<typeof getReviewsSchema>['query'];
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>['body'];
export type CreateAnswerInput = z.infer<typeof createAnswerSchema>['body'];
export type GetQuestionsInput = z.infer<typeof getQuestionsSchema>['query'];
export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>['body'];
export type ReviewStatsInput = z.infer<typeof reviewStatsSchema>['query'];