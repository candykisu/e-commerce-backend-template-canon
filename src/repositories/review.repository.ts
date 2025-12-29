import { eq, and, desc, asc, sql, gte, lte, isNotNull, count, avg, sum } from 'drizzle-orm';
import { db } from '../db';
import { 
  productReviews, 
  reviewHelpfulness, 
  reviewMedia, 
  productRatingSummary,
  reviewQuestions,
  reviewAnswers,
  ProductReview,
  NewProductReview,
  NewReviewHelpfulness,
  NewReviewMedia,
  ProductRatingSummary,
  ReviewQuestion,
  ReviewAnswer,
  NewReviewQuestion,
  NewReviewAnswer
} from '../models/reviews.schema';
import { users, products } from '../models/ecommerce.schema';
import { CreateReviewInput, GetReviewsInput, GetQuestionsInput } from '../schemas/review.schema';
import { logger } from '../utils';

// Type for review with user and media info
type ReviewWithDetails = ProductReview & {
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  media?: Array<{
    id: number;
    mediaType: string;
    mediaUrl: string;
    thumbnailUrl: string | null;
    caption: string | null;
  }>;
  userHelpfulness?: {
    isHelpful: boolean;
  } | null;
};

/**
 * Create a new product review
 */
export const createReview = async (reviewData: CreateReviewInput, userId: string): Promise<ProductReview> => {
  try {
    logger.info('Creating new review', { productId: reviewData.productId, userId });

    const newReview: NewProductReview = {
      productId: reviewData.productId,
      userId,
      orderId: reviewData.orderId,
      rating: reviewData.rating,
      title: reviewData.title,
      comment: reviewData.comment,
      isRecommended: reviewData.isRecommended,
      isVerifiedPurchase: false, // Will be updated based on order verification
    };

    const [savedReview] = await db.insert(productReviews).values(newReview).returning();

    // Add media if provided
    if (reviewData.mediaUrls && reviewData.mediaUrls.length > 0) {
      const mediaData: NewReviewMedia[] = reviewData.mediaUrls.map((url, index) => ({
        reviewId: savedReview.id,
        mediaType: 'image', // Default to image, could be enhanced to detect type
        mediaUrl: url,
        displayOrder: index,
      }));

      await db.insert(reviewMedia).values(mediaData);
    }

    // Update product rating summary
    await updateProductRatingSummary(reviewData.productId);

    logger.info('Review created successfully', { reviewId: savedReview.id });
    return savedReview;
  } catch (error) {
    logger.error('Error creating review:', error);
    throw error;
  }
};

/**
 * Get reviews for a product
 */
