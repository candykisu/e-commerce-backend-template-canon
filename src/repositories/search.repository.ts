import { eq, and, desc, asc, sql, like, or, inArray, gte, lte, ne, isNotNull } from 'drizzle-orm';
import { db } from '../db';
import { products, categories, Product } from '../models/ecommerce.schema';
import { SearchProductsInput, SearchFiltersInput } from '../schemas/search.schema';
import { SearchFilters, SearchSuggestion } from '../services/search.service';
import { logger } from '../utils';

// Type for product with category info
type ProductWithCategory = Product & {
  category?: {
    id: number;
    name: string;
    slug: string;
  } | null;
};

/**
 * Advanced product search with filters, sorting, and full-text search
 */
export const searchProducts = async (searchParams: SearchProductsInput): Promise<{
  products: ProductWithCategory[];
  total: number;
}> => {
  try {
    const { q, category, minPrice, maxPrice, tags, inStock, featured, sortBy, page, limit } = searchParams;
    const offset = (page - 1) * limit;
    const conditions = [];

    // Always filter for active products
    conditions.push(eq(products.status, 'active'));

    // Text search with ranking
    if (q && q.trim()) {
      const searchTerm = q.trim();
      conditions.push(
        or(
          // Exact name match gets highest priority
          like(products.name, `%${searchTerm}%`),
          // Description match
          like(products.description, `%${searchTerm}%`),
          // SKU match
          like(products.sku, `%${searchTerm}%`),
          // Tags array search
          sql`${products.tags} && ARRAY[${searchTerm}]::text[]`,
          // Short description match
          like(products.shortDescription, `%${searchTerm}%`)
        )
      );
    }

    // Category filter
    if (category) {
      const categoryId = parseInt(category);
      if (!isNaN(categoryId)) {
        conditions.push(eq(products.categoryId, categoryId));
      }
    }

    // Price range filters
    if (minPrice !== undefined) {
      conditions.push(gte(sql`CAST(${products.price} AS DECIMAL)`, minPrice));
    }
    if (maxPrice !== undefined) {
      conditions.push(lte(sql`CAST(${products.price} AS DECIMAL)`, maxPrice));
    }

    // Tags filter
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);
      if (tagArray.length > 0) {
        conditions.push(sql`${products.tags} && ${tagArray}`);
      }
    }

    // Stock filter
    if (inStock) {
      conditions.push(
        or(
          eq(products.trackQuantity, false),
          and(eq(products.trackQuantity, true), gte(products.quantity, 1))
        )
      );
    }

    // Featured filter
    if (featured !== undefined) {
      conditions.push(eq(products.isFeatured, featured));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sort order
    let orderBy;
    switch (sortBy) {
      case 'price_asc':
        orderBy = asc(sql`CAST(${products.price} AS DECIMAL)`);
        break;
      case 'price_desc':
        orderBy = desc(sql`CAST(${products.price} AS DECIMAL)`);
        break;
      case 'name_asc':
        orderBy = asc(products.name);
        break;
      case 'name_desc':
        orderBy = desc(products.name);
        break;
      case 'newest':
        orderBy = desc(products.createdAt);
        break;
      case 'oldest':
        orderBy = asc(products.createdAt);
        break;
      case 'rating':
        // TODO: Implement when ratings are added
        orderBy = desc(products.isFeatured);
        break;
      case 'relevance':
      default:
        if (q && q.trim()) {
          // Create relevance score based on match type
          orderBy = desc(
            sql`
              CASE 
                WHEN ${products.name} ILIKE ${`%${q}%`} THEN 100
                WHEN ${products.shortDescription} ILIKE ${`%${q}%`} THEN 80
                WHEN ${products.sku} ILIKE ${`%${q}%`} THEN 70
                WHEN ${products.description} ILIKE ${`%${q}%`} THEN 60
                WHEN ${products.tags} && ARRAY[${q}]::text[] THEN 50
                ELSE 0
              END + 
              CASE WHEN ${products.isFeatured} THEN 10 ELSE 0 END
            `
          );
        } else {
          orderBy = desc(products.createdAt);
        }
        break;
    }

    const [resultProducts, totalResult] = await Promise.all([
      db
        .select({
          id: products.id,
          name: products.name,
          slug: products.slug,
          description: products.description,
          shortDescription: products.shortDescription,
          sku: products.sku,
          price: products.price,
          comparePrice: products.comparePrice,
          costPrice: products.costPrice,
          trackQuantity: products.trackQuantity,
          quantity: products.quantity,
          allowBackorder: products.allowBackorder,
          weight: products.weight,
          dimensions: products.dimensions,
          categoryId: products.categoryId,
          tags: products.tags,
          images: products.images,
          status: products.status,
          isFeatured: products.isFeatured,
          seoTitle: products.seoTitle,
          seoDescription: products.seoDescription,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
          category: {
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
          },
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(orderBy),
      db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    logger.info('Advanced search completed', {
      searchTerm: q,
      total,
      returned: resultProducts.length,
      page,
      limit,
    });

    return { products: resultProducts, total };
  } catch (error) {
    logger.error('Error in advanced product search:', error);
    throw error;
  }
};

/**
 * Get search filters based on current search context
 */
export const getSearchFilters = async (searchParams: SearchProductsInput | SearchFiltersInput): Promise<SearchFilters> => {
  try {
    const conditions = [eq(products.status, 'active')];

    // Apply existing filters to get contextual filter counts
    if ('q' in searchParams && searchParams.q) {
      const searchTerm = searchParams.q.trim();
      conditions.push(
        or(
          like(products.name, `%${searchTerm}%`),
          like(products.description, `%${searchTerm}%`),
          like(products.sku, `%${searchTerm}%`),
          sql`${products.tags} && ARRAY[${searchTerm}]::text[]`
        )
      );
    }

    if ('category' in searchParams && searchParams.category) {
      const categoryId = parseInt(searchParams.category);
      if (!isNaN(categoryId)) {
        conditions.push(eq(products.categoryId, categoryId));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get category counts
    const categoryFilters = await db
      .select({
        id: categories.id,
        name: categories.name,
        count: sql<number>`count(${products.id})`,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(whereClause)
      .groupBy(categories.id, categories.name)
      .having(sql`count(${products.id}) > 0`)
      .orderBy(desc(sql`count(${products.id})`));

    // Get price ranges
    const priceStats = await db
      .select({
        minPrice: sql<number>`MIN(CAST(${products.price} AS DECIMAL))`,
        maxPrice: sql<number>`MAX(CAST(${products.price} AS DECIMAL))`,
        avgPrice: sql<number>`AVG(CAST(${products.price} AS DECIMAL))`,
      })
      .from(products)
      .where(whereClause);

    const { minPrice = 0, maxPrice = 1000, avgPrice = 100 } = priceStats[0] || {};

    // Create price ranges
    const priceRanges = [
      { min: 0, max: avgPrice / 2, count: 0 },
      { min: avgPrice / 2, max: avgPrice, count: 0 },
      { min: avgPrice, max: avgPrice * 2, count: 0 },
      { min: avgPrice * 2, max: maxPrice, count: 0 },
    ];

    // Get counts for each price range
    for (const range of priceRanges) {
      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(
          and(
            whereClause,
            gte(sql`CAST(${products.price} AS DECIMAL)`, range.min),
            lte(sql`CAST(${products.price} AS DECIMAL)`, range.max)
          )
        );
      range.count = Number(result?.count || 0);
    }

    // Get popular tags
    const tagResults = await db
      .select({
        tags: products.tags,
      })
      .from(products)
      .where(and(whereClause, isNotNull(products.tags)));

    const tagCounts: Record<string, number> = {};
    tagResults.forEach(row => {
      if (row.tags && Array.isArray(row.tags)) {
        row.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Get in-stock count
    const [inStockResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(
        and(
          whereClause,
          or(
            eq(products.trackQuantity, false),
            and(eq(products.trackQuantity, true), gte(products.quantity, 1))
          )
        )
      );

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(whereClause);

    return {
      categories: categoryFilters.map(cat => ({
        id: cat.id,
        name: cat.name,
        count: Number(cat.count),
      })),
      priceRanges: priceRanges.filter(range => range.count > 0),
      tags: topTags,
      inStockCount: Number(inStockResult?.count || 0),
      totalCount: Number(totalResult?.count || 0),
    };
  } catch (error) {
    logger.error('Error getting search filters:', error);
    throw error;
  }
};

/**
 * Get search suggestions for autocomplete
 */
export const getSearchSuggestions = async (query: string, limit: number = 5): Promise<string[]> => {
  try {
    const searchTerm = query.trim().toLowerCase();
    
    const suggestions = await db
      .select({
        name: products.name,
      })
      .from(products)
      .where(
        and(
          eq(products.status, 'active'),
          like(products.name, `%${searchTerm}%`)
        )
      )
      .limit(limit)
      .orderBy(asc(products.name));

    return suggestions.map(s => s.name);
  } catch (error) {
    logger.error('Error getting search suggestions:', error);
    throw error;
  }
};

/**
 * Get detailed search suggestions with types
 */
export const getDetailedSearchSuggestions = async (query: string, limit: number = 5): Promise<SearchSuggestion[]> => {
  try {
    const searchTerm = query.trim().toLowerCase();
    const suggestions: SearchSuggestion[] = [];

    // Product name suggestions
    const productSuggestions = await db
      .select({
        name: products.name,
        count: sql<number>`1`,
      })
      .from(products)
      .where(
        and(
          eq(products.status, 'active'),
          like(products.name, `%${searchTerm}%`)
        )
      )
      .limit(Math.ceil(limit * 0.6))
      .orderBy(asc(products.name));

    suggestions.push(
      ...productSuggestions.map(p => ({
        text: p.name,
        type: 'product' as const,
        count: 1,
      }))
    );

    // Category suggestions
    const categorySuggestions = await db
      .select({
        name: categories.name,
        count: sql<number>`count(${products.id})`,
      })
      .from(categories)
      .leftJoin(products, and(eq(products.categoryId, categories.id), eq(products.status, 'active')))
      .where(like(categories.name, `%${searchTerm}%`))
      .groupBy(categories.id, categories.name)
      .having(sql`count(${products.id}) > 0`)
      .limit(Math.ceil(limit * 0.4))
      .orderBy(desc(sql`count(${products.id})`));

    suggestions.push(
      ...categorySuggestions.map(c => ({
        text: c.name,
        type: 'category' as const,
        count: Number(c.count),
      }))
    );

    return suggestions.slice(0, limit);
  } catch (error) {
    logger.error('Error getting detailed search suggestions:', error);
    throw error;
  }
};

/**
 * Get popular search terms (would typically come from search analytics)
 */
export const getPopularSearchTerms = async (limit: number = 10): Promise<string[]> => {
  try {
    // For now, return most common words from product names and tags
    const results = await db
      .select({
        name: products.name,
        tags: products.tags,
      })
      .from(products)
      .where(eq(products.status, 'active'))
      .limit(100);

    const wordCounts: Record<string, number> = {};
    
    results.forEach(product => {
      // Extract words from product names
      const nameWords = product.name.toLowerCase().split(/\s+/).filter(word => word.length > 2);
      nameWords.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });

      // Extract from tags
      if (product.tags && Array.isArray(product.tags)) {
        product.tags.forEach(tag => {
          const tagWords = tag.toLowerCase().split(/\s+/).filter(word => word.length > 2);
          tagWords.forEach(word => {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
          });
        });
      }
    });

    return Object.entries(wordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([word]) => word);
  } catch (error) {
    logger.error('Error getting popular search terms:', error);
    throw error;
  }
};

/**
 * Get trending products (based on featured status and recent creation)
 */
export const getTrendingProducts = async (limit: number = 10): Promise<Product[]> => {
  try {
    const trendingProducts = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.status, 'active'),
          or(
            eq(products.isFeatured, true),
            gte(products.createdAt, sql`NOW() - INTERVAL '30 days'`)
          )
        )
      )
      .limit(limit)
      .orderBy(
        desc(products.isFeatured),
        desc(products.createdAt)
      );

    return trendingProducts;
  } catch (error) {
    logger.error('Error getting trending products:', error);
    throw error;
  }
};

/**
 * Get products by IDs (for recently viewed)
 */
export const getProductsByIds = async (productIds: number[]): Promise<Product[]> => {
  try {
    if (productIds.length === 0) return [];

    const products_result = await db
      .select()
      .from(products)
      .where(
        and(
          inArray(products.id, productIds),
          eq(products.status, 'active')
        )
      );

    // Maintain the order of the input array
    const productMap = new Map(products_result.map(p => [p.id, p]));
    return productIds.map(id => productMap.get(id)).filter(Boolean) as Product[];
  } catch (error) {
    logger.error('Error getting products by IDs:', error);
    throw error;
  }
};

/**
 * Get related products based on category and tags
 */
export const getRelatedProducts = async (productId: number, limit: number = 6): Promise<Product[]> => {
  try {
    // First get the current product to find related ones
    const [currentProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));

    if (!currentProduct) {
      return [];
    }

    // Find products in the same category with similar tags
    const relatedProducts = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.status, 'active'),
          ne(products.id, productId),
          or(
            eq(products.categoryId, currentProduct.categoryId),
            currentProduct.tags && currentProduct.tags.length > 0
              ? sql`${products.tags} && ${currentProduct.tags}`
              : sql`false`
          )
        )
      )
      .limit(limit)
      .orderBy(
        // Prioritize same category
        desc(sql`CASE WHEN ${products.categoryId} = ${currentProduct.categoryId} THEN 1 ELSE 0 END`),
        // Then by tag overlap
        currentProduct.tags && currentProduct.tags.length > 0
          ? desc(sql`array_length(${products.tags} & ${currentProduct.tags}, 1)`)
          : sql`1`,
        desc(products.createdAt)
      );

    return relatedProducts;
  } catch (error) {
    logger.error('Error getting related products:', error);
    throw error;
  }
};