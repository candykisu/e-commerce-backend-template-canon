import { Cart, CartItem } from '../models/ecommerce.schema';
import * as cartRepository from '../repositories/cart.repository';
import * as productRepository from '../repositories/product.repository';
import * as userRepository from '../repositories/user.repository';
import { CreateCartInput, AddToCartInput, UpdateCartItemInput, MergeCartsInput } from '../schemas/cart.schema';
import { NotFoundError, BadRequestError } from '../utils/ApiError';
import { error as errorMessages } from '../constants/messages';

/**
 * Create a new cart
 */
export const createCart = async (cartData: CreateCartInput): Promise<Cart> => {
  // Verify user exists if userId is provided
  if (cartData.userId) {
    const user = await userRepository.findById(cartData.userId);
    if (!user) {
      throw new BadRequestError('User not found');
    }
  }

  // Ensure either userId or sessionId is provided
  if (!cartData.userId && !cartData.sessionId) {
    throw new BadRequestError('Either userId or sessionId is required');
  }

  return cartRepository.create(cartData);
};

/**
 * Get cart by ID
 */
export const getCartById = async (cartId: string): Promise<Cart> => {
  const id = parseInt(cartId);
  if (isNaN(id)) {
    throw new BadRequestError(errorMessages.INVALID_ID('Cart'));
  }

  const cart = await cartRepository.findById(id);
  if (!cart) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Cart'));
  }
  return cart;
};

/**
 * Get or create cart for user
 */
export const getOrCreateUserCart = async (userId: string): Promise<Cart> => {
  // Verify user exists
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError(errorMessages.NOT_FOUND('User'));
  }

  // Try to find existing cart
  let cart = await cartRepository.findByUserId(userId);
  
  if (!cart) {
    // Create new cart if none exists
    cart = await cartRepository.create({ userId });
  }

  return cart;
};

/**
 * Get or create cart for guest session
 */
export const getOrCreateGuestCart = async (sessionId: string): Promise<Cart> => {
  if (!sessionId) {
    throw new BadRequestError('Session ID is required for guest cart');
  }

  // Try to find existing cart
  let cart = await cartRepository.findBySessionId(sessionId);
  
  if (!cart) {
    // Create new cart if none exists
    cart = await cartRepository.create({ sessionId });
  }

  return cart;
};

/**
 * Add item to cart
 */
export const addToCart = async (
  cartId: string,
  itemData: AddToCartInput
): Promise<CartItem> => {
  const id = parseInt(cartId);
  if (isNaN(id)) {
    throw new BadRequestError(errorMessages.INVALID_ID('Cart'));
  }

  // Verify cart exists
  const cart = await cartRepository.findById(id);
  if (!cart) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Cart'));
  }

  // Verify product exists and is available
  const product = await productRepository.findById(itemData.productId);
  if (!product) {
    throw new BadRequestError('Product not found');
  }

  if (product.status !== 'active') {
    throw new BadRequestError('Product is not available');
  }

  // Check inventory if tracking is enabled
  if (product.trackQuantity) {
    const availableQuantity = product.quantity || 0;
    if (availableQuantity < itemData.quantity && !product.allowBackorder) {
      throw new BadRequestError('Insufficient inventory');
    }
  }

  // Get current price (use variant price if available, otherwise product price)
  let price = parseFloat(product.price);
  
  if (itemData.variantId) {
    // TODO: Get variant price when product variants are implemented
    // For now, use product price
  }

  return cartRepository.addItem(id, { ...itemData, price });
};

/**
 * Update cart item quantity
 */
export const updateCartItem = async (
  itemId: string,
  updateData: UpdateCartItemInput
): Promise<CartItem> => {
  const id = parseInt(itemId);
  if (isNaN(id)) {
    throw new BadRequestError(errorMessages.INVALID_ID('Cart item'));
  }

  // Verify item exists
  const existingItem = await cartRepository.getCartItemById(id);
  if (!existingItem) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Cart item'));
  }

  // Verify product inventory if increasing quantity
  if (updateData.quantity > existingItem.quantity) {
    const product = await productRepository.findById(existingItem.productId);
    if (product && product.trackQuantity) {
      const availableQuantity = product.quantity || 0;
      const quantityIncrease = updateData.quantity - existingItem.quantity;
      
      if (availableQuantity < quantityIncrease && !product.allowBackorder) {
        throw new BadRequestError('Insufficient inventory');
      }
    }
  }

  const updatedItem = await cartRepository.updateItemQuantity(id, updateData.quantity);
  if (!updatedItem) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Cart item'));
  }
  return updatedItem;
};

