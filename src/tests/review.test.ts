import request from 'supertest';
import app from '../app';

describe('Review API', () => {
  describe('POST /api/reviews', () => {
    it('should create a new review', async () => {
      const reviewData = {
        productId: 1,
        rating: 5,
        title: 'Great product!',
        comment: 'This product is amazing and works perfectly. Highly recommended!',
        isRecommended: true,
      };

      const response = await request(app)
        .post('/api/reviews')
        .send(reviewData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.rating).toBe(5);
      expect(response.body.data.title).toBe('Great product!');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        rating: 5,
        // Missing productId
      };

      const response = await request(app)
        .post('/api/reviews')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate rating range', async () => {
      const invalidData = {
        productId: 1,
        rating: 6, // Invalid rating
        comment: 'This is a test comment that is long enough to pass validation.',
      };

      const response = await request(app)
        .post('/api/reviews')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/reviews/products/:productId', () => {
    it('should get reviews for a product', async () => {
      const response = await request(app)
        .get('/api/reviews/products/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('reviews');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data.reviews).toBeInstanceOf(Array);
    });

    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/reviews/products/1?page=1&limit=5')
        .expect(200);

      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(5);
    });

    it('should filter by rating', async () => {
      const response = await request(app)
        .get('/api/reviews/products/1?rating=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      // All returned reviews should have rating 5
      response.body.data.reviews.forEach((review: any) => {
        expect(review.rating).toBe(5);
      });
    });

    it('should handle invalid product ID', async () => {
      const response = await request(app)
        .get('/api/reviews/products/invalid')
        .expect(400);

      expect(response.body.message).toContain('Invalid product ID');
    });
  });

  describe('GET /api/reviews/:reviewId', () => {
    it('should get a specific review', async () => {
      const response = await request(app)
        .get('/api/reviews/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('rating');
      expect(response.body.data).toHaveProperty('user');
    });

    it('should handle invalid review ID', async () => {
      const response = await request(app)
        .get('/api/reviews/invalid')
        .expect(400);

      expect(response.body.message).toContain('Invalid review ID');
    });
  });

  describe('POST /api/reviews/:reviewId/helpful', () => {
    it('should mark review as helpful', async () => {
      const response = await request(app)
        .post('/api/reviews/1/helpful')
        .send({ isHelpful: true })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should mark review as not helpful', async () => {
      const response = await request(app)
        .post('/api/reviews/1/helpful')
        .send({ isHelpful: false })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/api/reviews/1/helpful')
        .send({}) // Missing isHelpful
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/reviews/products/:productId/summary', () => {
    it('should get product rating summary', async () => {
      const response = await request(app)
        .get('/api/reviews/products/1/summary')
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data) {
        expect(response.body.data).toHaveProperty('totalReviews');
        expect(response.body.data).toHaveProperty('averageRating');
        expect(response.body.data).toHaveProperty('rating1Count');
        expect(response.body.data).toHaveProperty('rating5Count');
      }
    });
  });

  describe('POST /api/reviews/questions', () => {
    it('should create a product question', async () => {
      const questionData = {
        productId: 1,
        question: 'What is the warranty period for this product?',
      };

      const response = await request(app)
        .post('/api/reviews/questions')
        .send(questionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.question).toBe(questionData.question);
    });

    it('should validate question length', async () => {
      const invalidData = {
        productId: 1,
        question: 'Short', // Too short
      };

      const response = await request(app)
        .post('/api/reviews/questions')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/reviews/products/:productId/questions', () => {
    it('should get questions for a product', async () => {
      const response = await request(app)
        .get('/api/reviews/products/1/questions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('questions');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data.questions).toBeInstanceOf(Array);
    });

    it('should handle sorting', async () => {
      const response = await request(app)
        .get('/api/reviews/products/1/questions?sortBy=most_answers')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/reviews/questions/:questionId/answers', () => {
    it('should create an answer to a question', async () => {
      const answerData = {
        answer: 'The warranty period is 2 years from the date of purchase.',
      };

      const response = await request(app)
        .post('/api/reviews/questions/1/answers')
        .send(answerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.answer).toBe(answerData.answer);
    });

    it('should validate answer length', async () => {
      const invalidData = {
        answer: 'No', // Too short
      };

      const response = await request(app)
        .post('/api/reviews/questions/1/answers')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/reviews/questions/:questionId/answers', () => {
    it('should get answers for a question', async () => {
      const response = await request(app)
        .get('/api/reviews/questions/1/answers')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/reviews/statistics', () => {
    it('should get review statistics', async () => {
      const response = await request(app)
        .get('/api/reviews/statistics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalReviews');
      expect(response.body.data).toHaveProperty('averageRating');
      expect(response.body.data).toHaveProperty('reviewsByRating');
    });

    it('should handle different time periods', async () => {
      const response = await request(app)
        .get('/api/reviews/statistics?period=7d')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});