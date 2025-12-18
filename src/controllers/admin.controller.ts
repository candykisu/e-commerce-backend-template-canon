import { Request, Response } from 'express';
import * as adminService from '../services/admin.service';
import * as orderService from '../services/order.service';
import * as productService from '../services/product.service';
import * as userService from '../services/user.service';
import { cleanupExpiredCarts } from '../services/cart.service';
import { AdminDateRangeInput, AdminBulkActionInput, AdminInventoryUpdateInput, AdminOrderBulkUpdateInput, AdminReportInput } from '../schemas/admin.schema';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccessResponse } from '../utils/responseHandler';

/**
 * Get admin dashboard analytics
 */
export const getDashboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const dateRange = req.query as AdminDateRangeInput;
  const analytics = await adminService.getDashboardAnalytics(dateRange);

  sendSuccessResponse(res, 200, 'Dashboard analytics retrieved successfully', analytics);
});

/**
 * Get detailed analytics by type
 */
export const getAnalytics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { type } = req.params;
  const dateRange = req.query as AdminDateRangeInput;
  
  const analytics = await adminService.getDetailedAnalytics(type, dateRange);
  sendSuccessResponse(res, 200, `${type} analytics retrieved successfully`, analytics);
});

/**
 * Get all orders for admin management
 */
export const getOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;
  const paymentStatus = req.query.paymentStatus as string;
  const email = req.query.email as string;
  const orderNumber = req.query.orderNumber as string;
  const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
  const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

  const result = await orderService.getOrders(
    page, limit, undefined, status, paymentStatus, email, orderNumber, dateFrom, dateTo
  );

  sendSuccessResponse(res, 200, 'Orders retrieved successfully', result.orders, {
    page,
    limit,
    total: result.total,
    pages: Math.ceil(result.total / limit),
  });
});

/**
 * Get all products for admin management
 */
export const getProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
  const status = req.query.status as string;
  const search = req.query.search as string;

  const result = await productService.getProducts(page, limit, categoryId, status, undefined, search);

  sendSuccessResponse(res, 200, 'Products retrieved successfully', result.products, {
    page,
    limit,
    total: result.total,
    pages: Math.ceil(result.total / limit),
  });
});

/**
 * Get all customers for admin management
 */
export const getCustomers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;

  const result = await userService.getUsers(page, limit, 'customer', true, search);

  sendSuccessResponse(res, 200, 'Customers retrieved successfully', result.users, {
    page,
    limit,
    total: result.total,
    pages: Math.ceil(result.total / limit),
  });
});

/**
 * Bulk update products
 */
export const bulkUpdateProducts = asyncHandler(
  async (req: Request<object, object, AdminBulkActionInput>, res: Response): Promise<void> => {
    const result = await adminService.bulkUpdateProducts(req.body);
    sendSuccessResponse(res, 200, 'Bulk product update completed', result);
  }
);

/**
 * Bulk update inventory
 */
export const bulkUpdateInventory = asyncHandler(
  async (req: Request<object, object, AdminInventoryUpdateInput>, res: Response): Promise<void> => {
    const result = await adminService.bulkUpdateInventory(req.body);
    sendSuccessResponse(res, 200, 'Bulk inventory update completed', result);
  }
);

/**
 * Bulk update orders
 */
export const bulkUpdateOrders = asyncHandler(
  async (req: Request<object, object, AdminOrderBulkUpdateInput>, res: Response): Promise<void> => {
    const result = await adminService.bulkUpdateOrders(req.body);
    sendSuccessResponse(res, 200, 'Bulk order update completed', result);
  }
);

/**
 * Get system statistics
 */
export const getSystemStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const stats = await adminService.getSystemStats();
  sendSuccessResponse(res, 200, 'System statistics retrieved successfully', stats);
});

/**
 * Cleanup expired carts
 */
export const cleanupCarts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const daysOld = parseInt(req.query.daysOld as string) || 30;
  const deletedCount = await cleanupExpiredCarts(daysOld);

  sendSuccessResponse(res, 200, `Cleaned up ${deletedCount} expired carts`, { deletedCount });
});

/**
 * Get order statistics
 */
export const getOrderStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
  const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

  const stats = await orderService.getOrderStats(dateFrom, dateTo);
  sendSuccessResponse(res, 200, 'Order statistics retrieved successfully', stats);
});

/**
 * Get low stock products
 */
export const getLowStockProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const threshold = parseInt(req.query.threshold as string) || 10;
  
  // This would need to be implemented in product service
  const result = await productService.getProducts(1, 100, undefined, 'active');
  const lowStockProducts = result.products.filter(product => 
    product.trackQuantity && (product.quantity || 0) <= threshold
  );

  sendSuccessResponse(res, 200, 'Low stock products retrieved successfully', lowStockProducts);
});

/**
 * Generate reports
 */
export const generateReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { type, format, dateFrom, dateTo } = req.query as AdminReportInput;

  // This is a basic implementation - you'd want to expand this
  let reportData: any;

  switch (type) {
    case 'sales':
      const salesStats = await orderService.getOrderStats(
        dateFrom ? new Date(dateFrom) : undefined,
        dateTo ? new Date(dateTo) : undefined
      );
      reportData = salesStats;
      break;
    
    case 'products':
      const productStats = await productService.getProducts(1, 1000);
      reportData = productStats;
      break;
    
    case 'customers':
      const customerStats = await userService.getUsers(1, 1000, 'customer');
      reportData = customerStats;
      break;
    
    default:
      res.status(400).json({ message: 'Invalid report type' });
      return;
  }

  if (format === 'csv') {
    // Convert to CSV format
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
    
    // Basic CSV conversion (you'd want to use a proper CSV library)
    const csvData = JSON.stringify(reportData);
    res.send(csvData);
  } else {
    sendSuccessResponse(res, 200, `${type} report generated successfully`, reportData);
  }
});

/**
 * Get recent activity
 */
export const getRecentActivity = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const limit = parseInt(req.query.limit as string) || 20;

  // Get recent orders
  const recentOrders = await orderService.getOrders(1, limit);
  
  // Get recent users (last 7 days)
  const recentUsers = await userService.getUsers(1, limit);

  const activity = {
    recentOrders: recentOrders.orders.slice(0, 10),
    recentUsers: recentUsers.users.slice(0, 10),
  };

  sendSuccessResponse(res, 200, 'Recent activity retrieved successfully', activity);
});

/**
 * Get admin notifications
 */
export const getNotifications = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // This would typically come from a notifications system
  // For now, we'll generate some basic notifications based on system state
  
  const notifications = [];

  // Check for low stock
  const lowStockResult = await productService.getProducts(1, 100, undefined, 'active');
  const lowStockCount = lowStockResult.products.filter(p => 
    p.trackQuantity && (p.quantity || 0) <= 5
  ).length;

  if (lowStockCount > 0) {
    notifications.push({
      id: 1,
      type: 'warning',
      title: 'Low Stock Alert',
      message: `${lowStockCount} products are running low on stock`,
      timestamp: new Date(),
      action: '/admin/products?filter=lowstock',
    });
  }

  // Check for pending orders
  const pendingOrders = await orderService.getOrders(1, 1, undefined, 'pending');
  if (pendingOrders.total > 0) {
    notifications.push({
      id: 2,
      type: 'info',
      title: 'Pending Orders',
      message: `${pendingOrders.total} orders are pending confirmation`,
      timestamp: new Date(),
      action: '/admin/orders?status=pending',
    });
  }

  sendSuccessResponse(res, 200, 'Notifications retrieved successfully', notifications);
});