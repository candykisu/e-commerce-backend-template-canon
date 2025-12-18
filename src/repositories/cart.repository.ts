import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../db';
import { carts, cartItems, NewCart, NewCartItem, products, productVariants } from '../models/ecommerce.schema';
import { logger } from '../utils';
import { CreateCartInput, AddToCartInput } from '../schemas/cart.schema';

// Type for cart with items and product details
type CartWithItems = typeof carts.$inferSelect & {
  items?: (typeof cartItems.$inferSelect & {
    product?: {
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
    variant?: {
      id: number;
      sku: string;
      price: string | null;
      quantity: number | null;
      attributes: any;
    } | null;
  })[];
  itemCount?: number;
  totalAmount?: number;
};

export const create = async (cartData: CreateCartInput): Promise<typeof carts.$inferSelect> => {
  try {
    logger.info('Creating new cart in repository', { 
      userId: cartData.userId,
      sessionId: cartData.sessionId 
    });

    const newCart: NewCart = {
      userId: cartData.userId,
      sessionId: cartData.sessionId,
    };

    const [savedCart] = await db.insert(carts).values(newCart).returning();

    logger.info('Cart created successfully in repository', { cartId: savedCart.id });
    return savedCart;
  } catch (error) {
    logger.error('Error creating cart in repository:', error);
    throw error;
  }
};

export const findById = async (cartId: number): Promise<CartWithItems | null> => {
  try {
    const [cart] = await db
      .select()
      .from(carts)
      .where(eq(carts.id, cartId));

    if (!cart) {
      logger.warn('Cart not found in repository', { cartId });
      return null;
    }

    // Get cart items with product details
    const items = await db
      .select({
        id: cartItems.id,
        cartId: cartItems.cartId,
        productId: cartItems.productId,
        variantId: cartItems.variantId,
        quantity: cartItems.quantity,
        price: cartItems.price,
        createdAt: cartItems.createdAt,
        updatedAt: cartItems.updatedAt,
        product: {
          id: products.id,
          name: products.name,
          slug: products.slug,
          sku: products.sku,
          images: products.images,
          status: products.status,
          quantity: products.quantity,
          trackQuantity: products.trackQuantity,
          allowBackorder: products.allowBackorder,
        },
        variant: {
          id: productVariants.id,
          sku: productVariants.sku,
          price: productVariants.price,
          quantity: productVariants.quantity,
          attributes: productVariants.attributes,
        },
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .leftJoin(productVariants, eq(cartItems.variantId, productVariants.id))
      .where(eq(cartItems.cartId, cartId));

    const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

    logger.info('Cart retrieved successfully from repository', { cartId, itemCount: items.length });
    return { 
      ...cart, 
      items, 
      itemCount: items.length,
      totalAmount 
    };
  } catch (error) {
    logger.error('Error retrieving cart from repository:', error);
    throw error;
  }
};

export const findByUserId = async (userId: string): Promise<CartWithItems | null> => {
  try {
    const [cart] = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, userId))
      .orderBy(desc(carts.updatedAt));

    if (!cart) {
      return null;
    }

    return findById(cart.id);
  } catch (error) {
    logger.error('Error finding cart by user ID:', error);
    throw error;
  }
};

export const findBySessionId = async (sessionId: string): Promise<CartWithItems | null> => {
  try {
    const [cart] = await db
      .select()
      .from(carts)
      .where(eq(carts.sessionId, sessionId))
      .orderBy(desc(carts.updatedAt));

    if (!cart) {
      return null;
    }

    return findById(cart.id);
  } catch (error) {
    logger.error('Error finding cart by session ID:', error);
    throw error;
  }
};

export const addItem = async (
  cartId: number,
  itemData: AddToCartInput & { price: number }
): Promise<typeof cartItems.$inferSelect> => {
  try {
    logger.info('Adding item to cart in repository', { 
      cartId,
      productId: itemData.productId,
      quantity: itemData.quantity 
    });

    // Check if item already exists in cart
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(and(
        eq(cartItems.cartId, cartId),
        eq(cartItems.productId, itemData.productId),
        itemData.variantId ? eq(cartItems.variantId, itemData.variantId) : sql`${cartItems.variantId} IS NULL`
      ));

    if (existingItem) {
      // Update quantity if item exists
      const newQuantity = existingItem.quantity + itemData.quantity;
      const [updatedItem] = await db
        .update(cartItems)
        .set({ 
          quantity: newQuantity,
          updatedAt: new Date()
        })
        .where(eq(cartItems.id, existingItem.id))
        .returning();

      logger.info('Cart item quantity updated', { itemId: updatedItem.id, newQuantity });
      return updatedItem;
    } else {
      // Add new item
      const newCartItem: NewCartItem = {
        cartId,
        productId: itemData.productId,
        variantId: itemData.variantId,
        quantity: itemData.quantity,
        price: itemData.price.toString(),
      };

      const [savedItem] = await db.insert(cartItems).values(newCartItem).returning();

      logger.info('Item added to cart successfully', { itemId: savedItem.id });
      return savedItem;
    }
  } catch (error) {
    logger.error('Error adding item to cart:', error);
    throw error;
  } finally {
    // Update cart timestamp
    await db
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, cartId));
  }
};

