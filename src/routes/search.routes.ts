import { Router } from 'express';
import * as searchController from '../controllers/search.controller';
import { validate } from '../middlewares/validate';
import { searchProductsSchema, searchSuggestionsSchema, searchFiltersSchema } from '../schemas/search.schema';
import { trackSearchStart, trackSearchComplete } from '../middlewares/searchAnalytics';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Advanced search functionality
 */

/**
 * @swagger
 * /search/products:
 *   get:
 *     summary: Advanced product search with filters and sorting
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Category ID to filter by
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated list of tags
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *         description: Filter for in-stock products only
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filter for featured products only
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [relevance, price_asc, price_desc, name_asc, name_desc, newest, oldest, rating]
 *           default: relevance
 *         description: Sort order
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
 *     responses:
 *       200:
 *         description: Search results with filters and suggestions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         type: object
 *                     filters:
 *                       type: object
 *                       properties:
 *                         categories:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *                               count:
 *                                 type: integer
 *                         priceRanges:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               min:
 *                                 type: number
 *                               max:
 *                                 type: number
 *                               count:
 *                                 type: integer
 *                         tags:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                               count:
 *                                 type: integer
 *                         inStockCount:
 *                           type: integer
 *                         totalCount:
 *                           type: integer
 *                     suggestions:
 *                       type: array
 *                       items:
 *                         type: string
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     query:
 *                       type: string
 *                     sortBy:
 *                       type: string
 */
router.get('/products', 
  trackSearchStart,
  validate(searchProductsSchema), 
  searchController.searchProducts as any,
  trackSearchComplete
);

/**
 * @swagger
 * /search/suggestions:
 *   get:
 *     summary: Get search suggestions for autocomplete
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query for suggestions
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *           maximum: 10
 *         description: Maximum number of suggestions
 *     responses:
 *       200:
 *         description: Search suggestions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     suggestions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           text:
 *                             type: string
 *                           type:
 *                             type: string
 *                             enum: [product, category, brand]
 *                           count:
 *                             type: integer
 *                     query:
 *                       type: string
 */
router.get('/suggestions', validate(searchSuggestionsSchema), searchController.getSearchSuggestions as any);

/**
 * @swagger
 * /search/filters:
 *   get:
 *     summary: Get available search filters
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Category ID to get contextual filters
 *     responses:
 *       200:
 *         description: Search filters retrieved successfully
 */
router.get('/filters', validate(searchFiltersSchema), searchController.getSearchFilters);

/**
 * @swagger
 * /search/popular-terms:
 *   get:
 *     summary: Get popular search terms
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of terms to return
 *     responses:
 *       200:
 *         description: Popular search terms retrieved successfully
 */
router.get('/popular-terms', searchController.getPopularSearchTerms);

/**
 * @swagger
 * /search/trending:
 *   get:
 *     summary: Get trending products
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of products to return
 *     responses:
 *       200:
 *         description: Trending products retrieved successfully
 */
router.get('/trending', searchController.getTrendingProducts);

/**
 * @swagger
 * /search/recently-viewed:
 *   get:
 *     summary: Get recently viewed products
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: ids
 *         schema:
 *           type: string
 *         description: Comma-separated list of product IDs
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Maximum number of products to return
 *     responses:
 *       200:
 *         description: Recently viewed products retrieved successfully
 */
router.get('/recently-viewed', searchController.getRecentlyViewedProducts);

/**
 * @swagger
 * /search/related/{productId}:
 *   get:
 *     summary: Get related products
 *     tags: [Search]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID to find related products for
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Maximum number of related products to return
 *     responses:
 *       200:
 *         description: Related products retrieved successfully
 *       400:
 *         description: Invalid product ID
 */
router.get('/related/:productId', searchController.getRelatedProducts);

export default router;