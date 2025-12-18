import { Order, OrderItem } from '../models/ecommerce.schema';

/**
 * Converts an Order object to a DTO
 */
export const toOrderDto = (order: Order & { 
  user?: any; 
  items?: any[];
  itemCount?: number;
}) => {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    userId: order.userId,
    email: order.email,
    status: order.status,
    paymentStatus: order.paymentStatus,
    subtotal: parseFloat(order.subtotal),
    taxAmount: parseFloat(order.taxAmount || '0'),
    shippingAmount: parseFloat(order.shippingAmount || '0'),
    discountAmount: parseFloat(order.discountAmount || '0'),
    total: parseFloat(order.total),
    currency: order.currency,
    shippingAddress: order.shippingAddress,
    billingAddress: order.billingAddress,
    notes: order.notes,
    user: order.user ? {
      id: order.user.id,
      firstName: order.user.firstName,
      lastName: order.user.lastName,
      email: order.user.email,
    } : null,
    items: order.items?.map(toOrderItemDto) || [],
    itemCount: order.itemCount || order.items?.length || 0,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
};

/**
 * Converts an OrderItem object to a DTO
 */
export const toOrderItemDto = (item: OrderItem & { product?: any }) => {
  return {
    id: item.id,
    orderId: item.orderId,
    productId: item.productId,
    variantId: item.variantId,
    quantity: item.quantity,
    price: parseFloat(item.price),
    total: parseFloat(item.total),
    productSnapshot: item.productSnapshot,
    product: item.product ? {
      id: item.product.id,
      name: item.product.name,
      sku: item.product.sku,
      images: item.product.images,
    } : null,
    createdAt: item.createdAt,
  };
};

/**
 * Converts an Order object to a minimal DTO (for listings)
 */
export const toOrderMinimalDto = (order: Order & { 
  user?: any;
  itemCount?: number;
}) => {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    email: order.email,
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: parseFloat(order.total),
    currency: order.currency,
    itemCount: order.itemCount || 0,
    customer: order.user ? `${order.user.firstName} ${order.user.lastName}` : 'Guest',
    createdAt: order.createdAt,
  };
};

/**
 * Converts an Order object to a customer-facing DTO (hides sensitive info)
 */
export const toOrderCustomerDto = (order: Order & { items?: any[] }) => {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    subtotal: parseFloat(order.subtotal),
    taxAmount: parseFloat(order.taxAmount || '0'),
    shippingAmount: parseFloat(order.shippingAmount || '0'),
    discountAmount: parseFloat(order.discountAmount || '0'),
    total: parseFloat(order.total),
    currency: order.currency,
    shippingAddress: order.shippingAddress,
    items: order.items?.map(item => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      price: parseFloat(item.price),
      total: parseFloat(item.total),
      productSnapshot: item.productSnapshot,
      product: item.product ? {
        name: item.product.name,
        sku: item.product.sku,
        images: item.product.images,
      } : null,
    })) || [],
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
};

/**
 * Format order address for display
 */
export const formatOrderAddress = (address: any): string => {
  if (!address) return '';
  
  const parts = [
    `${address.firstName} ${address.lastName}`,
    address.company,
    address.address1,
    address.address2,
    `${address.city}, ${address.state} ${address.postalCode}`,
    address.country,
  ].filter(Boolean);

  return parts.join('\n');
};

/**
 * Get order status display info
 */
export const getOrderStatusInfo = (status: string): { label: string; color: string; description: string } => {
  const statusMap: Record<string, { label: string; color: string; description: string }> = {
    pending: { label: 'Pending', color: 'yellow', description: 'Order received, awaiting confirmation' },
    confirmed: { label: 'Confirmed', color: 'blue', description: 'Order confirmed, preparing for processing' },
    processing: { label: 'Processing', color: 'orange', description: 'Order is being prepared' },
    shipped: { label: 'Shipped', color: 'purple', description: 'Order has been shipped' },
    delivered: { label: 'Delivered', color: 'green', description: 'Order has been delivered' },
    cancelled: { label: 'Cancelled', color: 'red', description: 'Order has been cancelled' },
    refunded: { label: 'Refunded', color: 'gray', description: 'Order has been refunded' },
  };

  return statusMap[status] || { label: status, color: 'gray', description: 'Unknown status' };
};

/**
 * Get payment status display info
 */
export const getPaymentStatusInfo = (paymentStatus: string): { label: string; color: string; description: string } => {
  const statusMap: Record<string, { label: string; color: string; description: string }> = {
    pending: { label: 'Pending', color: 'yellow', description: 'Payment is pending' },
    paid: { label: 'Paid', color: 'green', description: 'Payment completed successfully' },
    failed: { label: 'Failed', color: 'red', description: 'Payment failed' },
    refunded: { label: 'Refunded', color: 'gray', description: 'Payment has been refunded' },
  };

  return statusMap[paymentStatus] || { label: paymentStatus, color: 'gray', description: 'Unknown status' };
};