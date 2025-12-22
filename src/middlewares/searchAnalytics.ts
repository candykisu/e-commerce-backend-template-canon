import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { searchAnalytics, popularSearches } from '../models/searchAnalytics.schema';
import { eq, sql } from 'drizzle-orm';
import { logger } from '../utils';

interface SearchRequest extends Request {
  searchStartTime?: number;
  searchQuery?: string;
  searchFilters?: any;
  searchResultsCount?: number;
}

/**
 * Middleware to track search analytics
 */
export const trackSearchStart = (req: SearchRequest, res: Response, next: NextFunction): void => {
  req.searchStartTime = Date.now();
  req.searchQuery = req.query.q as string;
  req.searchFilters = {
    category: req.query.category,
    minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
    maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
    tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
    inStock: req.query.inStock === 'true',
    featured: req.query.featured === 'true',
    sortBy: req.query.sortBy,
  };
  next();
};

/**
 * Middleware to log search completion
 */
export const trackSearchComplete = async (req: SearchRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Only track if we have a search query
    if (!req.searchQuery || req.searchQuery.trim() === '') {
      return next();
    }

    const searchDuration = req.searchStartTime ? Date.now() - req.searchStartTime : 0;
    const resultsCount = req.searchResultsCount || 0;

    // Extract user info
    const userAgent = req.get('User-Agent') || '';
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    const sessionId = req.sessionID || '';
    const userId = (req as any).user?.id || null; // Assuming auth middleware sets req.user

    // Log search analytics
    await db.insert(searchAnalytics).values({
      query: req.searchQuery.trim().toLowerCase(),
      resultsCount,
      filters: req.searchFilters,
      userAgent,
      ipAddress,
      sessionId,
      userId,
      searchDuration,
    });

    // Update popular searches
    await updatePopularSearches(req.searchQuery.trim().toLowerCase(), resultsCount);

    logger.info('Search analytics tracked', {
      query: req.searchQuery,
      resultsCount,
      searchDuration,
    });
  } catch (error) {
    logger.error('Error tracking search analytics:', error);
    // Don't fail the request if analytics tracking fails
  }

  next();
};

/**
 * Update popular searches table
 */
async function updatePopularSearches(query: string, resultsCount: number): Promise<void> {
  try {
    // Try to update existing record
    const [existingRecord] = await db
      .select()
      .from(popularSearches)
      .where(eq(popularSearches.query, query))
      .limit(1);

    if (existingRecord) {
      // Update existing record
      const newSearchCount = existingRecord.searchCount + 1;
      const newAvgResults = Math.round(
        (existingRecord.avgResultsCount * existingRecord.searchCount + resultsCount) / newSearchCount
      );

      await db
        .update(popularSearches)
        .set({
          searchCount: newSearchCount,
          avgResultsCount: newAvgResults,
          lastSearched: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(popularSearches.query, query));
    } else {
      // Insert new record
      await db.insert(popularSearches).values({
        query,
        searchCount: 1,
        avgResultsCount: resultsCount,
        lastSearched: new Date(),
      });
    }
  } catch (error) {
    logger.error('Error updating popular searches:', error);
  }
}

/**
 * Track product click from search results
 */
export const trackSearchClick = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId, searchQuery } = req.body;

    if (productId && searchQuery) {
      // Find the most recent search analytics record for this session/user
      const sessionId = req.sessionID || '';
      const userId = (req as any).user?.id || null;

      await db
        .update(searchAnalytics)
        .set({
          clickedProductId: parseInt(productId),
        })
        .where(
          sql`
            ${searchAnalytics.query} = ${searchQuery.toLowerCase()} 
            AND (${searchAnalytics.sessionId} = ${sessionId} OR ${searchAnalytics.userId} = ${userId})
            AND ${searchAnalytics.clickedProductId} IS NULL
            AND ${searchAnalytics.createdAt} > NOW() - INTERVAL '1 hour'
          `
        );

      logger.info('Search click tracked', { productId, searchQuery });
    }
  } catch (error) {
    logger.error('Error tracking search click:', error);
  }

  next();
};

/**
 * Get search analytics summary
 */
export const getSearchAnalytics = async (days: number = 30) => {
  try {
    const analytics = await db
      .select({
        totalSearches: sql<number>`count(*)`,
        uniqueQueries: sql<number>`count(DISTINCT ${searchAnalytics.query})`,
        avgResultsCount: sql<number>`avg(${searchAnalytics.resultsCount})`,
        avgSearchDuration: sql<number>`avg(${searchAnalytics.searchDuration})`,
        clickThroughRate: sql<number>`
          (count(${searchAnalytics.clickedProductId}) * 100.0 / count(*))
        `,
      })
      .from(searchAnalytics)
      .where(sql`${searchAnalytics.createdAt} > NOW() - INTERVAL '${days} days'`);

    return analytics[0] || {
      totalSearches: 0,
      uniqueQueries: 0,
      avgResultsCount: 0,
      avgSearchDuration: 0,
      clickThroughRate: 0,
    };
  } catch (error) {
    logger.error('Error getting search analytics:', error);
    throw error;
  }
};