/**
 * Remove item from cart
 */
export const removeFromCart = async (itemId: string): Promise<boolean> => {
  const id = parseInt(itemId);
  if (isNaN(id)) {
    throw new BadRequestError(errorMessages.INVALID_ID('Cart item'));
  }

  const success = await cartRepository.removeItem(id);
  if (!success) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Cart item'));
  }
  return true;
};

/**
 * Clear all items from cart
 */
export const clearCart = async (cartId: string): Promise<boolean> => {
  const id = parseInt(cartId);
  if (isNaN(id)) {
    throw new BadRequestError(errorMessages.INVALID_ID('Cart'));
  }

  // Verify cart exists
  const cart = await cartRepository.findById(id);
  if (!cart) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Cart'));
  }

  return cartRepository.clearCart(id);
};

/**
 * Merge guest cart with user cart (when user logs in)
 */
export const mergeCarts = async (mergeData: MergeCartsInput): Promise<Cart> => {
  // Verify user exists
  const user = await userRepository.findById(mergeData.userId);
  if (!user) {
    throw new NotFoundError(errorMessages.NOT_FOUND('User'));
  }

  // Verify guest cart exists
  const guestCart = await cartRepository.findById(mergeData.guestCartId);
  if (!guestCart) {
    throw new NotFoundError('Guest cart not found');
  }

  // Get or create user cart
  let userCart = await cartRepository.findByUserId(mergeData.userId);
  if (!userCart) {
    userCart = await cartRepository.create({ userId: mergeData.userId });
  }

  // Merge carts
  await cartRepository.mergeCarts(mergeData.guestCartId, userCart.id);

  // Return updated user cart
  const updatedCart = await cartRepository.findById(userCart.id);
  if (!updatedCart) {
    throw new NotFoundError('Failed to retrieve merged cart');
  }
  return updatedCart;
};

/**
 * Get cart statistics
 */
export const getCartStats = async (cartId: string): Promise<{
  itemCount: number;
  totalAmount: number;
  uniqueProducts: number;
}> => {
  const id = parseInt(cartId);
  if (isNaN(id)) {
    throw new BadRequestError(errorMessages.INVALID_ID('Cart'));
  }

  return cartRepository.getCartStats(id);
};

/**
 * Validate cart for checkout
 */
export const validateCartForCheckout = async (cartId: string): Promise<{
  isValid: boolean;
  errors: string[];
  cart: Cart;
}> => {
  const id = parseInt(cartId);
  if (isNaN(id)) {
    throw new BadRequestError(errorMessages.INVALID_ID('Cart'));
  }

  const cart = await cartRepository.findById(id);
  if (!cart) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Cart'));
  }

  const errors: string[] = [];

  // Check if cart has items
  if (!cart.items || cart.items.length === 0) {
    errors.push('Cart is empty');
  }

  // Validate each item
  if (cart.items) {
    for (const item of cart.items) {
      const product = item.product;
      if (!product) {
        errors.push(`Product not found for item ${item.id}`);
        continue;
      }

      // Check if product is still active
      if (product.status !== 'active') {
        errors.push(`Product "${product.name}" is no longer available`);
      }

      // Check inventory
      if (product.trackQuantity) {
        const availableQuantity = product.quantity || 0;
        if (availableQuantity < item.quantity && !product.allowBackorder) {
          errors.push(`Insufficient inventory for "${product.name}". Available: ${availableQuantity}, Requested: ${item.quantity}`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    cart,
  };
};

/**
 * Cleanup expired guest carts
 */
export const cleanupExpiredCarts = async (daysOld: number = 30): Promise<number> => {
  return cartRepository.cleanupExpiredCarts(daysOld);
};

/**
 * Convert cart to order format
 */
export const prepareCartForOrder = async (cartId: string): Promise<{
  items: Array<{
    productId: number;
    variantId?: number;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
}> => {
  const cart = await cartRepository.findById(parseInt(cartId));
  
  if (!cart || !cart.items || cart.items.length === 0) {
    throw new BadRequestError('Cart is empty');
  }

  const items = cart.items.map((item: any) => ({
    productId: item.productId,
    variantId: item.variantId || undefined,
    quantity: item.quantity,
    price: parseFloat(item.price),
  }));

  const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

  return { items, subtotal };
};