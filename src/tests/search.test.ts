import request from 'supertest';
import app from '../app';

describe('Search API', () => {
  describe('GET /api/search/products', () => {
    it('should return search results with empty query', async () => {
      const response = await request(app)
        .get('/api/search/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('products');
      expect(response.body.data).toHaveProperty('filters');
      expect(response.body.meta).toHaveProperty('total');
    });

    it('should return filtered results with query', async () => {
      const response = await request(app)
        .get('/api/search/products?q=test&sortBy=price_asc&limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toBeInstanceOf(Array);
      expect(response.body.meta.limit).toBe(5);
      expect(response.body.meta.query).toBe('test');
      expect(response.body.meta.sortBy).toBe('price_asc');
    });

    it('should validate query parameters', async () => {
      const response = await request(app)
        .get('/api/search/products?limit=100') // Exceeds max limit
        .expect(200);

      // Should cap at max limit of 50
      expect(response.body.meta.limit).toBeLessThanOrEqual(50);
    });
  });

  describe('GET /api/search/suggestions', () => {
    it('should return suggestions for valid query', async () => {
      const response = await request(app)
        .get('/api/search/suggestions?q=test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('suggestions');
      expect(response.body.data.suggestions).toBeInstanceOf(Array);
      expect(response.body.data.query).toBe('test');
    });

    it('should require query parameter', async () => {
      const response = await request(app)
        .get('/api/search/suggestions')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/search/filters', () => {
    it('should return available filters', async () => {
      const response = await request(app)
        .get('/api/search/filters')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('categories');
      expect(response.body.data).toHaveProperty('priceRanges');
      expect(response.body.data).toHaveProperty('tags');
      expect(response.body.data).toHaveProperty('inStockCount');
      expect(response.body.data).toHaveProperty('totalCount');
    });
  });

  describe('GET /api/search/popular-terms', () => {
    it('should return popular search terms', async () => {
      const response = await request(app)
        .get('/api/search/popular-terms?limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('terms');
      expect(response.body.data.terms).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/search/trending', () => {
    it('should return trending products', async () => {
      const response = await request(app)
        .get('/api/search/trending?limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/search/related/:productId', () => {
    it('should return related products for valid product ID', async () => {
      const response = await request(app)
        .get('/api/search/related/1?limit=3')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should handle invalid product ID', async () => {
      const response = await request(app)
        .get('/api/search/related/invalid')
        .expect(400);

      expect(response.body.message).toContain('Invalid product ID');
    });
  });

  describe('GET /api/search/recently-viewed', () => {
    it('should return recently viewed products', async () => {
      const response = await request(app)
        .get('/api/search/recently-viewed?ids=1,2,3&limit=3')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should handle empty IDs', async () => {
      const response = await request(app)
        .get('/api/search/recently-viewed')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });
});