import { Request, Response } from 'express';
import * as cartService from '../services/cart.service';
import { toCartDto, toCartValidationDto, toCheckoutSummaryDto } from '../mappers/cart.mapper';
import { asyncHandler } from '../utils/asyncHandler';
import { success } from '../constants/messages';
import { sendSuccessResponse } from '../utils/responseHandler';
import { CreateCartInput, AddToCartInput, UpdateCartItemInput, MergeCartsInput } from '../schemas/cart.schema';

/**
 * Create a new cart
 */
export const createCart = asyncHandler(
  async (req: Request<object, object, CreateCartInput>, res: Response): Promise<void> => {
    const cart = await cartService.createCart(req.body);
    const cartDto = toCartDto(cart);

    sendSuccessResponse(res, 201, success.CREATED('Cart'), cartDto);
  }
);

/**
 * Get cart by ID
 */
export const getCartById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const cart = await cartService.getCartById(id);
  const cartDto = toCartDto(cart);

  sendSuccessResponse(res, 200, success.FETCHED('Cart'), cartDto);
});

/**
 * Get or create cart for user
 */
export const getUserCart = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const cart = await cartService.getOrCreateUserCart(userId);
  const cartDto = toCartDto(cart);

  sendSuccessResponse(res, 200, success.FETCHED('User cart'), cartDto);
});

/**
 * Get or create cart for guest session
 */
export const getGuestCart = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { sessionId } = req.params;
  const cart = await cartService.getOrCreateGuestCart(sessionId);
  const cartDto = toCartDto(cart);

  sendSuccessResponse(res, 200, success.FETCHED('Guest cart'), cartDto);
});

/**
 * Add item to cart
 */
export const addToCart = asyncHandler(
  async (req: Request<{ id: string }, object, AddToCartInput>, res: Response): Promise<void> => {
    const { id } = req.params;
    await cartService.addToCart(id, req.body);
    
    // Get updated cart
    const cart = await cartService.getCartById(id);
    const cartDto = toCartDto(cart);

    sendSuccessResponse(res, 200, 'Item added to cart successfully', cartDto);
  }
);

/**
 * Update cart item quantity
 */
export const updateCartItem = asyncHandler(
  async (req: Request<{ itemId: string }, object, UpdateCartItemInput>, res: Response): Promise<void> => {
    const { itemId } = req.params;
    await cartService.updateCartItem(itemId, req.body);

    sendSuccessResponse(res, 200, 'Cart item updated successfully');
  }
);

/**
 * Remove item from cart
 */
export const removeFromCart = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { itemId } = req.params;
  await cartService.removeFromCart(itemId);

  sendSuccessResponse(res, 200, 'Item removed from cart successfully');
});

/**
 * Clear all items from cart
 */
export const clearCart = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  await cartService.clearCart(id);

  sendSuccessResponse(res, 200, 'Cart cleared successfully');
});

/**
 * Merge guest cart with user cart
 */
export const mergeCarts = asyncHandler(
  async (req: Request<object, object, MergeCartsInput>, res: Response): Promise<void> => {
    const cart = await cartService.mergeCarts(req.body);
    const cartDto = toCartDto(cart);

    sendSuccessResponse(res, 200, 'Carts merged successfully', cartDto);
  }
);

/**
 * Get cart statistics
 */
export const getCartStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const stats = await cartService.getCartStats(id);

  sendSuccessResponse(res, 200, success.FETCHED('Cart statistics'), stats);
});

/**
 * Validate cart for checkout
 */
export const validateCart = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const validation = await cartService.validateCartForCheckout(id);
  const validationDto = toCartValidationDto(validation);

  const statusCode = validation.isValid ? 200 : 400;
  const message = validation.isValid ? 'Cart is valid for checkout' : 'Cart has validation errors';

  res.status(statusCode).json({
    success: validation.isValid,
    message,
    data: validationDto,
  });
});

/**
 * Get checkout summary
 */
export const getCheckoutSummary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const cart = await cartService.getCartById(id);
  const summaryDto = toCheckoutSummaryDto(cart);

  sendSuccessResponse(res, 200, success.FETCHED('Checkout summary'), summaryDto);
});

/**
 * Prepare cart for order
 */
export const prepareForOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const orderData = await cartService.prepareCartForOrder(id);

  sendSuccessResponse(res, 200, 'Cart prepared for order', orderData);
});

/**
 * Get cart count (minimal response for header display)
 */
export const getCartCount = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const stats = await cartService.getCartStats(id);

  res.json({
    success: true,
    data: {
      itemCount: stats.itemCount,
      totalAmount: stats.totalAmount,
    },
  });
});

/**
 * Cleanup expired carts (admin function)
 */
export const cleanupExpiredCarts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const daysOld = parseInt(req.query.daysOld as string) || 30;
  const deletedCount = await cartService.cleanupExpiredCarts(daysOld);

  sendSuccessResponse(res, 200, `Cleaned up ${deletedCount} expired carts`, { deletedCount });
});