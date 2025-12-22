import { Product } from '../models/ecommerce.schema';
import * as searchRepository from '../repositories/search.repository';
import { SearchProductsInput, SearchSuggestionsInput, SearchFiltersInput } from '../schemas/search.schema';
import { logger } from '../utils';

export interface SearchResult {
  products: Product[];
  total: number;
  filters: SearchFilters;
  suggestions?: string[];
}

export interface SearchFilters {
  categories: Array<{ id: number; name: string; count: number }>;
  priceRanges: Array<{ min: number; max: number; count: number }>;
  tags: Array<{ name: string; count: number }>;
  inStockCount: number;
  totalCount: number;
}

export interface SearchSuggestion {
  text: string;
  type: 'product' | 'category' | 'brand';
  count?: number;
}

/**
 * Advanced product search with filters and sorting
 */
export const searchProducts = async (searchParams: SearchProductsInput): Promise<SearchResult> => {
  try {
    logger.info('Performing advanced product search', { searchParams });

    const { products, total } = await searchRepository.searchProducts(searchParams);
    const filters = await searchRepository.getSearchFilters(searchParams);

    // Get search suggestions if query is provided
    let suggestions: string[] = [];
    if (searchParams.q && searchParams.q.length >= 2) {
      suggestions = await searchRepository.getSearchSuggestions(searchParams.q, 3);
    }

    logger.info('Advanced search completed', { 
      total, 
      productsCount: products.length,
      suggestionsCount: suggestions.length 
    });

    return {
      products,
      total,
      filters,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };
  } catch (error) {
    logger.error('Error in advanced product search:', error);
    throw error;
  }
};

/**
 * Get search suggestions for autocomplete
 */
export const getSearchSuggestions = async (searchParams: SearchSuggestionsInput): Promise<SearchSuggestion[]> => {
  try {
    logger.info('Getting search suggestions', { query: searchParams.q });

    const suggestions = await searchRepository.getDetailedSearchSuggestions(searchParams.q, searchParams.limit);

    logger.info('Search suggestions retrieved', { count: suggestions.length });
    return suggestions;
  } catch (error) {
    logger.error('Error getting search suggestions:', error);
    throw error;
  }
};

/**
 * Get available search filters
 */
export const getSearchFilters = async (searchParams: SearchFiltersInput): Promise<SearchFilters> => {
  try {
    logger.info('Getting search filters', { searchParams });

    const filters = await searchRepository.getSearchFilters(searchParams);

    logger.info('Search filters retrieved');
    return filters;
  } catch (error) {
    logger.error('Error getting search filters:', error);
    throw error;
  }
};

/**
 * Get popular search terms
 */
export const getPopularSearchTerms = async (limit: number = 10): Promise<string[]> => {
  try {
    logger.info('Getting popular search terms', { limit });

    // This would typically come from search analytics/logs
    // For now, return some common terms based on product data
    const popularTerms = await searchRepository.getPopularSearchTerms(limit);

    logger.info('Popular search terms retrieved', { count: popularTerms.length });
    return popularTerms;
  } catch (error) {
    logger.error('Error getting popular search terms:', error);
    throw error;
  }
};

/**
 * Get trending products
 */
export const getTrendingProducts = async (limit: number = 10): Promise<Product[]> => {
  try {
    logger.info('Getting trending products', { limit });

    const products = await searchRepository.getTrendingProducts(limit);

    logger.info('Trending products retrieved', { count: products.length });
    return products;
  } catch (error) {
    logger.error('Error getting trending products:', error);
    throw error;
  }
};

/**
 * Get recently viewed products (would typically use user session/cookies)
 */
export const getRecentlyViewedProducts = async (productIds: number[], limit: number = 5): Promise<Product[]> => {
  try {
    logger.info('Getting recently viewed products', { productIds, limit });

    if (!productIds || productIds.length === 0) {
      return [];
    }

    const products = await searchRepository.getProductsByIds(productIds.slice(0, limit));

    logger.info('Recently viewed products retrieved', { count: products.length });
    return products;
  } catch (error) {
    logger.error('Error getting recently viewed products:', error);
    throw error;
  }
};

/**
 * Get related products based on category and tags
 */
export const getRelatedProducts = async (productId: number, limit: number = 6): Promise<Product[]> => {
  try {
    logger.info('Getting related products', { productId, limit });

    const relatedProducts = await searchRepository.getRelatedProducts(productId, limit);

    logger.info('Related products retrieved', { count: relatedProducts.length });
    return relatedProducts;
  } catch (error) {
    logger.error('Error getting related products:', error);
    throw error;
  }
};