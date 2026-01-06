import { Request, Response } from 'express';
import * as reviewService from '../services/review.service';
import { 
  CreateReviewInput, 
  UpdateReviewInput, 
  GetReviewsInput, 
  ReviewHelpfulnessInput,
  CreateQuestionInput,
  CreateAnswerInput,
  GetQuestionsInput,
  ModerateReviewInput,
  ReviewStatsInput
} from '../schemas/review.schema';
import { 
  toReviewPublicDto, 
  toRatingSummaryDto, 
  toQuestionPublicDto, 
  toAnswerPublicDto 
} from '../mappers/review.mapper';
import { asyncHandler } from '../utils/asyncHandler';
import { success as successMessages } from '../constants/messages';
import { sendSuccessResponse } from '../utils/responseHandler';

/**
 * Create a new product review
 */
export const createReview = asyncHandler(
  async (req: Request<object, object, CreateReviewInput>, res: Response): Promise<void> => {
    // TODO: Get userId from authentication middleware
    const userId = 'temp-user-id'; // This should come from req.user.id after auth is implemented
    
    const review = await reviewService.createReview(req.body, userId);
    sendSuccessResponse(res, 201, successMessages.CREATED('Review'), review);
  }
);

/**
 * Get reviews for a product
 */
export const getProductReviews = asyncHandler(
  async (req: Request<{ productId: string }, object, object, GetReviewsInput>, res: Response): Promise<void> => {
    const productId = parseInt(req.params.productId);
    if (isNaN(productId)) {
      res.status(400).json({ message: 'Invalid product ID' });
      return;
    }

    // TODO: Get userId from authentication middleware if user is logged in
    const currentUserId = undefined; // req.user?.id

    const result = await reviewService.getProductReviews(productId, req.query, currentUserId);
    
    // Map reviews and summary to DTOs
    const reviewsDto = result.reviews.map(toReviewPublicDto);
    const summaryDto = toRatingSummaryDto(result.summary);
    
    sendSuccessResponse(
      res,
      200,
      successMessages.FETCHED('Product reviews'),
      {
        reviews: reviewsDto,
        summary: summaryDto,
        total: result.total,
      },
      {
        page: req.query.page,
        limit: req.query.limit,
        total: result.total,
        pages: Math.ceil(result.total / req.query.limit),
      }
    );
  }
);

/**
 * Get review by ID
 */
export const getReviewById = asyncHandler(
  async (req: Request<{ reviewId: string }>, res: Response): Promise<void> => {
    const reviewId = parseInt(req.params.reviewId);
    if (isNaN(reviewId)) {
      res.status(400).json({ message: 'Invalid review ID' });
      return;
    }

    // TODO: Get userId from authentication middleware if user is logged in
    const currentUserId = undefined; // req.user?.id

    const review = await reviewService.getReviewById(reviewId, currentUserId);
    const reviewDto = toReviewPublicDto(review);
    
    sendSuccessResponse(res, 200, successMessages.FETCHED('Review'), reviewDto);
  }
);

/**
 * Update review helpfulness
 */
export const updateReviewHelpfulness = asyncHandler(
  async (req: Request<{ reviewId: string }, object, ReviewHelpfulnessInput>, res: Response): Promise<void> => {
    const reviewId = parseInt(req.params.reviewId);
    if (isNaN(reviewId)) {
      res.status(400).json({ message: 'Invalid review ID' });
      return;
    }

    // TODO: Get userId from authentication middleware
    const userId = 'temp-user-id'; // This should come from req.user.id after auth is implemented

    await reviewService.updateReviewHelpfulness(reviewId, userId, req.body.isHelpful);
    sendSuccessResponse(res, 200, 'Review helpfulness updated successfully');
  }
);

/**
 * Get product rating summary
 */
export const getProductRatingSummary = asyncHandler(
  async (req: Request<{ productId: string }>, res: Response): Promise<void> => {
    const productId = parseInt(req.params.productId);
    if (isNaN(productId)) {
      res.status(400).json({ message: 'Invalid product ID' });
      return;
    }

    const summary = await reviewService.getProductRatingSummary(productId);
    const summaryDto = toRatingSummaryDto(summary);
    
    sendSuccessResponse(res, 200, successMessages.FETCHED('Product rating summary'), summaryDto);
  }
);

/**
 * Create a product question
 */
export const createQuestion = asyncHandler(
  async (req: Request<object, object, CreateQuestionInput>, res: Response): Promise<void> => {
    // TODO: Get userId from authentication middleware
    const userId = 'temp-user-id'; // This should come from req.user.id after auth is implemented
    
    const question = await reviewService.createQuestion(req.body, userId);
    sendSuccessResponse(res, 201, successMessages.CREATED('Question'), question);
  }
);

/**
 * Get questions for a product
 */
export const getProductQuestions = asyncHandler(
  async (req: Request<{ productId: string }, object, object, GetQuestionsInput>, res: Response): Promise<void> => {
    const productId = parseInt(req.params.productId);
    if (isNaN(productId)) {
      res.status(400).json({ message: 'Invalid product ID' });
      return;
    }

    const result = await reviewService.getProductQuestions(productId, req.query);
    const questionsDto = result.questions.map(toQuestionPublicDto);
    
    sendSuccessResponse(
      res,
      200,
      successMessages.FETCHED('Product questions'),
      {
        questions: questionsDto,
        total: result.total,
      },
      {
        page: req.query.page,
        limit: req.query.limit,
        total: result.total,
        pages: Math.ceil(result.total / req.query.limit),
      }
    );
  }
);

/**
 * Create an answer to a question
 */
export const createAnswer = asyncHandler(
  async (req: Request<{ questionId: string }, object, CreateAnswerInput>, res: Response): Promise<void> => {
    const questionId = parseInt(req.params.questionId);
    if (isNaN(questionId)) {
      res.status(400).json({ message: 'Invalid question ID' });
      return;
    }

    // TODO: Get userId from authentication middleware
    const userId = 'temp-user-id'; // This should come from req.user.id after auth is implemented
    
    const answer = await reviewService.createAnswer(questionId, req.body, userId);
    sendSuccessResponse(res, 201, successMessages.CREATED('Answer'), answer);
  }
);

/**
 * Get answers for a question
 */
export const getQuestionAnswers = asyncHandler(
  async (req: Request<{ questionId: string }>, res: Response): Promise<void> => {
    const questionId = parseInt(req.params.questionId);
    if (isNaN(questionId)) {
      res.status(400).json({ message: 'Invalid question ID' });
      return;
    }

    const answers = await reviewService.getQuestionAnswers(questionId);
    const answersDto = answers.map(toAnswerPublicDto);
    
    sendSuccessResponse(res, 200, successMessages.FETCHED('Question answers'), answersDto);
  }
);

/**
 * Get review statistics (admin)
 */
export const getReviewStatistics = asyncHandler(
  async (req: Request<object, object, object, ReviewStatsInput>, res: Response): Promise<void> => {
    const stats = await reviewService.getReviewStatistics(req.query.period);
    sendSuccessResponse(res, 200, successMessages.FETCHED('Review statistics'), stats);
  }
);