import { z } from 'zod';

export const searchProductsSchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Search query is required').optional(),
    category: z.string().optional(),
    minPrice: z.string().transform(val => val ? parseFloat(val) : undefined).optional(),
    maxPrice: z.string().transform(val => val ? parseFloat(val) : undefined).optional(),
    tags: z.string().optional(),
    inStock: z.string().transform(val => val === 'true').optional(),
    featured: z.string().transform(val => val === 'true').optional(),
    sortBy: z.enum(['relevance', 'price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest', 'oldest', 'rating']).default('relevance'),
    page: z.string().transform(val => parseInt(val) || 1).default(() => 1),
    limit: z.string().transform(val => Math.min(parseInt(val) || 10, 50)).default(() => 10),
  }),
});

export const searchSuggestionsSchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Search query is required'),
    limit: z.string().transform(val => Math.min(parseInt(val) || 5, 10)).default(() => 5),
  }),
});

export const searchFiltersSchema = z.object({
  query: z.object({
    category: z.string().optional(),
  }),
});

export type SearchProductsInput = z.infer<typeof searchProductsSchema>['query'];
export type SearchSuggestionsInput = z.infer<typeof searchSuggestionsSchema>['query'];
export type SearchFiltersInput = z.infer<typeof searchFiltersSchema>['query'];