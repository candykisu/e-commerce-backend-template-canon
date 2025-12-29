import { z } from 'zod';

/**
 * @swagger
 * components:
 *   schemas:
 *     Cart:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the cart
 *         userId:
 *           type: string
 *           format: uuid
 *           description: User ID (optional for guest carts)
 *         sessionId:
 *           type: string
 *           description: Session ID for guest carts
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CartItem:
 *       type: object
 *       required:
 *         - cartId
 *         - productId
 *         - quantity
 *         - price
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the cart item
 *         cartId:
 *           type: integer
 *           description: Cart ID
 *         productId:
 *           type: integer
 *           description: Product ID
 *         variantId:
 *           type: integer
 *           description: Product variant ID (optional)
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Quantity of the product
 *         price:
 *           type: number
 *           format: decimal
 *           description: Price per unit at time of adding to cart
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

export const createCartSchema = z.object({
  body: z.object({
    userId: z.string().uuid().optional(),
    sessionId: z.string().optional(),
  }),
});

export const addToCartSchema = z.object({
  body: z.object({
    productId: z.number().int().positive('Product ID is required'),
    variantId: z.number().int().positive().optional(),
    quantity: z.number().int().min(1, 'Quantity must be at least 1').max(100, 'Quantity cannot exceed 100'),
  }),
});

export const updateCartItemSchema = z.object({
  body: z.object({
    quantity: z.number().int().min(1, 'Quantity must be at least 1').max(100, 'Quantity cannot exceed 100'),
  }),
});

export const mergeCartsSchema = z.object({
  body: z.object({
    guestCartId: z.number().int().positive('Guest cart ID is required'),
    userId: z.string().uuid('Valid user ID is required'),
  }),
});

export type CreateCartInput = z.infer<typeof createCartSchema>['body'];
export type AddToCartInput = z.infer<typeof addToCartSchema>['body'];
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>['body'];
export type MergeCartsInput = z.infer<typeof mergeCartsSchema>['body'];