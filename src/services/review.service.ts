import * as reviewRepository from '../repositories/review.repository';
import * as productRepository from '../repositories/product.repository';
import * as orderRepository from '../repositories/order.repository';
import { CreateReviewInput, UpdateReviewInput, GetReviewsInput, CreateQuestionInput, CreateAnswerInput, GetQuestionsInput, ModerateReviewInput } from '../schemas/review.schema';
import { ProductReview, ProductRatingSummary, ReviewQuestion, ReviewAnswer } from '../models/reviews.schema';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/ApiError';
import { error as errorMessages } from '../constants/messages';
import { logger } from '../utils';

/**
 * Create a new product review
 */
export const createReview = async (reviewData: CreateReviewInput, userId: string): Promise<ProductReview> => {
  try {
    // Verify product exists
    const product = await productRepository.findById(reviewData.productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Check if user already reviewed this product
    const existingReviews = await reviewRepository.getProductReviews(
      reviewData.productId,
      { page: 1, limit: 1, rating: undefined, sortBy: 'newest', verifiedOnly: undefined, withMedia: undefined },
      userId
    );

    // For now, allow multiple reviews per user per product
    // In production, you might want to restrict this

    // Verify order if provided
    if (reviewData.orderId) {
      // TODO: Implement order verification
      // const order = await orderRepository.findById(reviewData.orderId);
      // if (!order || order.userId !== userId) {
      //   throw new BadRequestError('Invalid order');
      // }
    }

    const review = await reviewRepository.createReview(reviewData, userId);
    logger.info('Review created successfully', { reviewId: review.id, userId });
    return review;
  } catch (error) {
    logger.error('Error in createReview service:', error);
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
  reviews: any[];
  total: number;
  summary: ProductRatingSummary | null;
}> => {
  try {
    // Verify product exists
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const { reviews, total } = await reviewRepository.getProductReviews(productId, params, currentUserId);
    const summary = await reviewRepository.getProductRatingSummary(productId);

    logger.info('Product reviews retrieved', { productId, total });
    return { reviews, total, summary };
  } catch (error) {
    logger.error('Error in getProductReviews service:', error);
    throw error;
  }
};

/**
 * Get review by ID
 */
export const getReviewById = async (reviewId: number, currentUserId?: string): Promise<any> => {
  try {
    const review = await reviewRepository.getReviewById(reviewId, currentUserId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    logger.info('Review retrieved', { reviewId });
    return review;
  } catch (error) {
    logger.error('Error in getReviewById service:', error);
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
    // Verify review exists
    const review = await reviewRepository.getReviewById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Users cannot vote on their own reviews
    if (review.userId === userId) {
      throw new BadRequestError('Cannot vote on your own review');
    }

    await reviewRepository.updateReviewHelpfulness(reviewId, userId, isHelpful);
    logger.info('Review helpfulness updated', { reviewId, userId, isHelpful });
  } catch (error) {
    logger.error('Error in updateReviewHelpfulness service:', error);
    throw error;
  }
};

/**
 * Get product rating summary
 */
export const getProductRatingSummary = async (productId: number): Promise<ProductRatingSummary | null> => {
  try {
    // Verify product exists
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const summary = await reviewRepository.getProductRatingSummary(productId);
    return summary;
  } catch (error) {
    logger.error('Error in getProductRatingSummary service:', error);
    throw error;
  }
};

/**
 * Create a product question
 */
export const createQuestion = async (questionData: CreateQuestionInput, userId: string): Promise<ReviewQuestion> => {
  try {
    // Verify product exists
    const product = await productRepository.findById(questionData.productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const question = await reviewRepository.createQuestion({
      ...questionData,
      userId,
    });

    logger.info('Question created successfully', { questionId: question.id, userId });
    return question;
  } catch (error) {
    logger.error('Error in createQuestion service:', error);
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
  questions: any[];
  total: number;
}> => {
  try {
    // Verify product exists
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const { questions, total } = await reviewRepository.getProductQuestions(productId, params);

    logger.info('Product questions retrieved', { productId, total });
    return { questions, total };
  } catch (error) {
    logger.error('Error in getProductQuestions service:', error);
    throw error;
  }
};

/**
 * Create an answer to a question
 */
export const createAnswer = async (
  questionId: number,
  answerData: CreateAnswerInput,
  userId: string
): Promise<ReviewAnswer> => {
  try {
    // Verify question exists (this will be implemented in repository)
    // For now, we'll create the answer directly

    const answer = await reviewRepository.createAnswer({
      questionId,
      userId,
      answer: answerData.answer,
    });

    logger.info('Answer created successfully', { answerId: answer.id, userId });
    return answer;
  } catch (error) {
    logger.error('Error in createAnswer service:', error);
    throw error;
  }
};

/**
 * Get answers for a question
 */
export const getQuestionAnswers = async (questionId: number): Promise<any[]> => {
  try {
    const answers = await reviewRepository.getQuestionAnswers(questionId);
    logger.info('Question answers retrieved', { questionId, count: answers.length });
    return answers;
  } catch (error) {
    logger.error('Error in getQuestionAnswers service:', error);
    throw error;
  }
};

/**
 * Get review statistics for admin
 */
export const getReviewStatistics = async (period: string = '30d'): Promise<any> => {
  try {
    // This would typically involve complex analytics queries
    // For now, return basic stats
    const stats = {
      totalReviews: 0,
      averageRating: 0,
      reviewsByRating: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
      verifiedPurchasePercentage: 0,
      recommendationRate: 0,
    };

    logger.info('Review statistics retrieved', { period });
    return stats;
  } catch (error) {
    logger.error('Error in getReviewStatistics service:', error);
    throw error;
  }
};