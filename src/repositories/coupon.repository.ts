import { eq, and, desc, asc, sql, gte, lte, like, or, inArray, isNull, count, sum } from 'drizzle-orm';
import { db } from '../db';
import { 
  coupons, 
  couponUsages, 
  couponConditions, 
  buyXGetYPromotions,
  userCoupons,
  automaticDiscounts,
  automaticDiscountConditions,
  Coupon,
  NewCoupon,
  NewCouponUsage,
  NewCouponCondition,
  NewBuyXGetYPromotion,
  NewUserCoupon,
  AutomaticDiscount,
  NewAutomaticDiscount,
  NewAutomaticDiscountCondition
} from '../models/coupons.schema';
import { users } from '../models/ecommerce.schema';
import { CreateCouponInput, GetCouponsInput } from '../schemas/coupon.schema';
import { logger } from '../utils';

// Type for coupon with details
type CouponWithDetails = Coupon & {
  conditions?: Array<{
    id: number;
    conditionType: string;
    conditionValue: string;
    isInclusive: boolean;
  }>;
  buyXGetY?: {
    buyQuantity: number;
    getQuantity: number;
    buyProductIds: number[] | null;
    getProductIds: number[] | null;
    buyCategoryIds: number[] | null;
    getCategoryIds: number[] | null;
    getDiscountType: string;
    getDiscountValue: string | null;
  } | null;
  creator?: {
    firstName: string;
    lastName: string;
  } | null;
};

/**
 * Create a new coupon
 */
export const createCoupon = async (couponData: CreateCouponInput, createdBy: string): Promise<Coupon> => {
  try {
    logger.info('Creating new coupon', { code: couponData.code, createdBy });

    const newCoupon: NewCoupon = {
      code: couponData.code.toUpperCase(),
      name: couponData.name,
      description: couponData.description,
      type: couponData.type,
      value: couponData.value.toString(),
      minimumOrderAmount: couponData.minimumOrderAmount?.toString(),
      maximumDiscountAmount: couponData.maximumDiscountAmount?.toString(),
      usageLimit: couponData.usageLimit,
      userUsageLimit: couponData.userUsageLimit,
      isActive: couponData.isActive,
      isPublic: couponData.isPublic,
      stackable: couponData.stackable,
      firstTimeCustomerOnly: couponData.firstTimeCustomerOnly,
      validFrom: new Date(couponData.validFrom),
      validUntil: new Date(couponData.validUntil),
      createdBy,
    };

    const [savedCoupon] = await db.insert(coupons).values(newCoupon).returning();

    // Add conditions if provided
    if (couponData.conditions && couponData.conditions.length > 0) {
      const conditionsData: NewCouponCondition[] = couponData.conditions.map(condition => ({
        couponId: savedCoupon.id,
        conditionType: condition.conditionType,
        conditionValue: condition.conditionValue,
        isInclusive: condition.isInclusive,
      }));

      await db.insert(couponConditions).values(conditionsData);
    }

    // Add buy X get Y promotion if provided
    if (couponData.type === 'buy_x_get_y' && couponData.buyXGetY) {
      const buyXGetYData: NewBuyXGetYPromotion = {
        couponId: savedCoupon.id,
        buyQuantity: couponData.buyXGetY.buyQuantity,
        getQuantity: couponData.buyXGetY.getQuantity,
        buyProductIds: couponData.buyXGetY.buyProductIds,
        getProductIds: couponData.buyXGetY.getProductIds,
        buyCategoryIds: couponData.buyXGetY.buyCategoryIds,
        getCategoryIds: couponData.buyXGetY.getCategoryIds,
        getDiscountType: couponData.buyXGetY.getDiscountType,
        getDiscountValue: couponData.buyXGetY.getDiscountValue.toString(),
      };

      await db.insert(buyXGetYPromotions).values(buyXGetYData);
    }

    logger.info('Coupon created successfully', { couponId: savedCoupon.id });
    return savedCoupon;
  } catch (error) {
    logger.error('Error creating coupon:', error);
    throw error;
  }
};

/**
 * Get coupons with filtering and pagination
 */
