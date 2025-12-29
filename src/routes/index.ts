import { Router } from 'express';
import { logger } from '../utils';
import userRoutes from './user.routes';
import categoryRoutes from './category.routes';
import productRoutes from './product.routes';
import addressRoutes from './address.routes';
import orderRoutes from './order.routes';
import searchRoutes from './search.routes';
import reviewRoutes from './review.routes';
import couponRoutes from './coupon.routes';

const router = Router();

/**
 * @swagger
 * /healthz:
 *   get:
 *     summary: Perform a health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: The service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   example: 123.45
 *                 environment:
 *                   type: string
 *                   example: development
 */
router.get('/healthz', (_, res) => {
  logger.info('Health check requested');
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// User routes
router.use('/users', userRoutes);

// Category routes
router.use('/categories', categoryRoutes);

// Product routes
router.use('/products', productRoutes);

// Address routes
router.use('/addresses', addressRoutes);

// Order routes
router.use('/orders', orderRoutes);

// Search routes
router.use('/search', searchRoutes);

// Review routes
router.use('/reviews', reviewRoutes);

// Coupon routes
router.use('/coupons', couponRoutes);

export default router;