export const updateItemQuantity = async (
  itemId: number,
  quantity: number
): Promise<typeof cartItems.$inferSelect | null> => {
  try {
    const [updatedItem] = await db
      .update(cartItems)
      .set({ 
        quantity,
        updatedAt: new Date()
      })
      .where(eq(cartItems.id, itemId))
      .returning();

    if (!updatedItem) {
      logger.warn('Cart item not found for update', { itemId });
      return null;
    }

    // Update cart timestamp
    await db
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, updatedItem.cartId));

    logger.info('Cart item quantity updated successfully', { itemId, quantity });
    return updatedItem;
  } catch (error) {
    logger.error('Error updating cart item quantity:', error);
    throw error;
  }
};

export const removeItem = async (itemId: number): Promise<boolean> => {
  try {
    const [deletedItem] = await db
      .delete(cartItems)
      .where(eq(cartItems.id, itemId))
      .returning({ cartId: cartItems.cartId });

    if (!deletedItem) {
      logger.warn('Cart item not found for deletion', { itemId });
      return false;
    }

    // Update cart timestamp
    await db
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, deletedItem.cartId));

    logger.info('Cart item removed successfully', { itemId });
    return true;
  } catch (error) {
    logger.error('Error removing cart item:', error);
    throw error;
  }
};

export const clearCart = async (cartId: number): Promise<boolean> => {
  try {
    await db
      .delete(cartItems)
      .where(eq(cartItems.cartId, cartId));

    // Update cart timestamp
    await db
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, cartId));

    logger.info('Cart cleared successfully', { cartId });
    return true;
  } catch (error) {
    logger.error('Error clearing cart:', error);
    throw error;
  }
};

export const mergeCarts = async (
  guestCartId: number,
  userCartId: number
): Promise<boolean> => {
  try {
    logger.info('Merging carts', { guestCartId, userCartId });

    // Get guest cart items
    const guestItems = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, guestCartId));

    // Move items from guest cart to user cart
    for (const item of guestItems) {
      // Check if item already exists in user cart
      const [existingItem] = await db
        .select()
        .from(cartItems)
        .where(and(
          eq(cartItems.cartId, userCartId),
          eq(cartItems.productId, item.productId),
          item.variantId ? eq(cartItems.variantId, item.variantId) : sql`${cartItems.variantId} IS NULL`
        ));

      if (existingItem) {
        // Update quantity
        await db
          .update(cartItems)
          .set({ 
            quantity: existingItem.quantity + item.quantity,
            updatedAt: new Date()
          })
          .where(eq(cartItems.id, existingItem.id));
      } else {
        // Move item to user cart
        await db
          .update(cartItems)
          .set({ 
            cartId: userCartId,
            updatedAt: new Date()
          })
          .where(eq(cartItems.id, item.id));
      }
    }

    // Delete guest cart
    await db.delete(carts).where(eq(carts.id, guestCartId));

    // Update user cart timestamp
    await db
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, userCartId));

    logger.info('Carts merged successfully', { guestCartId, userCartId });
    return true;
  } catch (error) {
    logger.error('Error merging carts:', error);
    throw error;
  }
};

export const getCartItemById = async (itemId: number): Promise<typeof cartItems.$inferSelect | null> => {
  try {
    const [item] = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.id, itemId));

    return item || null;
  } catch (error) {
    logger.error('Error getting cart item by ID:', error);
    throw error;
  }
};

export const getCartStats = async (cartId: number): Promise<{
  itemCount: number;
  totalAmount: number;
  uniqueProducts: number;
}> => {
  try {
    const [stats] = await db
      .select({
        itemCount: sql<number>`sum(${cartItems.quantity})::int`,
        totalAmount: sql<number>`sum(${cartItems.quantity} * ${cartItems.price}::numeric)::float`,
        uniqueProducts: sql<number>`count(*)::int`,
      })
      .from(cartItems)
      .where(eq(cartItems.cartId, cartId));

    return {
      itemCount: stats.itemCount || 0,
      totalAmount: stats.totalAmount || 0,
      uniqueProducts: stats.uniqueProducts || 0,
    };
  } catch (error) {
    logger.error('Error getting cart stats:', error);
    throw error;
  }
};

export const cleanupExpiredCarts = async (daysOld: number = 30): Promise<number> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Delete cart items first (foreign key constraint)
    await db
      .delete(cartItems)
      .where(sql`${cartItems.cartId} IN (
        SELECT ${carts.id} FROM ${carts} 
        WHERE ${carts.updatedAt} < ${cutoffDate}
        AND ${carts.userId} IS NULL
      )`);

    // Delete expired guest carts
    const deletedCarts = await db
      .delete(carts)
      .where(and(
        sql`${carts.updatedAt} < ${cutoffDate}`,
        sql`${carts.userId} IS NULL`
      ))
      .returning({ id: carts.id });

    logger.info('Expired carts cleaned up', { count: deletedCarts.length });
    return deletedCarts.length;
  } catch (error) {
    logger.error('Error cleaning up expired carts:', error);
    throw error;
  }
};