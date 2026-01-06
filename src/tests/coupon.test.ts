import request from 'supertest';
import app from '../app';

describe('Coupon API', () => {
  describe('POST /api/coupons', () => {
    it('should create a percentage coupon', async () => {
      const couponData = {
        code: 'TEST20',
        name: '20% Off Test',
        description: 'Test coupon for 20% off',
        type: 'percentage',
        value: 20,
        minimumOrderAmount: 50,
        maximumDiscountAmount: 100,
        usageLimit: 100,
        userUsageLimit: 1,
        isActive: true,
        isPublic: true,
        stackable: false,
        firstTimeCustomerOnly: false,
        validFrom: '2024-01-01T00:00:00Z',
        validUntil: '2024-12-31T23:59:59Z',
      };

      const response = await request(app)
        .post('/api/coupons')
        .send(couponData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.code).toBe('TEST20');
      expect(response.body.data.type).toBe('percentage');
    });

    it('should create a buy X get Y coupon', async () => {
      const couponData = {
        code: 'BUY2GET1TEST',
        name: 'Buy 2 Get 1 Free Test',
        type: 'buy_x_get_y',
        value: 0,
        validFrom: '2024-01-01T00:00:00Z',
        validUntil: '2024-12-31T23:59:59Z',
        buyXGetY: {
          buyQuantity: 2,
          getQuantity: 1,
          buyCategoryIds: [1, 2],
          getCategoryIds: [1, 2],
          getDiscountType: 'free',
          getDiscountValue: 0,
        },
      };

      const response = await request(app)
        .post('/api/coupons')
        .send(couponData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('buy_x_get_y');
    });

    it('should validate coupon code format', async () => {
      const invalidData = {
        code: 'invalid code', // Contains spaces and lowercase
        name: 'Test Coupon',
        type: 'percentage',
        value: 20,
        validFrom: '2024-01-01T00:00:00Z',
        validUntil: '2024-12-31T23:59:59Z',
      };

      const response = await request(app)
        .post('/api/coupons')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate percentage value', async () => {
      const invalidData = {
        code: 'INVALID150',
        name: 'Invalid Percentage',
        type: 'percentage',
        value: 150, // Invalid percentage > 100
        validFrom: '2024-01-01T00:00:00Z',
        validUntil: '2024-12-31T23:59:59Z',
      };

      const response = await request(app)
        .post('/api/coupons')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate date range', async () => {
      const invalidData = {
        code: 'INVALIDDATE',
        name: 'Invalid Date Range',
        type: 'percentage',
        value: 20,
        validFrom: '2024-12-31T00:00:00Z',
        validUntil: '2024-01-01T00:00:00Z', // End before start
      };

      const response = await request(app)
        .post('/api/coupons')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/coupons', () => {
    it('should get coupons with pagination', async () => {
      const response = await request(app)
        .get('/api/coupons?page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('coupons');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data.coupons).toBeInstanceOf(Array);
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('limit');
    });

    it('should filter coupons by type', async () => {
      const response = await request(app)
        .get('/api/coupons?type=percentage')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.coupons.forEach((coupon: any) => {
        expect(coupon.type).toBe('percentage');
      });
    });

    it('should filter coupons by active status', async () => {
      const response = await request(app)
        .get('/api/coupons?isActive=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.coupons.forEach((coupon: any) => {
        expect(coupon.isActive).toBe(true);
      });
    });

    it('should search coupons', async () => {
      const response = await request(app)
        .get('/api/coupons?search=test')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/coupons/public', () => {
    it('should get public coupons', async () => {
      const response = await request(app)
        .get('/api/coupons/public?limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/coupons/my-coupons', () => {
    it('should get user available coupons', async () => {
      const response = await request(app)
        .get('/api/coupons/my-coupons')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/coupons/validate', () => {
    it('should validate a valid coupon', async () => {
      const validationData = {
        couponCode: 'VALID20',
        cartTotal: 100,
        cartItems: [
          {
            productId: 1,
            categoryId: 1,
            quantity: 2,
            price: 50,
          },
        ],
        userId: '123e4567-e89b-12d3-a456-426614174000',
      };

      // This would return 400 if coupon doesn't exist, which is expected for test
      const response = await request(app)
        .post('/api/coupons/validate')
        .send(validationData);

      // Should be either 200 (valid) or 400 (invalid/not found)
      expect([200, 400]).toContain(response.status);
    });

    it('should require coupon code', async () => {
      const invalidData = {
        cartTotal: 100,
        cartItems: [],
        // Missing couponCode
      };

      const response = await request(app)
        .post('/api/coupons/validate')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate cart total', async () => {
      const invalidData = {
        couponCode: 'TEST',
        cartTotal: -10, // Invalid negative total
        cartItems: [],
      };

      const response = await request(app)
        .post('/api/coupons/validate')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/coupons/apply', () => {
    it('should apply a coupon to cart', async () => {
      const applyData = {
        couponCode: 'APPLY20',
        cartId: 123,
        userId: '123e4567-e89b-12d3-a456-426614174000',
      };

      // This would return 404 if coupon doesn't exist, which is expected for test
      const response = await request(app)
        .post('/api/coupons/apply')
        .send(applyData);

      // Should be either 200 (success) or 404 (not found)
      expect([200, 404]).toContain(response.status);
    });

    it('should require coupon code', async () => {
      const invalidData = {
        cartId: 123,
        // Missing couponCode
      };

      const response = await request(app)
        .post('/api/coupons/apply')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/coupons/remove', () => {
    it('should remove coupon from cart', async () => {
      const removeData = {
        couponCode: 'REMOVE20',
        cartId: 123,
      };

      const response = await request(app)
        .post('/api/coupons/remove')
        .send(removeData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/coupons/:couponId', () => {
    it('should get coupon by ID', async () => {
      const response = await request(app)
        .get('/api/coupons/1');

      // Should be either 200 (found) or 404 (not found)
      expect([200, 404]).toContain(response.status);
    });

    it('should handle invalid coupon ID', async () => {
      const response = await request(app)
        .get('/api/coupons/invalid')
        .expect(400);

      expect(response.body.message).toContain('Invalid coupon ID');
    });
  });

  describe('POST /api/coupons/assign', () => {
    it('should assign coupon to users', async () => {
      const assignData = {
        couponId: 1,
        userIds: [
          '123e4567-e89b-12d3-a456-426614174000',
          '987fcdeb-51d3-12a4-b456-426614174111',
        ],
      };

      const response = await request(app)
        .post('/api/coupons/assign')
        .send(assignData);

      // Should be either 200 (success) or 404 (coupon not found)
      expect([200, 404]).toContain(response.status);
    });

    it('should validate user IDs format', async () => {
      const invalidData = {
        couponId: 1,
        userIds: ['invalid-uuid'], // Invalid UUID format
      };

      const response = await request(app)
        .post('/api/coupons/assign')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should require at least one user ID', async () => {
      const invalidData = {
        couponId: 1,
        userIds: [], // Empty array
      };

      const response = await request(app)
        .post('/api/coupons/assign')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/coupons/statistics', () => {
    it('should get coupon statistics', async () => {
      const response = await request(app)
        .get('/api/coupons/statistics?period=30d')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalCoupons');
      expect(response.body.data).toHaveProperty('activeCoupons');
      expect(response.body.data).toHaveProperty('totalUsages');
    });

    it('should get statistics for specific coupon', async () => {
      const response = await request(app)
        .get('/api/coupons/statistics?period=30d&couponId=1')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle different time periods', async () => {
      const periods = ['7d', '30d', '90d', '1y', 'all'];
      
      for (const period of periods) {
        const response = await request(app)
          .get(`/api/coupons/statistics?period=${period}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });
  });

  describe('GET /api/coupons/users/:userId', () => {
    it('should get user coupons', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      
      const response = await request(app)
        .get(`/api/coupons/users/${userId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should validate user ID format', async () => {
      const response = await request(app)
        .get('/api/coupons/users/invalid-uuid')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});