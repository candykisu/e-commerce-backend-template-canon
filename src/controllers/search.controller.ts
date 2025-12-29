import { Request, Response } from 'express';
import * as searchService from '../services/search.service';
import { SearchProductsInput, SearchSuggestionsInput, SearchFiltersInput } from '../schemas/search.schema';
import { asyncHandler } from '../utils/asyncHandler';
import { success as successMessages } from '../constants/messages';
import { sendSuccessResponse } from '../utils/responseHandler';
import { toProductPublicDto } from '../mappers/product.mapper';

/**
 * Advanced product search with filters and sorting
 */
export const searchProducts = asyncHandler(
  async (req: Request<object, object, object, SearchProductsInput>, res: Response): Promise<void> => {
    const searchResult = await searchService.searchProducts(req.query);
    
    // Set results count for analytics middleware
    (req as any).searchResultsCount = searchResult.total;
    
    const productsDto = searchResult.products.map(toProductPublicDto);

    sendSuccessResponse(
      res,
      200,
      successMessages.FETCHED('Search results'),
      {
        products: productsDto,
        filters: searchResult.filters,
        suggestions: searchResult.suggestions,
        meta: {
          query: req.query.q,
          sortBy: req.query.sortBy,
        }
      },
      {
        page: req.query.page,
        limit: req.query.limit,
        total: searchResult.total,
        pages: Math.ceil(searchResult.total / req.query.limit),
      }
    );
  }
);

/**
 * Get search suggestions for autocomplete
 */
export const getSearchSuggestions = asyncHandler(
  async (req: Request<object, object, object, SearchSuggestionsInput>, res: Response): Promise<void> => {
    const suggestions = await searchService.getSearchSuggestions(req.query);

    sendSuccessResponse(res, 200, 'Search suggestions retrieved successfully', {
      suggestions,
      query: req.query.q,
    });
  }
);

/**
 * Get available search filters
 */
export const getSearchFilters = asyncHandler(
  async (req: Request<object, object, object, SearchFiltersInput>, res: Response): Promise<void> => {
    const filters = await searchService.getSearchFilters(req.query);

    sendSuccessResponse(res, 200, 'Search filters retrieved successfully', filters);
  }
);

/**
 * Get popular search terms
 */
export const getPopularSearchTerms = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const limit = parseInt(req.query.limit as string) || 10;
  const popularTerms = await searchService.getPopularSearchTerms(limit);

  sendSuccessResponse(res, 200, 'Popular search terms retrieved successfully', {
    terms: popularTerms,
  });
});

/**
 * Get trending products
 */
export const getTrendingProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const limit = parseInt(req.query.limit as string) || 10;
  const products = await searchService.getTrendingProducts(limit);
  const productsDto = products.map(toProductPublicDto);

  sendSuccessResponse(res, 200, 'Trending products retrieved successfully', productsDto);
});

/**
 * Get recently viewed products
 */
export const getRecentlyViewedProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const productIds = req.query.ids 
    ? (req.query.ids as string).split(',').map(id => parseInt(id)).filter(id => !isNaN(id))
    : [];
  const limit = parseInt(req.query.limit as string) || 5;

  const products = await searchService.getRecentlyViewedProducts(productIds, limit);
  const productsDto = products.map(toProductPublicDto);

  sendSuccessResponse(res, 200, 'Recently viewed products retrieved successfully', productsDto);
});

/**
 * Get related products
 */
export const getRelatedProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { productId } = req.params;
  const limit = parseInt(req.query.limit as string) || 6;

  const id = parseInt(productId);
  if (isNaN(id)) {
    res.status(400).json({ message: 'Invalid product ID' });
    return;
  }

  const products = await searchService.getRelatedProducts(id, limit);
  const productsDto = products.map(toProductPublicDto);

  sendSuccessResponse(res, 200, 'Related products retrieved successfully', productsDto);
});