import { db } from '../db';
import { users, products, orders, categories, carts } from '../models/ecommerce.schema';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { logger } from '../utils';
import { AdminDateRangeInput, AdminBulkActionInput, AdminInventoryUpdateInput, AdminOrderBulkUpdateInput } from '../schemas/admin.schema';

/**
 * Get dashboard analytics
 */
export const getDashboardAnalytics = async (dateRange?: AdminDateRangeInput) => {
  try {
    logger.info('Fetching dashboard analytics');

    // Calculate date range
    const { dateFrom, dateTo } = getDateRange(dateRange);

    // Get basic counts
    const [
      totalOrdersResult,
      totalRevenueResult,
      totalCustomersResult,
      totalProductsResult,
      totalCategoriesResult,
    ] = await Promise.all([
      // Total orders in date range
      db.select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .where(dateFrom && dateTo ? and(gte(orders.createdAt, dateFrom), lte(orders.createdAt, dateTo)) : undefined),
      
      // Total revenue in date range
      db.select({ revenue: sql<number>`sum(${orders.total}::numeric)::float` })
        .from(orders)
        .where(and(
          eq(orders.paymentStatus, 'paid'),
          dateFrom && dateTo ? and(gte(orders.createdAt, dateFrom), lte(orders.createdAt, dateTo)) : undefined
        )),
      
      // Total customers
      db.select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.role, 'customer')),
      
      // Total products
      db.select({ count: sql<number>`count(*)::int` })
        .from(products)
        .where(eq(products.status, 'active')),
      
      // Total categories
      db.select({ count: sql<number>`count(*)::int` })
        .from(categories)
        .where(eq(categories.isActive, true)),
    ]);

    // Get recent orders
    const recentOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        email: orders.email,
        status: orders.status,
        total: orders.total,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(10);

    // Get top products (by order quantity)
    const topProducts = await db
      .select({
        productId: sql<number>`${products.id}`,
        productName: sql<string>`${products.name}`,
        totalSold: sql<number>`sum(oi.quantity)::int`,
        revenue: sql<number>`sum(oi.total::numeric)::float`,
      })
      .from(products)
      .innerJoin(sql`order_items oi`, sql`oi.product_id = ${products.id}`)
      .innerJoin(orders, sql`${orders.id} = oi.order_id`)
      .where(dateFrom && dateTo ? and(gte(orders.createdAt, dateFrom), lte(orders.createdAt, dateTo)) : undefined)
      .groupBy(products.id, products.name)
      .orderBy(sql`sum(oi.quantity) DESC`)
      .limit(10);

    // Get sales chart data (last 30 days)
    const salesChart = await db
      .select({
        date: sql<string>`DATE(${orders.createdAt})`,
        orders: sql<number>`count(*)::int`,
        revenue: sql<number>`sum(${orders.total}::numeric)::float`,
      })
      .from(orders)
      .where(and(
        gte(orders.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
        eq(orders.paymentStatus, 'paid')
      ))
      .groupBy(sql`DATE(${orders.createdAt})`)
      .orderBy(sql`DATE(${orders.createdAt})`);

    // Get order status breakdown
    const orderStatusBreakdown = await db
      .select({
        status: orders.status,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(dateFrom && dateTo ? and(gte(orders.createdAt, dateFrom), lte(orders.createdAt, dateTo)) : undefined)
      .groupBy(orders.status);

    // Get low stock products
    const lowStockProducts = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        quantity: products.quantity,
      })
      .from(products)
      .where(and(
        eq(products.status, 'active'),
        eq(products.trackQuantity, true),
        sql`${products.quantity} <= 10`
      ))
      .orderBy(products.quantity)
      .limit(10);

    return {
      summary: {
        totalOrders: totalOrdersResult[0]?.count || 0,
        totalRevenue: totalRevenueResult[0]?.revenue || 0,
        totalCustomers: totalCustomersResult[0]?.count || 0,
        totalProducts: totalProductsResult[0]?.count || 0,
        totalCategories: totalCategoriesResult[0]?.count || 0,
      },
      recentOrders: recentOrders.map(order => ({
        ...order,
        total: parseFloat(order.total),
      })),
      topProducts,
      salesChart,
      orderStatusBreakdown,
      lowStockProducts,
      dateRange: { dateFrom, dateTo },
    };
  } catch (error) {
    logger.error('Error fetching dashboard analytics:', error);
    throw error;
  }
};

/**
 * Get detailed analytics
 */
export const getDetailedAnalytics = async (type: string, dateRange?: AdminDateRangeInput) => {
  const { dateFrom, dateTo } = getDateRange(dateRange);

  switch (type) {
    case 'sales':
      return getSalesAnalytics(dateFrom, dateTo);
    case 'products':
      return getProductAnalytics();
    case 'customers':
      return getCustomerAnalytics();
    case 'inventory':
      return getInventoryAnalytics();
    default:
      throw new Error('Invalid analytics type');
  }
};

/**
 * Bulk update product status
 */
export const bulkUpdateProducts = async (bulkAction: AdminBulkActionInput) => {
  try {
    logger.info('Performing bulk product action', { action: bulkAction.action, count: bulkAction.ids.length });

    let updateData: any = { updatedAt: new Date() };

    switch (bulkAction.action) {
      case 'activate':
        updateData.status = 'active';
        break;
      case 'deactivate':
        updateData.status = 'draft';
        break;
      case 'archive':
        updateData.status = 'archived';
        break;
      default:
        throw new Error('Invalid bulk action');
    }

    const updatedProducts = await db
      .update(products)
      .set(updateData)
      .where(sql`${products.id} = ANY(${bulkAction.ids})`)
      .returning({ id: products.id, name: products.name, status: products.status });

    logger.info('Bulk product action completed', { 
      action: bulkAction.action, 
      updated: updatedProducts.length 
    });

    return {
      action: bulkAction.action,
      updatedCount: updatedProducts.length,
      updatedProducts,
    };
  } catch (error) {
    logger.error('Error performing bulk product action:', error);
    throw error;
  }
};

