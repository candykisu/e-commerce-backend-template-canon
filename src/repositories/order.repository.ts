import { eq, and, desc, sql, like, or, gte, lte, inArray } from 'drizzle-orm';
import { db } from '../db';
import { orders, orderItems, NewOrder, NewOrderItem, products, users } from '../models/ecommerce.schema';
import { logger } from '../utils';
import { CreateOrderInput, UpdateOrderInput, OrderItemInput } from '../schemas/order.schema';

// Generate unique order number
const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp.slice(-6)}${random}`;
};

export const create = async (orderData: CreateOrderInput): Promise<typeof orders.$inferSelect> => {
  try {
    logger.info('Creating new order in repository', { 
      email: orderData.email,
      total: orderData.total,
      itemCount: orderData.items.length
    });

    const orderNumber = generateOrderNumber();

    const newOrder: NewOrder = {
      orderNumber,
      userId: orderData.userId,
      email: orderData.email,
      subtotal: orderData.subtotal.toString(),
      taxAmount: orderData.taxAmount.toString(),
      shippingAmount: orderData.shippingAmount.toString(),
      discountAmount: orderData.discountAmount.toString(),
      total: orderData.total.toString(),
      currency: orderData.currency,
      shippingAddress: orderData.shippingAddress,
      billingAddress: orderData.billingAddress,
      notes: orderData.notes,
      status: 'pending',
      paymentStatus: 'pending',
    };

    const [savedOrder] = await db.insert(orders).values(newOrder).returning();

    // Create order items
    const orderItemsData: NewOrderItem[] = orderData.items.map(item => ({
      orderId: savedOrder.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      price: item.price.toString(),
      total: (item.quantity * item.price).toString(),
      productSnapshot: {
        name: '', // Will be populated by service layer
        sku: '',
        image: '',
        attributes: {},
      },
    }));

    await db.insert(orderItems).values(orderItemsData);

    logger.info('Order created successfully in repository', { 
      orderId: savedOrder.id,
      orderNumber: savedOrder.orderNumber
    });
    return savedOrder;
  } catch (error) {
    logger.error('Error creating order in repository:', error);
    throw error;
  }
};

export const find = async (
  page: number = 1,
  limit: number = 10,
  userId?: string,
  status?: string,
  paymentStatus?: string,
  email?: string,
  orderNumber?: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<{
  orders: (typeof orders.$inferSelect & { 
    user?: { id: string; firstName: string; lastName: string; email: string } | null;
    itemCount?: number;
  })[];
  total: number;
}> => {
  try {
    const offset = (page - 1) * limit;
    const conditions = [];

    if (userId) conditions.push(eq(orders.userId, userId));
    if (status) conditions.push(eq(orders.status, status));
    if (paymentStatus) conditions.push(eq(orders.paymentStatus, paymentStatus));
    if (email) conditions.push(like(orders.email, `%${email}%`));
    if (orderNumber) conditions.push(like(orders.orderNumber, `%${orderNumber}%`));
    if (dateFrom) conditions.push(gte(orders.createdAt, dateFrom));
    if (dateTo) conditions.push(lte(orders.createdAt, dateTo));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [resultOrders, totalResult] = await Promise.all([
      db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          userId: orders.userId,
          email: orders.email,
          status: orders.status,
          paymentStatus: orders.paymentStatus,
          subtotal: orders.subtotal,
          taxAmount: orders.taxAmount,
          shippingAmount: orders.shippingAmount,
          discountAmount: orders.discountAmount,
          total: orders.total,
          currency: orders.currency,
          shippingAddress: orders.shippingAddress,
          billingAddress: orders.billingAddress,
          notes: orders.notes,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          },
          itemCount: sql<number>`(
            SELECT COUNT(*)::int 
            FROM ${orderItems} 
            WHERE ${orderItems.orderId} = ${orders.id}
          )`,
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(orders.createdAt)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    logger.info('Orders retrieved successfully from repository', {
      count: resultOrders.length,
      page,
      limit,
    });
    return { orders: resultOrders, total };
  } catch (error) {
    logger.error('Error retrieving orders from repository:', error);
    throw error;
  }
};

type OrderWithDetails = typeof orders.$inferSelect & {
  user?: { id: string; firstName: string; lastName: string; email: string } | null;
  items?: (typeof orderItems.$inferSelect & {
    product?: { id: number; name: string; sku: string; images: string[] | null } | null;
  })[];
};

export const findById = async (orderId: number): Promise<OrderWithDetails | null> => {
  try {
    const [order] = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        userId: orders.userId,
        email: orders.email,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        subtotal: orders.subtotal,
        taxAmount: orders.taxAmount,
        shippingAmount: orders.shippingAmount,
        discountAmount: orders.discountAmount,
        total: orders.total,
        currency: orders.currency,
        shippingAddress: orders.shippingAddress,
        billingAddress: orders.billingAddress,
        notes: orders.notes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(eq(orders.id, orderId));

    if (!order) {
      logger.warn('Order not found in repository', { orderId });
      return null;
    }

    // Get order items
    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        variantId: orderItems.variantId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        total: orderItems.total,
        productSnapshot: orderItems.productSnapshot,
        createdAt: orderItems.createdAt,
        product: {
          id: products.id,
          name: products.name,
          sku: products.sku,
          images: products.images,
        },
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

    logger.info('Order retrieved successfully from repository', { orderId });
    return { ...order, items };
  } catch (error) {
    logger.error('Error retrieving order from repository:', error);
    throw error;
  }
};

export const findByOrderNumber = async (orderNumber: string): Promise<typeof orders.$inferSelect | null> => {
  try {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber));

    return order || null;
  } catch (error) {
    logger.error('Error finding order by number:', error);
    throw error;
  }
};

export const update = async (
  orderId: number,
  updateData: UpdateOrderInput
): Promise<typeof orders.$inferSelect | null> => {
  try {
    const updateValues: Partial<NewOrder> = {
      ...updateData,
      updatedAt: new Date(),
    };

    const [order] = await db
      .update(orders)
      .set(updateValues)
      .where(eq(orders.id, orderId))
      .returning();

    if (!order) {
      logger.warn('Order not found for update in repository', { orderId });
      return null;
    }

    logger.info('Order updated successfully in repository', { orderId });
    return order;
  } catch (error) {
    logger.error('Error updating order in repository:', error);
    throw error;
  }
};

export const updateStatus = async (
  orderId: number,
  status: string,
  notes?: string
): Promise<boolean> => {
  try {
    const updateData: Partial<NewOrder> = {
      status,
      updatedAt: new Date(),
    };

    if (notes) {
      updateData.notes = notes;
    }

    const [order] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId))
      .returning({ id: orders.id });

    if (!order) {
      logger.warn('Order not found for status update', { orderId });
      return false;
    }

    logger.info('Order status updated successfully', { orderId, status });
    return true;
  } catch (error) {
    logger.error('Error updating order status:', error);
    throw error;
  }
};

export const updatePaymentStatus = async (
  orderId: number,
  paymentStatus: string,
  notes?: string
): Promise<boolean> => {
  try {
    const updateData: Partial<NewOrder> = {
      paymentStatus,
      updatedAt: new Date(),
    };

    if (notes) {
      updateData.notes = notes;
    }

    const [order] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId))
      .returning({ id: orders.id });

    if (!order) {
      logger.warn('Order not found for payment status update', { orderId });
      return false;
    }

    logger.info('Order payment status updated successfully', { orderId, paymentStatus });
    return true;
  } catch (error) {
    logger.error('Error updating order payment status:', error);
    throw error;
  }
};

export const getOrdersByUser = async (
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  orders: typeof orders.$inferSelect[];
  total: number;
}> => {
  try {
    const offset = (page - 1) * limit;

    const [userOrders, totalResult] = await Promise.all([
      db
        .select()
        .from(orders)
        .where(eq(orders.userId, userId))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(orders.createdAt)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.userId, userId)),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    logger.info('User orders retrieved successfully', { userId, count: userOrders.length });
    return { orders: userOrders, total };
  } catch (error) {
    logger.error('Error retrieving user orders:', error);
    throw error;
  }
};

export const getOrderStats = async (dateFrom?: Date, dateTo?: Date): Promise<{
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
}> => {
  try {
    const conditions = [];
    if (dateFrom) conditions.push(gte(orders.createdAt, dateFrom));
    if (dateTo) conditions.push(lte(orders.createdAt, dateTo));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [statsResult] = await db
      .select({
        totalOrders: sql<number>`count(*)::int`,
        totalRevenue: sql<number>`sum(${orders.total}::numeric)::float`,
        averageOrderValue: sql<number>`avg(${orders.total}::numeric)::float`,
      })
      .from(orders)
      .where(whereClause);

    const statusStats = await db
      .select({
        status: orders.status,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(whereClause)
      .groupBy(orders.status);

    const ordersByStatus = statusStats.reduce((acc, stat) => {
      acc[stat.status] = stat.count;
      return acc;
    }, {} as Record<string, number>);

    logger.info('Order stats retrieved successfully');
    return {
      totalOrders: statsResult.totalOrders || 0,
      totalRevenue: statsResult.totalRevenue || 0,
      averageOrderValue: statsResult.averageOrderValue || 0,
      ordersByStatus,
    };
  } catch (error) {
    logger.error('Error retrieving order stats:', error);
    throw error;
  }
};