export const getCoupons = async (params: GetCouponsInput): Promise<{
  coupons: CouponWithDetails[];
  total: number;
}> => {
  try {
    const { page, limit, type, isActive, isPublic, search, sortBy, sortOrder } = params;
    const offset = (page - 1) * limit;
    const conditions = [];

    // Apply filters
    if (type) conditions.push(eq(coupons.type, type));
    if (isActive !== undefined) conditions.push(eq(coupons.isActive, isActive));
    if (isPublic !== undefined) conditions.push(eq(coupons.isPublic, isPublic));
    if (search) {
      conditions.push(
        or(
          like(coupons.code, `%${search.toUpperCase()}%`),
          like(coupons.name, `%${search}%`),
          like(coupons.description, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sort order
    let orderBy;
    const sortColumn = sortBy === 'created_at' ? coupons.createdAt :
                      sortBy === 'name' ? coupons.name :
                      sortBy === 'code' ? coupons.code :
                      sortBy === 'usage_count' ? coupons.usageCount :
                      sortBy === 'valid_until' ? coupons.validUntil :
                      coupons.createdAt;

    orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const [couponResults, totalResult] = await Promise.all([
      db
        .select({
          id: coupons.id,
          code: coupons.code,
          name: coupons.name,
          description: coupons.description,
          type: coupons.type,
          value: coupons.value,
          minimumOrderAmount: coupons.minimumOrderAmount,
          maximumDiscountAmount: coupons.maximumDiscountAmount,
          usageLimit: coupons.usageLimit,
          usageCount: coupons.usageCount,
          userUsageLimit: coupons.userUsageLimit,
          isActive: coupons.isActive,
          isPublic: coupons.isPublic,
          stackable: coupons.stackable,
          firstTimeCustomerOnly: coupons.firstTimeCustomerOnly,
          validFrom: coupons.validFrom,
          validUntil: coupons.validUntil,
          createdBy: coupons.createdBy,
          createdAt: coupons.createdAt,
          updatedAt: coupons.updatedAt,
          creator: {
            firstName: users.firstName,
            lastName: users.lastName,
          },
        })
        .from(coupons)
        .leftJoin(users, eq(coupons.createdBy, users.id))
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(orderBy),
      db
        .select({ count: sql<number>`count(*)` })
        .from(coupons)
        .where(whereClause),
    ]);

    // Get conditions and buy X get Y data for each coupon
    const couponIds = couponResults.map(c => c.id);
    
    const [conditionsResults, buyXGetYResults] = await Promise.all([
      couponIds.length > 0 ? db
        .select()
        .from(couponConditions)
        .where(inArray(couponConditions.couponId, couponIds)) : [],
      couponIds.length > 0 ? db
        .select()
        .from(buyXGetYPromotions)
        .where(inArray(buyXGetYPromotions.couponId, couponIds)) : [],
    ]);

    // Group conditions and promotions by coupon ID
    const conditionsByCoupon = conditionsResults.reduce((acc, condition) => {
      if (!acc[condition.couponId]) acc[condition.couponId] = [];
      acc[condition.couponId].push(condition);
      return acc;
    }, {} as Record<number, any[]>);

    const buyXGetYByCoupon = buyXGetYResults.reduce((acc, promotion) => {
      acc[promotion.couponId] = promotion;
      return acc;
    }, {} as Record<number, typeof buyXGetYResults[0]>);

    // Combine data
    const couponsWithDetails: CouponWithDetails[] = couponResults.map(coupon => ({
      ...coupon,
      conditions: (conditionsByCoupon[coupon.id] || []).map(condition => ({
        id: condition.id,
        conditionType: condition.conditionType,
        conditionValue: condition.conditionValue,
        isInclusive: condition.isInclusive ?? false,
      })),
      buyXGetY: buyXGetYByCoupon[coupon.id] || null,
    }));

    const total = Number(totalResult[0]?.count || 0);

    logger.info('Coupons retrieved', { total, returned: couponResults.length });
    return { coupons: couponsWithDetails, total };
  } catch (error) {
    logger.error('Error getting coupons:', error);
    throw error;
  }
};

/**
 * Get coupon by code
 */
export const getCouponByCode = async (code: string): Promise<CouponWithDetails | null> => {
  try {
    const [coupon] = await db
      .select({
        id: coupons.id,
        code: coupons.code,
        name: coupons.name,
        description: coupons.description,
        type: coupons.type,
        value: coupons.value,
        minimumOrderAmount: coupons.minimumOrderAmount,
        maximumDiscountAmount: coupons.maximumDiscountAmount,
        usageLimit: coupons.usageLimit,
        usageCount: coupons.usageCount,
        userUsageLimit: coupons.userUsageLimit,
        isActive: coupons.isActive,
        isPublic: coupons.isPublic,
        stackable: coupons.stackable,
        firstTimeCustomerOnly: coupons.firstTimeCustomerOnly,
        validFrom: coupons.validFrom,
        validUntil: coupons.validUntil,
        createdBy: coupons.createdBy,
        createdAt: coupons.createdAt,
        updatedAt: coupons.updatedAt,
      })
      .from(coupons)
      .where(eq(coupons.code, code.toUpperCase()));

    if (!coupon) return null;

    // Get conditions and buy X get Y data
    const [conditions, buyXGetY] = await Promise.all([
      db
        .select()
        .from(couponConditions)
        .where(eq(couponConditions.couponId, coupon.id)),
      db
        .select()
        .from(buyXGetYPromotions)
        .where(eq(buyXGetYPromotions.couponId, coupon.id))
        .then(results => results[0] || null),
    ]);

    return {
      ...coupon,
      conditions: conditions.map(condition => ({
        id: condition.id,
        conditionType: condition.conditionType,
        conditionValue: condition.conditionValue,
        isInclusive: condition.isInclusive ?? false,
      })),
      buyXGetY,
    };
  } catch (error) {
    logger.error('Error getting coupon by code:', error);
    throw error;
  }
};

/**
 * Get coupon by ID
 */
export const getCouponById = async (couponId: number): Promise<CouponWithDetails | null> => {
  try {
    const [coupon] = await db
      .select({
        id: coupons.id,
        code: coupons.code,
        name: coupons.name,
        description: coupons.description,
        type: coupons.type,
        value: coupons.value,
        minimumOrderAmount: coupons.minimumOrderAmount,
        maximumDiscountAmount: coupons.maximumDiscountAmount,
        usageLimit: coupons.usageLimit,
        usageCount: coupons.usageCount,
        userUsageLimit: coupons.userUsageLimit,
        isActive: coupons.isActive,
        isPublic: coupons.isPublic,
        stackable: coupons.stackable,
        firstTimeCustomerOnly: coupons.firstTimeCustomerOnly,
        validFrom: coupons.validFrom,
        validUntil: coupons.validUntil,
        createdBy: coupons.createdBy,
        createdAt: coupons.createdAt,
        updatedAt: coupons.updatedAt,
        creator: {
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(coupons)
      .leftJoin(users, eq(coupons.createdBy, users.id))
      .where(eq(coupons.id, couponId));

    if (!coupon) return null;

    // Get conditions and buy X get Y data
    const [conditions, buyXGetY] = await Promise.all([
      db
        .select()
        .from(couponConditions)
        .where(eq(couponConditions.couponId, coupon.id)),
      db
        .select()
        .from(buyXGetYPromotions)
        .where(eq(buyXGetYPromotions.couponId, coupon.id))
        .then(results => results[0] || null),
    ]);

    return {
      ...coupon,
      conditions: conditions.map(condition => ({
        id: condition.id,
        conditionType: condition.conditionType,
        conditionValue: condition.conditionValue,
        isInclusive: condition.isInclusive ?? false,
      })),
      buyXGetY,
    };
  } catch (error) {
    logger.error('Error getting coupon by ID:', error);
    throw error;
  }
};

/**
 * Update coupon usage count
 */
export const incrementCouponUsage = async (couponId: number): Promise<void> => {
  try {
    await db
      .update(coupons)
      .set({ 
        usageCount: sql`${coupons.usageCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(coupons.id, couponId));

    logger.info('Coupon usage count incremented', { couponId });
  } catch (error) {
    logger.error('Error incrementing coupon usage:', error);
    throw error;
  }
};

/**
 * Record coupon usage
 */
export const recordCouponUsage = async (usageData: NewCouponUsage): Promise<void> => {
  try {
    await db.insert(couponUsages).values(usageData);
    logger.info('Coupon usage recorded', { couponId: usageData.couponId });
  } catch (error) {
    logger.error('Error recording coupon usage:', error);
    throw error;
  }
};

/**
 * Get user coupon usage count
 */
export const getUserCouponUsageCount = async (couponId: number, userId: string): Promise<number> => {
  try {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(couponUsages)
      .where(
        and(
          eq(couponUsages.couponId, couponId),
          eq(couponUsages.userId, userId)
        )
      );

    return Number(result?.count || 0);
  } catch (error) {
    logger.error('Error getting user coupon usage count:', error);
    throw error;
  }
};

/**
 * Get active automatic discounts
 */
export const getActiveAutomaticDiscounts = async (): Promise<Array<AutomaticDiscount & { conditions: any[] }>> => {
  try {
    const now = new Date();
    
    const discounts = await db
      .select()
      .from(automaticDiscounts)
      .where(
        and(
          eq(automaticDiscounts.isActive, true),
          lte(automaticDiscounts.validFrom, now),
          gte(automaticDiscounts.validUntil, now)
        )
      )
      .orderBy(desc(automaticDiscounts.priority));

    // Get conditions for each discount
    const discountIds = discounts.map(d => d.id);
    const conditions = discountIds.length > 0 ? await db
      .select()
      .from(automaticDiscountConditions)
      .where(inArray(automaticDiscountConditions.discountId, discountIds)) : [];

    // Group conditions by discount ID
    const conditionsByDiscount = conditions.reduce((acc, condition) => {
      if (!acc[condition.discountId]) acc[condition.discountId] = [];
      acc[condition.discountId].push(condition);
      return acc;
    }, {} as Record<number, typeof conditions>);

    return discounts.map(discount => ({
      ...discount,
      conditions: conditionsByDiscount[discount.id] || [],
    }));
  } catch (error) {
    logger.error('Error getting active automatic discounts:', error);
    throw error;
  }
};

/**
 * Assign coupon to users
 */
export const assignCouponToUsers = async (couponId: number, userIds: string[], assignedBy: string): Promise<void> => {
  try {
    const assignments: NewUserCoupon[] = userIds.map(userId => ({
      couponId,
      userId,
      assignedBy,
    }));

    await db.insert(userCoupons).values(assignments);
    logger.info('Coupon assigned to users', { couponId, userCount: userIds.length });
  } catch (error) {
    logger.error('Error assigning coupon to users:', error);
    throw error;
  }
};

/**
 * Get user's available coupons
 */
export const getUserAvailableCoupons = async (userId: string): Promise<CouponWithDetails[]> => {
  try {
    const now = new Date();
    
    // Get public coupons and user-specific coupons
    const [publicCoupons, userSpecificCoupons] = await Promise.all([
      // Public coupons
      db
        .select({
          id: coupons.id,
          code: coupons.code,
          name: coupons.name,
          description: coupons.description,
          type: coupons.type,
          value: coupons.value,
          minimumOrderAmount: coupons.minimumOrderAmount,
          maximumDiscountAmount: coupons.maximumDiscountAmount,
          usageLimit: coupons.usageLimit,
          usageCount: coupons.usageCount,
          userUsageLimit: coupons.userUsageLimit,
          isActive: coupons.isActive,
          isPublic: coupons.isPublic,
          stackable: coupons.stackable,
          firstTimeCustomerOnly: coupons.firstTimeCustomerOnly,
          validFrom: coupons.validFrom,
          validUntil: coupons.validUntil,
          createdBy: coupons.createdBy,
          createdAt: coupons.createdAt,
          updatedAt: coupons.updatedAt,
        })
        .from(coupons)
        .where(
          and(
            eq(coupons.isActive, true),
            eq(coupons.isPublic, true),
            lte(coupons.validFrom, now),
            gte(coupons.validUntil, now)
          )
        ),
      // User-specific coupons
      db
        .select({
          id: coupons.id,
          code: coupons.code,
          name: coupons.name,
          description: coupons.description,
          type: coupons.type,
          value: coupons.value,
          minimumOrderAmount: coupons.minimumOrderAmount,
          maximumDiscountAmount: coupons.maximumDiscountAmount,
          usageLimit: coupons.usageLimit,
          usageCount: coupons.usageCount,
          userUsageLimit: coupons.userUsageLimit,
          isActive: coupons.isActive,
          isPublic: coupons.isPublic,
          stackable: coupons.stackable,
          firstTimeCustomerOnly: coupons.firstTimeCustomerOnly,
          validFrom: coupons.validFrom,
          validUntil: coupons.validUntil,
          createdBy: coupons.createdBy,
          createdAt: coupons.createdAt,
          updatedAt: coupons.updatedAt,
        })
        .from(coupons)
        .innerJoin(userCoupons, eq(coupons.id, userCoupons.couponId))
        .where(
          and(
            eq(coupons.isActive, true),
            eq(userCoupons.userId, userId),
            eq(userCoupons.isUsed, false),
            lte(coupons.validFrom, now),
            gte(coupons.validUntil, now)
          )
        ),
    ]);

    // Combine and deduplicate
    const allCoupons = [...publicCoupons, ...userSpecificCoupons];
    const uniqueCoupons = allCoupons.filter((coupon, index, self) => 
      index === self.findIndex(c => c.id === coupon.id)
    );

    return uniqueCoupons.map(coupon => ({ ...coupon, conditions: [], buyXGetY: null }));
  } catch (error) {
    logger.error('Error getting user available coupons:', error);
    throw error;
  }
};