import { Router } from 'express';
import * as reviewController from '../controllers/review.controller';
import { validate } from '../middlewares/validate';
import { 
  createReviewSchema, 
  updateReviewSchema, 
  reviewHelpfulnessSchema,
  getReviewsSchema,
  createQuestionSchema,
  createAnswerSchema,
  getQuestionsSchema,
  moderateReviewSchema,
  reviewStatsSchema
} from '../schemas/review.schema';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Product reviews and ratings management
 */

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Create a new product review
 *     tags: [Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - rating
 *             properties:
 *               productId:
 *                 type: integer
 *                 description: ID of the product being reviewed
 *               orderId:
 *                 type: integer
 *                 description: ID of the order (for verified purchases)
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5 stars
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 description: Review title
 *               comment:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *                 description: Review comment
 *               isRecommended:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the user recommends the product
 *               mediaUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: url
 *                 maxItems: 5
 *                 description: URLs of review images/videos
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Product not found
 */
router.post('/', validate(createReviewSchema), reviewController.createReview);

/**
 * @swagger
 * /reviews/products/{productId}:
 *   get:
 *     summary: Get reviews for a product
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *         description: Items per page
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Filter by rating
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [newest, oldest, rating_high, rating_low, helpful]
 *           default: newest
 *         description: Sort order
 *       - in: query
 *         name: verifiedOnly
 *         schema:
 *           type: boolean
 *         description: Show only verified purchase reviews
 *       - in: query
 *         name: withMedia
 *         schema:
 *           type: boolean
 *         description: Show only reviews with media
 *     responses:
 *       200:
 *         description: Product reviews retrieved successfully
 *       404:
 *         description: Product not found
 */
router.get('/products/:productId', validate(getReviewsSchema), reviewController.getProductReviews as any);

/**
 * @swagger
 * /reviews/{reviewId}:
 *   get:
 *     summary: Get review by ID
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review retrieved successfully
 *       404:
 *         description: Review not found
 */
router.get('/:reviewId', reviewController.getReviewById);

/**
 * @swagger
 * /reviews/{reviewId}/helpful:
 *   post:
 *     summary: Mark review as helpful or not helpful
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isHelpful
 *             properties:
 *               isHelpful:
 *                 type: boolean
 *                 description: Whether the review is helpful
 *     responses:
 *       200:
 *         description: Review helpfulness updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Review not found
 */
router.post('/:reviewId/helpful', validate(reviewHelpfulnessSchema), reviewController.updateReviewHelpfulness);

/**
 * @swagger
 * /reviews/products/{productId}/summary:
 *   get:
 *     summary: Get product rating summary
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product rating summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalReviews:
 *                       type: integer
 *                     averageRating:
 *                       type: number
 *                       format: float
 *                     rating1Count:
 *                       type: integer
 *                     rating2Count:
 *                       type: integer
 *                     rating3Count:
 *                       type: integer
 *                     rating4Count:
 *                       type: integer
 *                     rating5Count:
 *                       type: integer
 *                     verifiedPurchaseCount:
 *                       type: integer
 *                     recommendedCount:
 *                       type: integer
 *       404:
 *         description: Product not found
 */
router.get('/products/:productId/summary', reviewController.getProductRatingSummary);

/**
 * @swagger
 * /reviews/questions:
 *   post:
 *     summary: Create a product question
 *     tags: [Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - question
 *             properties:
 *               productId:
 *                 type: integer
 *                 description: ID of the product
 *               question:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *                 description: The question text
 *     responses:
 *       201:
 *         description: Question created successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Product not found
 */
router.post('/questions', validate(createQuestionSchema), reviewController.createQuestion);

/**
 * @swagger
 * /reviews/products/{productId}/questions:
 *   get:
 *     summary: Get questions for a product
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 20
 *         description: Items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [newest, oldest, most_answers]
 *           default: newest
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Product questions retrieved successfully
 *       404:
 *         description: Product not found
 */
router.get('/products/:productId/questions', validate(getQuestionsSchema), reviewController.getProductQuestions as any);

/**
 * @swagger
 * /reviews/questions/{questionId}/answers:
 *   post:
 *     summary: Create an answer to a question
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Question ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - answer
 *             properties:
 *               answer:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 1000
 *                 description: The answer text
 *     responses:
 *       201:
 *         description: Answer created successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Question not found
 */
router.post('/questions/:questionId/answers', validate(createAnswerSchema), reviewController.createAnswer);

/**
 * @swagger
 * /reviews/questions/{questionId}/answers:
 *   get:
 *     summary: Get answers for a question
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Question ID
 *     responses:
 *       200:
 *         description: Question answers retrieved successfully
 *       404:
 *         description: Question not found
 */
router.get('/questions/:questionId/answers', reviewController.getQuestionAnswers);

/**
 * @swagger
 * /reviews/statistics:
 *   get:
 *     summary: Get review statistics (admin)
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y, all]
 *           default: 30d
 *         description: Time period for statistics
 *     responses:
 *       200:
 *         description: Review statistics retrieved successfully
 */
router.get('/statistics', validate(reviewStatsSchema), reviewController.getReviewStatistics);

export default router;