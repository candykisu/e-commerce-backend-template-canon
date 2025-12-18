import { Request, Response } from 'express';
import * as orderService from '../services/order.service';
import { toOrderDto, toOrderMinimalDto, toOrderCustomerDto } from '../mappers/order.mapper';
import { CreateOrderInput, UpdateOrderInput, UpdateOrderStatusInput, UpdatePaymentStatusInput } from '../schemas/order.schema';
import { asyncHandler } from '../utils/asyncHandler';
import { success as successMessages } from '../constants/messages';
import { sendSuccessResponse } from '../utils/responseHandler';

/**
 * Create a new order
 */
export const createOrder = asyncHandler(
  async (req: Request<object, object, CreateOrderInput>, res: Response): Promise<void> => {
    const order = await orderService.createOrder(req.body);
    const orderDto = toOrderDto(order);

    sendSuccessResponse(res, 201, successMessages.CREATED('Order'), orderDto);
  }
);

/**
 * Get all orders with pagination and filtering
 */
export const getOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const userId = req.query.userId as string;
  const status = req.query.status as string;
  const paymentStatus = req.query.paymentStatus as string;
  const email = req.query.email as string;
  const orderNumber = req.query.orderNumber as string;
  const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
  const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

  const result = await orderService.getOrders(
    page, limit, userId, status, paymentStatus, email, orderNumber, dateFrom, dateTo
  );
  const ordersDto = result.orders.map(toOrderMinimalDto);

  sendSuccessResponse(res, 200, successMessages.FETCHED('Orders'), ordersDto, {
    page,
    limit,
    total: result.total,
    pages: Math.ceil(result.total / limit),
  });
});

/**
 * Get order by ID
 */
export const getOrderById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const order = await orderService.getOrderById(id);
  const orderDto = toOrderDto(order);

  sendSuccessResponse(res, 200, successMessages.FETCHED('Order'), orderDto);
});

/**
 * Get order by order number
 */
export const getOrderByNumber = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { orderNumber } = req.params;
  const order = await orderService.getOrderByNumber(orderNumber);
  const orderDto = toOrderCustomerDto(order);

  sendSuccessResponse(res, 200, successMessages.FETCHED('Order'), orderDto);
});

/**
 * Update order
 */
export const updateOrder = asyncHandler(
  async (req: Request<{ id: string }, object, UpdateOrderInput>, res: Response): Promise<void> => {
    const { id } = req.params;
    const order = await orderService.updateOrder(id, req.body);
    const orderDto = toOrderDto(order);

    sendSuccessResponse(res, 200, successMessages.UPDATED('Order'), orderDto);
  }
);

/**
 * Update order status
 */
export const updateOrderStatus = asyncHandler(
  async (req: Request<{ id: string }, object, UpdateOrderStatusInput>, res: Response): Promise<void> => {
    const { id } = req.params;
    await orderService.updateOrderStatus(id, req.body);

    sendSuccessResponse(res, 200, 'Order status updated successfully');
  }
);

/**
 * Update payment status
 */
export const updatePaymentStatus = asyncHandler(
  async (req: Request<{ id: string }, object, UpdatePaymentStatusInput>, res: Response): Promise<void> => {
    const { id } = req.params;
    await orderService.updatePaymentStatus(id, req.body);

    sendSuccessResponse(res, 200, 'Payment status updated successfully');
  }
);

/**
 * Get orders for a specific user
 */
export const getUserOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await orderService.getUserOrders(userId, page, limit);
  const ordersDto = result.orders.map(toOrderCustomerDto);

  sendSuccessResponse(res, 200, successMessages.FETCHED('User orders'), ordersDto, {
    page,
    limit,
    total: result.total,
    pages: Math.ceil(result.total / limit),
  });
});

/**
 * Cancel order
 */
export const cancelOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { reason } = req.body;

  await orderService.cancelOrder(id, reason);
  sendSuccessResponse(res, 200, 'Order cancelled successfully');
});

/**
 * Process order (confirm and update inventory)
 */
export const processOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  await orderService.processOrder(id);

  sendSuccessResponse(res, 200, 'Order processed successfully');
});

/**
 * Get order statistics
 */
export const getOrderStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
  const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

  const stats = await orderService.getOrderStats(dateFrom, dateTo);
  sendSuccessResponse(res, 200, successMessages.FETCHED('Order statistics'), stats);
});

/**
 * Get orders by status
 */
export const getOrdersByStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { status } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await orderService.getOrders(page, limit, undefined, status);
  const ordersDto = result.orders.map(toOrderMinimalDto);

  sendSuccessResponse(res, 200, successMessages.FETCHED(`${status} orders`), ordersDto, {
    page,
    limit,
    total: result.total,
    pages: Math.ceil(result.total / limit),
  });
});

/**
 * Search orders
 */
export const searchOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { q } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  if (!q || typeof q !== 'string') {
    res.status(400).json({ message: 'Search query is required' });
    return;
  }

  // Search by order number or email
  const result = await orderService.getOrders(page, limit, undefined, undefined, undefined, q, q);
  const ordersDto = result.orders.map(toOrderMinimalDto);

  sendSuccessResponse(res, 200, successMessages.FETCHED('Orders'), ordersDto, {
    page,
    limit,
    total: result.total,
    pages: Math.ceil(result.total / limit),
  });
});