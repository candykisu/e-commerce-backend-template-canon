import { Router } from 'express';
import * as cartController from '../controllers/cart.controller';
import { validate } from '../middlewares/validate';
import { 
  createCartSchema, 
  addToCartSchema, 
  updateCartItemSchema, 
  mergeCartsSchema 
} from '../schemas/cart.schema';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Carts
 *   description: Shopping cart management API
 */

/**
 * @swagger
 * /carts:
 *   post:
 *     summary: Create a new cart
 *     tags: [Carts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               sessionId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cart created successfully
 *       400:
 *         description: Bad request
 */
router.post('/', validate(createCartSchema), cartController.createCart);

/**
 * @swagger
 * /carts/merge:
 *   post:
 *     summary: Merge guest cart with user cart
 *     tags: [Carts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - guestCartId
 *               - userId
 *             properties:
 *               guestCartId:
 *                 type: integer
 *               userId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Carts merged successfully
 *       404:
 *         description: Cart or user not found
 */
router.post('/merge', validate(mergeCartsSchema), cartController.mergeCarts);

/**
 * @swagger
 * /carts/cleanup:
 *   post:
 *     summary: Cleanup expired guest carts (admin function)
 *     tags: [Carts]
 *     parameters:
 *       - in: query
 *         name: daysOld
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Expired carts cleaned up successfully
 */
router.post('/cleanup', cartController.cleanupExpiredCarts);

/**
 * @swagger
 * /carts/user/{userId}:
 *   get:
 *     summary: Get or create cart for user
 *     tags: [Carts]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User cart retrieved successfully
 *       404:
 *         description: User not found
 */
router.get('/user/:userId', cartController.getUserCart);

/**
 * @swagger
 * /carts/guest/{sessionId}:
 *   get:
 *     summary: Get or create cart for guest session
 *     tags: [Carts]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Guest cart retrieved successfully
 */
router.get('/guest/:sessionId', cartController.getGuestCart);

/**
 * @swagger
 * /carts/{id}:
 *   get:
 *     summary: Get cart by ID
 *     tags: [Carts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *       404:
 *         description: Cart not found
 */
router.get('/:id', cartController.getCartById);

/**
 * @swagger
 * /carts/{id}/count:
 *   get:
 *     summary: Get cart item count (for header display)
 *     tags: [Carts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cart count retrieved successfully
 */
router.get('/:id/count', cartController.getCartCount);

/**
 * @swagger
 * /carts/{id}/stats:
 *   get:
 *     summary: Get cart statistics
 *     tags: [Carts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cart statistics retrieved successfully
 *       404:
 *         description: Cart not found
 */
router.get('/:id/stats', cartController.getCartStats);

/**
 * @swagger
 * /carts/{id}/validate:
 *   get:
 *     summary: Validate cart for checkout
 *     tags: [Carts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cart is valid for checkout
 *       400:
 *         description: Cart has validation errors
 *       404:
 *         description: Cart not found
 */
router.get('/:id/validate', cartController.validateCart);

/**
 * @swagger
 * /carts/{id}/checkout-summary:
 *   get:
 *     summary: Get checkout summary
 *     tags: [Carts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Checkout summary retrieved successfully
 *       404:
 *         description: Cart not found
 */
router.get('/:id/checkout-summary', cartController.getCheckoutSummary);

/**
 * @swagger
 * /carts/{id}/prepare-order:
 *   get:
 *     summary: Prepare cart for order creation
 *     tags: [Carts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cart prepared for order
 *       400:
 *         description: Cart is empty or invalid
 *       404:
 *         description: Cart not found
 */
router.get('/:id/prepare-order', cartController.prepareForOrder);

/**
 * @swagger
 * /carts/{id}/add:
 *   post:
 *     summary: Add item to cart
 *     tags: [Carts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: integer
 *               variantId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: Item added to cart successfully
 *       400:
 *         description: Bad request or insufficient inventory
 *       404:
 *         description: Cart or product not found
 */
router.post('/:id/add', validate(addToCartSchema), cartController.addToCart);

/**
 * @swagger
 * /carts/{id}/clear:
 *   delete:
 *     summary: Clear all items from cart
 *     tags: [Carts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *       404:
 *         description: Cart not found
 */
router.delete('/:id/clear', cartController.clearCart);

/**
 * @swagger
 * /carts/items/{itemId}:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Carts]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: Cart item updated successfully
 *       400:
 *         description: Bad request or insufficient inventory
 *       404:
 *         description: Cart item not found
 */
router.put('/items/:itemId', validate(updateCartItemSchema), cartController.updateCartItem);

/**
 * @swagger
 * /carts/items/{itemId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Carts]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item removed from cart successfully
 *       404:
 *         description: Cart item not found
 */
router.delete('/items/:itemId', cartController.removeFromCart);

export default router;