/**
 * Bulk update inventory
 */
export const bulkUpdateInventory = async (inventoryUpdate: AdminInventoryUpdateInput) => {
  try {
    logger.info('Performing bulk inventory update', { count: inventoryUpdate.updates.length });

    const results = [];

    for (const update of inventoryUpdate.updates) {
      const [updatedProduct] = await db
        .update(products)
        .set({ 
          quantity: update.quantity,
          updatedAt: new Date()
        })
        .where(eq(products.id, update.productId))
        .returning({ 
          id: products.id, 
          name: products.name, 
          sku: products.sku,
          quantity: products.quantity 
        });

      if (updatedProduct) {
        results.push({
          productId: update.productId,
          previousQuantity: null, // Could track this if needed
          newQuantity: update.quantity,
          product: updatedProduct,
        });
      }
    }

    logger.info('Bulk inventory update completed', { updated: results.length });

    return {
      updatedCount: results.length,
      updates: results,
    };
  } catch (error) {
    logger.error('Error performing bulk inventory update:', error);
    throw error;
  }
};

/**
 * Bulk update orders
 */
export const bulkUpdateOrders = async (orderUpdate: AdminOrderBulkUpdateInput) => {
  try {
    logger.info('Performing bulk order update', { 
      status: orderUpdate.status, 
      count: orderUpdate.orderIds.length 
    });

    const updatedOrders = await db
      .update(orders)
      .set({ 
        status: orderUpdate.status,
        notes: orderUpdate.notes,
        updatedAt: new Date()
      })
      .where(sql`${orders.id} = ANY(${orderUpdate.orderIds})`)
      .returning({ 
        id: orders.id, 
        orderNumber: orders.orderNumber, 
        status: orders.status 
      });

    logger.info('Bulk order update completed', { updated: updatedOrders.length });

    return {
      status: orderUpdate.status,
      updatedCount: updatedOrders.length,
      updatedOrders,
    };
  } catch (error) {
    logger.error('Error performing bulk order update:', error);
    throw error;
  }
};

/**
 * Get system statistics
 */
export const getSystemStats = async () => {
  try {
    const [
      dbStats,
      activeCartsCount,
      expiredCartsCount,
    ] = await Promise.all([
      // Database table sizes
      db.execute(sql`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE schemaname = 'public'
        LIMIT 10
      `),
      
      // Active carts (updated in last 7 days)
      db.select({ count: sql<number>`count(*)::int` })
        .from(carts)
        .where(gte(carts.updatedAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))),
      
      // Expired carts (older than 30 days)
      db.select({ count: sql<number>`count(*)::int` })
        .from(carts)
        .where(and(
          lte(carts.updatedAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
          sql`${carts.userId} IS NULL`
        )),
    ]);

    return {
      database: {
        tables: Array.from(dbStats) || [],
      },
      carts: {
        active: activeCartsCount[0]?.count || 0,
        expired: expiredCartsCount[0]?.count || 0,
      },
      timestamp: new Date(),
    };
  } catch (error) {
    logger.error('Error fetching system stats:', error);
    throw error;
  }
};

// Helper functions

function getDateRange(dateRange?: AdminDateRangeInput) {
  if (!dateRange) {
    return { dateFrom: undefined, dateTo: undefined };
  }

  if (dateRange.dateFrom && dateRange.dateTo) {
    return {
      dateFrom: new Date(dateRange.dateFrom),
      dateTo: new Date(dateRange.dateTo),
    };
  }

  const now = new Date();
  let dateFrom: Date;

  switch (dateRange.period) {
    case 'today':
      dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      dateFrom = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    case 'year':
      dateFrom = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      return { dateFrom: undefined, dateTo: undefined };
  }

  return { dateFrom, dateTo: now };
}

async function getSalesAnalytics(dateFrom?: Date, dateTo?: Date) {
  // Implementation for detailed sales analytics
  const conditions = [];
  if (dateFrom) conditions.push(gte(orders.createdAt, dateFrom));
  if (dateTo) conditions.push(lte(orders.createdAt, dateTo));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const salesByDay = await db
    .select({
      date: sql<string>`DATE(${orders.createdAt})`,
      orders: sql<number>`count(*)::int`,
      revenue: sql<number>`sum(${orders.total}::numeric)::float`,
    })
    .from(orders)
    .where(whereClause)
    .groupBy(sql`DATE(${orders.createdAt})`)
    .orderBy(sql`DATE(${orders.createdAt})`);

  return { salesByDay };
}

async function getProductAnalytics() {
  // Implementation for product analytics
  return { message: 'Product analytics not implemented yet' };
}

async function getCustomerAnalytics() {
  // Implementation for customer analytics
  return { message: 'Customer analytics not implemented yet' };
}

async function getInventoryAnalytics() {
  const lowStock = await db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      quantity: products.quantity,
    })
    .from(products)
    .where(and(
      eq(products.status, 'active'),
      eq(products.trackQuantity, true),
      sql`${products.quantity} <= 10`
    ))
    .orderBy(products.quantity);

  const outOfStock = await db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
    })
    .from(products)
    .where(and(
      eq(products.status, 'active'),
      eq(products.trackQuantity, true),
      eq(products.quantity, 0)
    ));

  return { lowStock, outOfStock };
}