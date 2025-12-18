import { Order } from '../models/ecommerce.schema';
import * as orderRepository from '../repositories/order.repository';
import * as productRepository from '../repositories/product.repository';
import * as userRepository from '../repositories/user.repository';
import { CreateOrderInput, UpdateOrderInput, UpdateOrderStatusInput, UpdatePaymentStatusInput } from '../schemas/order.schema';
import { NotFoundError, BadRequestError } from '../utils/ApiError';
import { error as errorMessages } from '../constants/messages';

/**
 * Create a new order
 */
export const createOrder = async (orderData: CreateOrderInput): Promise<Order> => {
  // Verify user exists if userId is provided
  if (orderData.userId) {
    const user = await userRepository.findById(orderData.userId);
    if (!user) {
      throw new BadRequestError('User not found');
    }
  }

  // Verify all products exist and have sufficient inventory
  for (const item of orderData.items) {
    const product = await productRepository.findById(item.productId);
    if (!product) {
      throw new BadRequestError(`Product with ID ${item.productId} not found`);
    }

    if (product.status !== 'active') {
      throw new BadRequestError(`Product "${product.name}" is not available`);
    }

    if (product.trackQuantity && (product.quantity || 0) < item.quantity) {
      if (!product.allowBackorder) {
        throw new BadRequestError(`Insufficient inventory for product "${product.name}"`);
      }
    }
  }

  // Validate order totals
  const calculatedSubtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const calculatedTotal = calculatedSubtotal + orderData.taxAmount + orderData.shippingAmount - orderData.discountAmount;

  if (Math.abs(calculatedSubtotal - orderData.subtotal) > 0.01) {
    throw new BadRequestError('Subtotal calculation mismatch');
  }

  if (Math.abs(calculatedTotal - orderData.total) > 0.01) {
    throw new BadRequestError('Total calculation mismatch');
  }

  return orderRepository.create(orderData);
};

/**
 * Get all orders with pagination and filtering
 */
export const getOrders = async (
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
  orders: Order[];
  total: number;
}> => {
  return orderRepository.find(page, limit, userId, status, paymentStatus, email, orderNumber, dateFrom, dateTo);
};

/**
 * Get order by ID
 */
export const getOrderById = async (orderId: string): Promise<Order> => {
  const id = parseInt(orderId);
  if (isNaN(id)) {
    throw new BadRequestError(errorMessages.INVALID_ID('Order'));
  }

  const order = await orderRepository.findById(id);
  if (!order) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Order'));
  }
  return order;
};

/**
 * Get order by order number
 */
export const getOrderByNumber = async (orderNumber: string): Promise<Order> => {
  const order = await orderRepository.findByOrderNumber(orderNumber);
  if (!order) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Order'));
  }
  return order;
};

/**
 * Update order
 */
export const updateOrder = async (
  orderId: string,
  updateData: UpdateOrderInput
): Promise<Order> => {
  const id = parseInt(orderId);
  if (isNaN(id)) {
    throw new BadRequestError(errorMessages.INVALID_ID('Order'));
  }

  const order = await orderRepository.update(id, updateData);
  if (!order) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Order'));
  }
  return order;
};

/**
 * Update order status
 */
export const updateOrderStatus = async (
  orderId: string,
  statusData: UpdateOrderStatusInput
): Promise<boolean> => {
  const id = parseInt(orderId);
  if (isNaN(id)) {
    throw new BadRequestError(errorMessages.INVALID_ID('Order'));
  }

  // Verify order exists
  const existingOrder = await orderRepository.findById(id);
  if (!existingOrder) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Order'));
  }

  // Validate status transition (basic validation)
  const validTransitions: Record<string, string[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: ['refunded'],
    cancelled: [],
    refunded: [],
  };

  const currentStatus = existingOrder.status;
  const newStatus = statusData.status;

  if (currentStatus !== newStatus && !validTransitions[currentStatus]?.includes(newStatus)) {
    throw new BadRequestError(`Cannot change order status from ${currentStatus} to ${newStatus}`);
  }

  const success = await orderRepository.updateStatus(id, statusData.status, statusData.notes);
  if (!success) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Order'));
  }
  return true;
};

/**
 * Update payment status
 */
export const updatePaymentStatus = async (
  orderId: string,
  paymentData: UpdatePaymentStatusInput
): Promise<boolean> => {
  const id = parseInt(orderId);
  if (isNaN(id)) {
    throw new BadRequestError(errorMessages.INVALID_ID('Order'));
  }

  const success = await orderRepository.updatePaymentStatus(id, paymentData.paymentStatus, paymentData.notes);
  if (!success) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Order'));
  }
  return true;
};

/**
 * Get orders for a specific user
 */
export const getUserOrders = async (
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  orders: Order[];
  total: number;
}> => {
  // Verify user exists
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError(errorMessages.NOT_FOUND('User'));
  }

  return orderRepository.getOrdersByUser(userId, page, limit);
};

/**
 * Cancel order
 */
export const cancelOrder = async (orderId: string, reason?: string): Promise<boolean> => {
  const id = parseInt(orderId);
  if (isNaN(id)) {
    throw new BadRequestError(errorMessages.INVALID_ID('Order'));
  }

  // Verify order exists and can be cancelled
  const existingOrder = await orderRepository.findById(id);
  if (!existingOrder) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Order'));
  }

  if (!['pending', 'confirmed'].includes(existingOrder.status)) {
    throw new BadRequestError('Order cannot be cancelled in current status');
  }

  const notes = reason ? `Cancelled: ${reason}` : 'Order cancelled';
  const success = await orderRepository.updateStatus(id, 'cancelled', notes);
  if (!success) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Order'));
  }
  return true;
};

/**
 * Get order statistics
 */
export const getOrderStats = async (dateFrom?: Date, dateTo?: Date): Promise<{
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
}> => {
  return orderRepository.getOrderStats(dateFrom, dateTo);
};

/**
 * Process order (confirm and update inventory)
 */
export const processOrder = async (orderId: string): Promise<boolean> => {
  const id = parseInt(orderId);
  if (isNaN(id)) {
    throw new BadRequestError(errorMessages.INVALID_ID('Order'));
  }

  // Get order with items
  const order = await orderRepository.findById(id);
  if (!order) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Order'));
  }

  if (order.status !== 'pending') {
    throw new BadRequestError('Order is not in pending status');
  }

  // Update inventory for each item
  if (order.items) {
    for (const item of order.items) {
      const product = await productRepository.findById(item.productId);
      if (product && product.trackQuantity) {
        const currentQuantity = product.quantity || 0;
        const newQuantity = Math.max(0, currentQuantity - item.quantity);
        await productRepository.updateInventory(item.productId, newQuantity);
      }
    }
  }

  // Update order status to confirmed
  const success = await orderRepository.updateStatus(id, 'confirmed', 'Order processed and inventory updated');
  if (!success) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Order'));
  }
  return true;
};