export const getProductReviews = async (
  productId: number,
  params: GetReviewsInput,
  currentUserId?: string
): Promise<{
  reviews: ReviewWithDetails[];
  total: number;
}> => {
  try {
    const { page, limit, rating, sortBy, verifiedOnly, withMedia } = params;
    const offset = (page - 1) * limit;
    const conditions = [eq(productReviews.productId, productId), eq(productReviews.isApproved, true)];

    // Apply filters
    if (rating) conditions.push(eq(productReviews.rating, rating));
    if (verifiedOnly) conditions.push(eq(productReviews.isVerifiedPurchase, true));
    if (withMedia) conditions.push(isNotNull(reviewMedia.id));

    // Determine sort order
    let orderBy;
    switch (sortBy) {
      case 'oldest':
        orderBy = asc(productReviews.createdAt);
        break;
      case 'rating_high':
        orderBy = desc(productReviews.rating);
        break;
      case 'rating_low':
        orderBy = asc(productReviews.rating);
        break;
      case 'helpful':
        orderBy = desc(productReviews.helpfulCount);
        break;
      case 'newest':
      default:
        orderBy = desc(productReviews.createdAt);
        break;
    }

    const whereClause = and(...conditions);

    // Get reviews with user info and media
    const reviewsQuery = db
      .select({
        id: productReviews.id,
        productId: productReviews.productId,
        userId: productReviews.userId,
        orderId: productReviews.orderId,
        rating: productReviews.rating,
        title: productReviews.title,
        comment: productReviews.comment,
        isVerifiedPurchase: productReviews.isVerifiedPurchase,
        isRecommended: productReviews.isRecommended,
        helpfulCount: productReviews.helpfulCount,
        unhelpfulCount: productReviews.unhelpfulCount,
        isApproved: productReviews.isApproved,
        moderatorNotes: productReviews.moderatorNotes,
        moderatedBy: productReviews.moderatedBy,
        moderatedAt: productReviews.moderatedAt,
        createdAt: productReviews.createdAt,
        updatedAt: productReviews.updatedAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(productReviews)
      .leftJoin(users, eq(productReviews.userId, users.id))
      .leftJoin(reviewMedia, eq(productReviews.id, reviewMedia.reviewId))
      .where(whereClause)
      .groupBy(
        productReviews.id,
        users.id,
        users.firstName,
        users.lastName
      )
      .limit(limit)
      .offset(offset)
      .orderBy(orderBy);

    const [reviews, totalResult] = await Promise.all([
      reviewsQuery,
      db
        .select({ count: sql<number>`count(DISTINCT ${productReviews.id})` })
        .from(productReviews)
        .leftJoin(reviewMedia, eq(productReviews.id, reviewMedia.reviewId))
        .where(whereClause),
    ]);

    // Get media for each review
    const reviewIds = reviews.map(r => r.id);
    const mediaResults = reviewIds.length > 0 ? await db
      .select()
      .from(reviewMedia)
      .where(sql`${reviewMedia.reviewId} = ANY(${reviewIds})`)
      .orderBy(reviewMedia.displayOrder) : [];

    // Get user helpfulness if user is logged in
    const helpfulnessResults = currentUserId && reviewIds.length > 0 ? await db
      .select({
        reviewId: reviewHelpfulness.reviewId,
        isHelpful: reviewHelpfulness.isHelpful,
      })
      .from(reviewHelpfulness)
      .where(
        and(
          sql`${reviewHelpfulness.reviewId} = ANY(${reviewIds})`,
          eq(reviewHelpfulness.userId, currentUserId)
        )
      ) : [];

    // Group media by review ID
    const mediaByReview = mediaResults.reduce((acc, media) => {
      if (!acc[media.reviewId]) acc[media.reviewId] = [];
      acc[media.reviewId].push(media);
      return acc;
    }, {} as Record<number, typeof mediaResults>);

    // Group helpfulness by review ID
    const helpfulnessByReview = helpfulnessResults.reduce((acc, h) => {
      acc[h.reviewId] = { isHelpful: h.isHelpful };
      return acc;
    }, {} as Record<number, { isHelpful: boolean }>);

    // Combine data
    const reviewsWithDetails: ReviewWithDetails[] = reviews.map(review => ({
      ...review,
      media: mediaByReview[review.id] || [],
      userHelpfulness: helpfulnessByReview[review.id] || null,
    }));

    const total = Number(totalResult[0]?.count || 0);

    logger.info('Product reviews retrieved', { productId, total, returned: reviews.length });
    return { reviews: reviewsWithDetails, total };
  } catch (error) {
    logger.error('Error getting product reviews:', error);
    throw error;
  }
};

/**
 * Get review by ID
 */
export const getReviewById = async (reviewId: number, currentUserId?: string): Promise<ReviewWithDetails | null> => {
  try {
    const [review] = await db
      .select({
        id: productReviews.id,
        productId: productReviews.productId,
        userId: productReviews.userId,
        orderId: productReviews.orderId,
        rating: productReviews.rating,
        title: productReviews.title,
        comment: productReviews.comment,
        isVerifiedPurchase: productReviews.isVerifiedPurchase,
        isRecommended: productReviews.isRecommended,
        helpfulCount: productReviews.helpfulCount,
        unhelpfulCount: productReviews.unhelpfulCount,
        isApproved: productReviews.isApproved,
        moderatorNotes: productReviews.moderatorNotes,
        moderatedBy: productReviews.moderatedBy,
        moderatedAt: productReviews.moderatedAt,
        createdAt: productReviews.createdAt,
        updatedAt: productReviews.updatedAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(productReviews)
      .leftJoin(users, eq(productReviews.userId, users.id))
      .where(eq(productReviews.id, reviewId));

    if (!review) return null;

    // Get media
    const media = await db
      .select()
      .from(reviewMedia)
      .where(eq(reviewMedia.reviewId, reviewId))
      .orderBy(reviewMedia.displayOrder);

    // Get user helpfulness if user is logged in
    let userHelpfulness = null;
    if (currentUserId) {
      const [helpfulness] = await db
        .select({ isHelpful: reviewHelpfulness.isHelpful })
        .from(reviewHelpfulness)
        .where(
          and(
            eq(reviewHelpfulness.reviewId, reviewId),
            eq(reviewHelpfulness.userId, currentUserId)
          )
        );
      userHelpfulness = helpfulness || null;
    }

    return {
      ...review,
      media,
      userHelpfulness,
    };
  } catch (error) {
    logger.error('Error getting review by ID:', error);
    throw error;
  }
};

/**
 * Update review helpfulness
 */
export const updateReviewHelpfulness = async (
  reviewId: number,
  userId: string,
  isHelpful: boolean
): Promise<void> => {
  try {
    // Check if user already voted
    const [existingVote] = await db
      .select()
      .from(reviewHelpfulness)
      .where(
        and(
          eq(reviewHelpfulness.reviewId, reviewId),
          eq(reviewHelpfulness.userId, userId)
        )
      );

    if (existingVote) {
      // Update existing vote
      await db
        .update(reviewHelpfulness)
        .set({ isHelpful })
        .where(
          and(
            eq(reviewHelpfulness.reviewId, reviewId),
            eq(reviewHelpfulness.userId, userId)
          )
        );
    } else {
      // Create new vote
      const newVote: NewReviewHelpfulness = {
        reviewId,
        userId,
        isHelpful,
      };
      await db.insert(reviewHelpfulness).values(newVote);
    }

    // Update review helpfulness counts
    const [helpfulCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reviewHelpfulness)
      .where(
        and(
          eq(reviewHelpfulness.reviewId, reviewId),
          eq(reviewHelpfulness.isHelpful, true)
        )
      );

    const [unhelpfulCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reviewHelpfulness)
      .where(
        and(
          eq(reviewHelpfulness.reviewId, reviewId),
          eq(reviewHelpfulness.isHelpful, false)
        )
      );

    await db
      .update(productReviews)
      .set({
        helpfulCount: Number(helpfulCount?.count || 0),
        unhelpfulCount: Number(unhelpfulCount?.count || 0),
      })
      .where(eq(productReviews.id, reviewId));

    logger.info('Review helpfulness updated', { reviewId, userId, isHelpful });
  } catch (error) {
    logger.error('Error updating review helpfulness:', error);
    throw error;
  }
};

/**
 * Get product rating summary
 */
export const getProductRatingSummary = async (productId: number): Promise<ProductRatingSummary | null> => {
  try {
    const [summary] = await db
      .select()
      .from(productRatingSummary)
      .where(eq(productRatingSummary.productId, productId));

    return summary || null;
  } catch (error) {
    logger.error('Error getting product rating summary:', error);
    throw error;
  }
};

/**
 * Update product rating summary
 */
export const updateProductRatingSummary = async (productId: number): Promise<void> => {
  try {
    // Calculate summary statistics
    const stats = await db
      .select({
        totalReviews: count(productReviews.id),
        averageRating: avg(productReviews.rating),
        rating1Count: sum(sql`CASE WHEN ${productReviews.rating} = 1 THEN 1 ELSE 0 END`),
        rating2Count: sum(sql`CASE WHEN ${productReviews.rating} = 2 THEN 1 ELSE 0 END`),
        rating3Count: sum(sql`CASE WHEN ${productReviews.rating} = 3 THEN 1 ELSE 0 END`),
        rating4Count: sum(sql`CASE WHEN ${productReviews.rating} = 4 THEN 1 ELSE 0 END`),
        rating5Count: sum(sql`CASE WHEN ${productReviews.rating} = 5 THEN 1 ELSE 0 END`),
        verifiedPurchaseCount: sum(sql`CASE WHEN ${productReviews.isVerifiedPurchase} THEN 1 ELSE 0 END`),
        recommendedCount: sum(sql`CASE WHEN ${productReviews.isRecommended} THEN 1 ELSE 0 END`),
        lastReviewAt: sql<Date>`MAX(${productReviews.createdAt})`,
      })
      .from(productReviews)
      .where(
        and(
          eq(productReviews.productId, productId),
          eq(productReviews.isApproved, true)
        )
      );

    const stat = stats[0];
    if (!stat) return;

    const summaryData = {
      productId,
      totalReviews: Number(stat.totalReviews || 0),
      averageRating: stat.averageRating ? Number(stat.averageRating).toFixed(2) : '0.00',
      rating1Count: Number(stat.rating1Count || 0),
      rating2Count: Number(stat.rating2Count || 0),
      rating3Count: Number(stat.rating3Count || 0),
      rating4Count: Number(stat.rating4Count || 0),
      rating5Count: Number(stat.rating5Count || 0),
      verifiedPurchaseCount: Number(stat.verifiedPurchaseCount || 0),
      recommendedCount: Number(stat.recommendedCount || 0),
      lastReviewAt: stat.lastReviewAt,
      updatedAt: new Date(),
    };

    // Upsert summary
    await db
      .insert(productRatingSummary)
      .values(summaryData)
      .onConflictDoUpdate({
        target: productRatingSummary.productId,
        set: summaryData,
      });

    logger.info('Product rating summary updated', { productId });
  } catch (error) {
    logger.error('Error updating product rating summary:', error);
    throw error;
  }
};

/**
 * Create a product question
 */
export const createQuestion = async (questionData: NewReviewQuestion): Promise<ReviewQuestion> => {
  try {
    const [savedQuestion] = await db.insert(reviewQuestions).values(questionData).returning();
    logger.info('Question created successfully', { questionId: savedQuestion.id });
    return savedQuestion;
  } catch (error) {
    logger.error('Error creating question:', error);
    throw error;
  }
};

/**
 * Get questions for a product
 */
export const getProductQuestions = async (
  productId: number,
  params: GetQuestionsInput
): Promise<{
  questions: Array<ReviewQuestion & { user: { firstName: string; lastName: string } }>;
  total: number;
}> => {
  try {
    const { page, limit, sortBy } = params;
    const offset = (page - 1) * limit;

    let orderBy;
    switch (sortBy) {
      case 'oldest':
        orderBy = asc(reviewQuestions.createdAt);
        break;
      case 'most_answers':
        orderBy = desc(reviewQuestions.answerCount);
        break;
      case 'newest':
      default:
        orderBy = desc(reviewQuestions.createdAt);
        break;
    }

    const whereClause = and(
      eq(reviewQuestions.productId, productId),
      eq(reviewQuestions.isApproved, true)
    );

    const [questions, totalResult] = await Promise.all([
      db
        .select({
          id: reviewQuestions.id,
          productId: reviewQuestions.productId,
          userId: reviewQuestions.userId,
          question: reviewQuestions.question,
          isApproved: reviewQuestions.isApproved,
          answerCount: reviewQuestions.answerCount,
          createdAt: reviewQuestions.createdAt,
          updatedAt: reviewQuestions.updatedAt,
          user: {
            firstName: users.firstName,
            lastName: users.lastName,
          },
        })
        .from(reviewQuestions)
        .leftJoin(users, eq(reviewQuestions.userId, users.id))
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(orderBy),
      db
        .select({ count: sql<number>`count(*)` })
        .from(reviewQuestions)
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    logger.info('Product questions retrieved', { productId, total, returned: questions.length });
    
    // Filter out questions without users and map to expected format
    const validQuestions = questions
      .filter(q => q.user && q.user.firstName && q.user.lastName)
      .map(q => ({
        ...q,
        user: {
          firstName: q.user!.firstName!,
          lastName: q.user!.lastName!,
        }
      }));
    
    return { questions: validQuestions, total };
  } catch (error) {
    logger.error('Error getting product questions:', error);
    throw error;
  }
};

/**
 * Create an answer to a question
 */
export const createAnswer = async (answerData: NewReviewAnswer): Promise<ReviewAnswer> => {
  try {
    const [savedAnswer] = await db.insert(reviewAnswers).values(answerData).returning();

    // Update question answer count
    await db
      .update(reviewQuestions)
      .set({
        answerCount: sql`${reviewQuestions.answerCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(reviewQuestions.id, answerData.questionId));

    logger.info('Answer created successfully', { answerId: savedAnswer.id });
    return savedAnswer;
  } catch (error) {
    logger.error('Error creating answer:', error);
    throw error;
  }
};

/**
 * Get answers for a question
 */
export const getQuestionAnswers = async (questionId: number): Promise<Array<ReviewAnswer & { user: { firstName: string; lastName: string } }>> => {
  try {
    const answers = await db
      .select({
        id: reviewAnswers.id,
        questionId: reviewAnswers.questionId,
        userId: reviewAnswers.userId,
        answer: reviewAnswers.answer,
        isVerifiedPurchase: reviewAnswers.isVerifiedPurchase,
        isApproved: reviewAnswers.isApproved,
        helpfulCount: reviewAnswers.helpfulCount,
        createdAt: reviewAnswers.createdAt,
        updatedAt: reviewAnswers.updatedAt,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(reviewAnswers)
      .leftJoin(users, eq(reviewAnswers.userId, users.id))
      .where(
        and(
          eq(reviewAnswers.questionId, questionId),
          eq(reviewAnswers.isApproved, true)
        )
      )
      .orderBy(desc(reviewAnswers.createdAt));

    // Filter out answers without users and map to expected format
    const validAnswers = answers
      .filter(a => a.user && a.user.firstName && a.user.lastName)
      .map(a => ({
        ...a,
        user: {
          firstName: a.user!.firstName!,
          lastName: a.user!.lastName!,
        }
      }));

    return validAnswers;
  } catch (error) {
    logger.error('Error getting question answers:', error);
    throw error;
  }
};