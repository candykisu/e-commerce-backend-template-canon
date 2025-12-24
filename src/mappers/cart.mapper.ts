import { Cart, CartItem } from '../models/ecommerce.schema';

// Type definitions for DTOs
export interface CartDto {
  id: number;
  userId: string | null;
  sessionId: string | null;
  items: CartItemDto[];
  itemCount: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItemDto {
  id: number;
  cartId: number;
  productId: number;
  variantId: number | null;
  quantity: number;
  price: number;
  total: number;
  product: {
    id: number;
    name: string;
    slug: string;
    sku: string;
    images: string[] | null;
    status: string;
    quantity: number | null;
    trackQuantity: boolean | null;
    allowBackorder: boolean | null;
  } | null;
  variant: {
    id: number;
    sku: string;
    price: number | null;
    quantity: number | null;
    attributes: any;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartMinimalDto {
  id: number;
  userId: string | null;
  sessionId: string | null;
  itemCount: number;
  totalAmount: number;
  updatedAt: Date;
}

export interface CheckoutSummaryDto {
  cartId: number;
  items: {
    productId: number;
    productName: string;
    variantId: number | null;
    quantity: number;
    price: number;
    total: number;
    sku: string;
    image: string | null;
  }[];
  itemCount: number;
  subtotal: number;
  estimatedTotal: number;
}

export interface CartValidationDto {
  isValid: boolean;
  errors: string[];
  cart: CartDto;
  summary: CheckoutSummaryDto | null;
}

export interface CartStatusInfo {
  status: 'empty' | 'valid' | 'has_issues';
  message: string;
  itemCount: number;
  totalAmount: number;
}

/**
 * Converts a Cart object to a DTO
 */
export const toCartDto = (cart: any): CartDto => {
  return {
    id: cart.id,
    userId: cart.userId,
    sessionId: cart.sessionId,
    items: cart.items?.map(toCartItemDto) || [],
    itemCount: cart.itemCount || cart.items?.length || 0,
    totalAmount: cart.totalAmount || 0,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
};

/**
 * Converts a CartItem object to a DTO
 */
export const toCartItemDto = (item: any): CartItemDto => {
  return {
    id: item.id,
    cartId: item.cartId,
    productId: item.productId,
    variantId: item.variantId,
    quantity: item.quantity,
    price: parseFloat(item.price),
    total: parseFloat(item.price) * item.quantity,
    product: item.product ? {
      id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      sku: item.product.sku,
      images: item.product.images,
      status: item.product.status,
      quantity: item.product.quantity,
      trackQuantity: item.product.trackQuantity,
      allowBackorder: item.product.allowBackorder,
    } : null,
    variant: item.variant ? {
      id: item.variant.id,
      sku: item.variant.sku,
      price: item.variant.price ? parseFloat(item.variant.price) : null,
      quantity: item.variant.quantity,
      attributes: item.variant.attributes,
    } : null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

/**
 * Converts a Cart object to a minimal DTO (for quick overview)
 */
export const toCartMinimalDto = (cart: any): CartMinimalDto => {
  return {
    id: cart.id,
    userId: cart.userId,
    sessionId: cart.sessionId,
    itemCount: cart.itemCount || 0,
    totalAmount: cart.totalAmount || 0,
    updatedAt: cart.updatedAt,
  };
};

/**
 * Converts cart to checkout summary
 */
export const toCheckoutSummaryDto = (cart: any): CheckoutSummaryDto => {
  const items = cart.items?.map((item: any) => ({
    productId: item.productId,
    productName: item.product?.name || 'Unknown Product',
    variantId: item.variantId,
    quantity: item.quantity,
    price: parseFloat(item.price),
    total: parseFloat(item.price) * item.quantity,
    sku: item.product?.sku || '',
    image: item.product?.images?.[0] || null,
  })) || [];

  const subtotal = items.reduce((sum: number, item: any) => sum + item.total, 0);

  return {
    cartId: cart.id,
    items,
    itemCount: items.length,
    subtotal,
    estimatedTotal: subtotal, // Before tax and shipping
  };
};

/**
 * Get cart validation summary
 */
export const toCartValidationDto = (validation: {
  isValid: boolean;
  errors: string[];
  cart: any;
}): CartValidationDto => {
  return {
    isValid: validation.isValid,
    errors: validation.errors,
    cart: toCartDto(validation.cart),
    summary: validation.isValid ? toCheckoutSummaryDto(validation.cart) : null,
  };
};

/**
 * Format cart item for display
 */
export const formatCartItemDisplay = (item: any): string => {
  const product = item.product;
  if (!product) return 'Unknown Product';

  let display = `${product.name} (${product.sku})`;

  if (item.variant && item.variant.attributes) {
    const attrs = Object.entries(item.variant.attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    display += ` - ${attrs}`;
  }

  display += ` x ${item.quantity} = ${(parseFloat(item.price) * item.quantity).toFixed(2)}`;

  return display;
};

/**
 * Get cart status info
 */
export const getCartStatusInfo = (cart: any): CartStatusInfo => {
  const itemCount = cart.itemCount || 0;
  const totalAmount = cart.totalAmount || 0;

  if (itemCount === 0) {
    return {
      status: 'empty',
      message: 'Your cart is empty',
      itemCount,
      totalAmount,
    };
  }

  // Check for potential issues
  const hasUnavailableProducts = cart.items?.some((item: any) => 
    item.product?.status !== 'active'
  ) || false;

  const hasInventoryIssues = cart.items?.some((item: any) => 
    item.product?.trackQuantity && 
    (item.product?.quantity || 0) < item.quantity && 
    !item.product?.allowBackorder
  ) || false;

  if (hasUnavailableProducts || hasInventoryIssues) {
    return {
      status: 'has_issues',
      message: 'Some items in your cart need attention',
      itemCount,
      totalAmount,
    };
  }

  return {
    status: 'valid',
    message: `${itemCount} item${itemCount > 1 ? 's' : ''} in cart`,
    itemCount,
    totalAmount,
  };
};