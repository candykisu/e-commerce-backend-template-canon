# Advanced Search Features

This document outlines the comprehensive search functionality implemented in the e-commerce API.

## 🔍 Search Capabilities

### 1. Advanced Product Search (`GET /api/search/products`)

**Features:**
- Full-text search across product names, descriptions, SKUs, and tags
- Multiple filter options (category, price range, tags, stock status, featured)
- Advanced sorting options (relevance, price, name, date, rating)
- Pagination support
- Search result analytics tracking
- Contextual search suggestions

**Query Parameters:**
```
q: string           // Search query (optional)
category: string    // Category ID filter
minPrice: number    // Minimum price filter
maxPrice: number    // Maximum price filter
tags: string        // Comma-separated tags
inStock: boolean    // Filter for in-stock products only
featured: boolean   // Filter for featured products only
sortBy: string      // Sort order (relevance, price_asc, price_desc, name_asc, name_desc, newest, oldest, rating)
page: number        // Page number (default: 1)
limit: number       // Items per page (default: 10, max: 50)
```

**Response Structure:**
```json
{
  "success": true,
  "message": "Search results fetched successfully",
  "data": {
    "products": [...],
    "filters": {
      "categories": [{"id": 1, "name": "Electronics", "count": 25}],
      "priceRanges": [{"min": 0, "max": 100, "count": 10}],
      "tags": [{"name": "laptop", "count": 15}],
      "inStockCount": 45,
      "totalCount": 50
    },
    "suggestions": ["laptop", "laptop bag", "gaming laptop"]
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5,
    "query": "laptop",
    "sortBy": "relevance"
  }
}
```

### 2. Search Autocomplete (`GET /api/search/suggestions`)

**Features:**
- Real-time search suggestions
- Product name suggestions
- Category suggestions
- Suggestion ranking by relevance and popularity

**Example Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {"text": "MacBook Pro", "type": "product", "count": 1},
      {"text": "Laptops", "type": "category", "count": 25}
    ],
    "query": "mac"
  }
}
```

### 3. Search Filters (`GET /api/search/filters`)

**Features:**
- Dynamic filter generation based on available products
- Category filters with product counts
- Price range filters with distribution
- Popular tags with counts
- Stock availability counts

### 4. Related Products (`GET /api/search/related/{productId}`)

**Features:**
- Category-based recommendations
- Tag-based similarity matching
- Relevance scoring
- Configurable result limits

### 5. Trending Products (`GET /api/search/trending`)

**Features:**
- Featured product prioritization
- Recently added products
- Configurable trending algorithms

### 6. Recently Viewed Products (`GET /api/search/recently-viewed`)

**Features:**
- Session-based product tracking
- Order preservation
- Active product filtering

### 7. Popular Search Terms (`GET /api/search/popular-terms`)

**Features:**
- Analytics-driven popular terms
- Word frequency analysis
- Configurable result limits

## 🎯 Search Relevance Algorithm

The search relevance scoring considers:

1. **Exact Name Match** (Score: 100)
2. **Short Description Match** (Score: 80)
3. **SKU Match** (Score: 70)
4. **Description Match** (Score: 60)
5. **Tag Match** (Score: 50)
6. **Featured Product Bonus** (+10)

## 📊 Search Analytics

### Tracking Features:
- Search query logging
- Result count tracking
- Search duration measurement
- Click-through rate monitoring
- Popular search term analysis
- User behavior analytics

### Analytics Tables:
- `search_analytics`: Individual search events
- `popular_searches`: Aggregated search statistics

### Tracked Metrics:
- Total searches
- Unique queries
- Average results count
- Average search duration
- Click-through rate
- Popular terms over time

## 🚀 Performance Optimizations

### Database Indexes:
```sql
-- Search performance indexes
CREATE INDEX idx_products_name_gin ON products USING gin(to_tsvector('english', name));
CREATE INDEX idx_products_description_gin ON products USING gin(to_tsvector('english', description));
CREATE INDEX idx_products_tags_gin ON products USING gin(tags);
CREATE INDEX idx_products_category_status ON products (category_id, status);
CREATE INDEX idx_products_price ON products (CAST(price AS DECIMAL));
CREATE INDEX idx_products_featured_status ON products (is_featured, status);
```

### Caching Strategy:
- Popular search terms caching
- Filter options caching
- Trending products caching
- Search result caching for common queries

## 🔧 Configuration Options

### Environment Variables:
```env
SEARCH_CACHE_TTL=300          # Cache TTL in seconds
SEARCH_MAX_SUGGESTIONS=10     # Max autocomplete suggestions
SEARCH_ANALYTICS_ENABLED=true # Enable search analytics
SEARCH_MIN_QUERY_LENGTH=2     # Minimum query length for suggestions
```

### Search Settings:
- Maximum results per page: 50
- Default results per page: 10
- Minimum query length: 1 character
- Maximum suggestion count: 10
- Analytics retention period: 90 days

## 📱 Frontend Integration Examples

### Basic Search:
```javascript
const searchProducts = async (query, filters = {}) => {
  const params = new URLSearchParams({
    q: query,
    ...filters,
    page: 1,
    limit: 20
  });
  
  const response = await fetch(`/api/search/products?${params}`);
  return response.json();
};
```

### Autocomplete:
```javascript
const getSearchSuggestions = async (query) => {
  const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}&limit=5`);
  return response.json();
};
```

### Faceted Search:
```javascript
const getSearchFilters = async (category) => {
  const params = category ? `?category=${category}` : '';
  const response = await fetch(`/api/search/filters${params}`);
  return response.json();
};
```

## 🧪 Testing

### Bruno API Tests:
- Advanced search with all filters
- Autocomplete suggestions
- Filter retrieval
- Related products
- Trending products
- Recently viewed products
- Popular search terms

### Test Scenarios:
1. Empty search query
2. Search with no results
3. Search with filters
4. Pagination testing
5. Sort order validation
6. Analytics tracking verification

## 🔮 Future Enhancements

### Planned Features:
1. **Elasticsearch Integration** - For advanced full-text search
2. **Machine Learning Recommendations** - AI-powered product suggestions
3. **Visual Search** - Image-based product search
4. **Voice Search** - Speech-to-text search capability
5. **Personalized Search** - User behavior-based result ranking
6. **Search Result Clustering** - Group similar products
7. **Spell Correction** - Auto-correct search queries
8. **Synonym Support** - Handle alternative product names
9. **Multi-language Search** - International search support
10. **Search Result Export** - CSV/PDF export functionality

### Performance Improvements:
1. **Search Result Caching** - Redis-based result caching
2. **Query Optimization** - Advanced database query optimization
3. **CDN Integration** - Cached search results via CDN
4. **Async Processing** - Background search analytics processing
5. **Search Index Optimization** - Specialized search indexes

## 📚 API Documentation

Complete API documentation is available at `/api-docs` when the server is running. The search endpoints are fully documented with Swagger/OpenAPI specifications including:

- Request/response schemas
- Parameter descriptions
- Example requests and responses
- Error handling documentation
- Rate limiting information

## 🛠️ Troubleshooting

### Common Issues:

1. **Slow Search Performance**
   - Check database indexes
   - Verify query complexity
   - Monitor database performance

2. **No Search Results**
   - Verify product status (active)
   - Check search query formatting
   - Validate filter parameters

3. **Analytics Not Working**
   - Check database permissions
   - Verify middleware order
   - Check error logs

### Debug Endpoints:
- `GET /api/search/filters` - Check available filters
- `GET /api/admin/stats/system` - System performance metrics
- Search logs in application logs for detailed debugging