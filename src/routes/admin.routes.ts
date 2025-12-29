import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { validate } from '../middlewares/validate';
import { 
  adminDateRangeSchema, 
  adminBulkActionSchema, 
  adminInventoryUpdateSchema, 
  adminOrderBulkUpdateSchema,
  adminReportSchema 
} from '../schemas/admin.schema';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin panel management API
 */

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get admin dashboard analytics
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, quarter, year]
 *     responses:
 *       200:
 *         description: Dashboard analytics retrieved successfully
 */
router.get('/dashboard', adminController.getDashboard);

/**
 * @swagger
 * /admin/analytics/{type}:
 *   get:
 *     summary: Get detailed analytics by type
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [sales, products, customers, inventory]
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 */
router.get('/analytics/:type', adminController.getAnalytics);

/**
 * @swagger
 * /admin/orders:
 *   get:
 *     summary: Get all orders for admin management
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *       - in: query
 *         name: orderNumber
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 */
router.get('/orders', adminController.getOrders);

/**
 * @swagger
 * /admin/products:
 *   get:
 *     summary: Get all products for admin management
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 */
router.get('/products', adminController.getProducts);

/**
 * @swagger
 * /admin/customers:
 *   get:
 *     summary: Get all customers for admin management
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
 */
router.get('/customers', adminController.getCustomers);

/**
 * @swagger
 * /admin/stats/orders:
 *   get:
 *     summary: Get order statistics
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Order statistics retrieved successfully
 */
router.get('/stats/orders', adminController.getOrderStats);

/**
 * @swagger
 * /admin/stats/system:
 *   get:
 *     summary: Get system statistics
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: System statistics retrieved successfully
 */
router.get('/stats/system', adminController.getSystemStats);

/**
 * @swagger
 * /admin/inventory/low-stock:
 *   get:
 *     summary: Get low stock products
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Low stock products retrieved successfully
 */
router.get('/inventory/low-stock', adminController.getLowStockProducts);

/**
 * @swagger
 * /admin/activity/recent:
 *   get:
 *     summary: Get recent activity
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Recent activity retrieved successfully
 */
router.get('/activity/recent', adminController.getRecentActivity);

/**
 * @swagger
 * /admin/notifications:
 *   get:
 *     summary: Get admin notifications
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 */
router.get('/notifications', adminController.getNotifications);

/**
 * @swagger
 * /admin/reports:
 *   get:
 *     summary: Generate reports
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [sales, products, customers, inventory]
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Report generated successfully
 */
router.get('/reports', adminController.generateReport);

/**
 * @swagger
 * /admin/products/bulk:
 *   put:
 *     summary: Bulk update products
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *               - ids
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [activate, deactivate, delete, archive]
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bulk product update completed
 */
router.put('/products/bulk', validate(adminBulkActionSchema), adminController.bulkUpdateProducts);

/**
 * @swagger
 * /admin/inventory/bulk:
 *   put:
 *     summary: Bulk update inventory
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - updates
 *             properties:
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                     reason:
 *                       type: string
 *     responses:
 *       200:
 *         description: Bulk inventory update completed
 */
router.put('/inventory/bulk', validate(adminInventoryUpdateSchema), adminController.bulkUpdateInventory);

/**
 * @swagger
 * /admin/orders/bulk:
 *   put:
 *     summary: Bulk update orders
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderIds
 *               - status
 *             properties:
 *               orderIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, processing, shipped, delivered, cancelled, refunded]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bulk order update completed
 */
router.put('/orders/bulk', validate(adminOrderBulkUpdateSchema), adminController.bulkUpdateOrders);

/**
 * @swagger
 * /admin/maintenance/cleanup-carts:
 *   post:
 *     summary: Cleanup expired carts
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: daysOld
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Expired carts cleaned up successfully
 */
router.post('/maintenance/cleanup-carts', adminController.cleanupCarts);

export default router;