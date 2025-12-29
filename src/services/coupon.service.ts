import * as couponRepository from '../repositories/coupon.repository';
import { 
  CreateCouponInput, 
  UpdateCouponInput, 
  ApplyCouponInput, 
  ValidateCouponInput, 
  GetCouponsInput,
  AssignCouponInput 
} from '../schemas/coupon.schema';
import { Coupon } from '../models/coupons.schema';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/ApiError';
import { error as errorMessages } from '../constants/messages';
import { logger } from '../utils';

export interface CouponValidationResult {
  isValid: boolean;
  coupon?: any;
  discountAmount?: number;
  errorMessage?: string;
  applicableItems?: Array<{
    productId: number;
    quantity: number;
    originalPrice: number;
    discountedPrice: number;
    discountAmount: number;
  }>;
}

export interface CartItem {
  productId: number;
  categoryId: number;
  quantity: number;
  price: number;
}

/**
 * Create a new coupon
 */
export const createCoupon = async (couponData: CreateCouponInput, createdBy: string): Promise<Coupon> => {
  try {
    // Validate coupon code uniqueness
    const existingCoupon = await couponRepository.getCouponByCode(couponData.code);
    if (existingCoupon) {
      throw new BadRequestError('Coupon code already exists');
    }

    // Additional validation for percentage coupons
    if (couponData.type === 'percentage' && couponData.value > 100) {
      throw new BadRequestError('Percentage discount cannot exceed 100%');
    }

    // Validate date range
    const validFrom = new Date(couponData.validFrom);
    const validUntil = new Date(couponData.validUntil);
    if (validFrom >= validUntil) {
      throw new BadRequestError('Valid from date must be before valid until date');
    }

    const coupon = await couponRepository.createCoupon(couponData, createdBy);
    logger.info('Coupon created successfully', { couponId: coupon.id, code: coupon.code });
    return coupon;
  } catch (error) {
    logger.error('Error in createCoupon service:', error);
    throw error;
  }
};

/**
 * Get coupons with filtering and pagination
 */
export const getCoupons = async (params: GetCouponsInput): Promise<{
  coupons: any[];
  total: number;
}> => {
  try {
    const result = await couponRepository.getCoupons(params);
    logger.info('Coupons retrieved', { total: result.total });
    return result;
  } catch (error) {
    logger.error('Error in getCoupons service:', error);
    throw error;
  }
};

/**
 * Get coupon by ID
 */
export const getCouponById = async (couponId: number): Promise<any> => {
  try {
    const coupon = await couponRepository.getCouponById(couponId);
    if (!coupon) {
      throw new NotFoundError('Coupon not found');
    }

    logger.info('Coupon retrieved', { couponId });
    return coupon;
  } catch (error) {
    logger.error('Error in getCouponById service:', error);
    throw error;
  }
};

/**
 * Validate coupon for a cart
 */
export const validateCoupon = async (validationData: ValidateCouponInput): Promise<CouponValidationResult> => {
  try {
    const { couponCode, cartTotal, cartItems, userId } = validationData;

    // Get coupon by code
    const coupon = await couponRepository.getCouponByCode(couponCode);
    if (!coupon) {
      return {
        isValid: false,
        errorMessage: 'Coupon not found',
      };
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return {
        isValid: false,
        errorMessage: 'Coupon is not active',
      };
    }

    // Check validity dates
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return {
        isValid: false,
        errorMessage: 'Coupon has expired or is not yet valid',
      };
    }

    // Check usage limits
    if (coupon.usageLimit && (coupon.usageCount || 0) >= coupon.usageLimit) {
      return {
        isValid: false,
        errorMessage: 'Coupon usage limit exceeded',
      };
    }

    // Check user usage limit
    if (userId) {
      const userUsageCount = await couponRepository.getUserCouponUsageCount(coupon.id, userId);
      if (userUsageCount >= (coupon.userUsageLimit || 0)) {
        return {
          isValid: false,
          errorMessage: 'You have already used this coupon the maximum number of times',
        };
      }
    }

    // Check minimum order amount
    if (coupon.minimumOrderAmount && cartTotal < Number(coupon.minimumOrderAmount)) {
      return {
        isValid: false,
        errorMessage: `Minimum order amount of $${coupon.minimumOrderAmount} required`,
      };
    }

    // Check conditions
    const conditionsValid = await validateCouponConditions(coupon, cartItems);
    if (!conditionsValid.isValid) {
      return {
        isValid: false,
        errorMessage: conditionsValid.errorMessage,
      };
    }

    // Calculate discount
    const discountResult = calculateDiscount(coupon, cartTotal, cartItems);

    return {
      isValid: true,
      coupon,
      discountAmount: discountResult.discountAmount,
      applicableItems: discountResult.applicableItems,
    };
  } catch (error) {
    logger.error('Error in validateCoupon service:', error);
    return {
      isValid: false,
      errorMessage: 'Error validating coupon',
    };
  }
};

/**
 * Apply coupon to cart
 */
export const applyCoupon = async (applyData: ApplyCouponInput): Promise<CouponValidationResult> => {
  try {
    // This would typically integrate with cart service to get cart details
    // For now, we'll return a basic validation
    const coupon = await couponRepository.getCouponByCode(applyData.couponCode);
    if (!coupon) {
      throw new NotFoundError('Coupon not found');
    }

    // Basic validation
    if (!coupon.isActive) {
      throw new BadRequestError('Coupon is not active');
    }

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      throw new BadRequestError('Coupon has expired or is not yet valid');
    }

    logger.info('Coupon applied successfully', { couponCode: applyData.couponCode });
    return {
      isValid: true,
      coupon,
      discountAmount: 0, // Would be calculated based on cart
    };
  } catch (error) {
    logger.error('Error in applyCoupon service:', error);
    throw error;
  }
};

/**
 * Get user's available coupons
 */
export const getUserAvailableCoupons = async (userId: string): Promise<any[]> => {
  try {
    const coupons = await couponRepository.getUserAvailableCoupons(userId);
    logger.info('User available coupons retrieved', { userId, count: coupons.length });
    return coupons;
  } catch (error) {
    logger.error('Error in getUserAvailableCoupons service:', error);
    throw error;
  }
};

/**
 * Assign coupon to users
 */
export const assignCouponToUsers = async (assignData: AssignCouponInput, assignedBy: string): Promise<void> => {
  try {
    // Verify coupon exists
    const coupon = await couponRepository.getCouponById(assignData.couponId);
    if (!coupon) {
      throw new NotFoundError('Coupon not found');
    }

    await couponRepository.assignCouponToUsers(assignData.couponId, assignData.userIds, assignedBy);
    logger.info('Coupon assigned to users', { 
      couponId: assignData.couponId, 
      userCount: assignData.userIds.length 
    });
  } catch (error) {
    logger.error('Error in assignCouponToUsers service:', error);
    throw error;
  }
};

/**
 * Get coupon statistics
 */
export const getCouponStatistics = async (period: string = '30d', couponId?: number): Promise<any> => {
  try {
    // This would typically involve complex analytics queries
    // For now, return basic stats
    const stats = {
      totalCoupons: 0,
      activeCoupons: 0,
      totalUsages: 0,
      totalDiscountAmount: 0,
      topCoupons: [],
      usageByPeriod: [],
    };

    logger.info('Coupon statistics retrieved', { period, couponId });
    return stats;
  } catch (error) {
    logger.error('Error in getCouponStatistics service:', error);
    throw error;
  }
};

/**
 * Validate coupon conditions
 */
const validateCouponConditions = async (coupon: any, cartItems: CartItem[]): Promise<{
  isValid: boolean;
  errorMessage?: string;
}> => {
  try {
    if (!coupon.conditions || coupon.conditions.length === 0) {
      return { isValid: true };
    }

    for (const condition of coupon.conditions) {
      const conditionValue = JSON.parse(condition.conditionValue);
      
      switch (condition.conditionType) {
        case 'product':
          const productIds = Array.isArray(conditionValue) ? conditionValue : [conditionValue];
          const hasProduct = cartItems.some(item => productIds.includes(item.productId));
          
          if (condition.isInclusive && !hasProduct) {
            return { isValid: false, errorMessage: 'Required products not in cart' };
          }
          if (!condition.isInclusive && hasProduct) {
            return { isValid: false, errorMessage: 'Excluded products in cart' };
          }
          break;

        case 'category':
          const categoryIds = Array.isArray(conditionValue) ? conditionValue : [conditionValue];
          const hasCategory = cartItems.some(item => categoryIds.includes(item.categoryId));
          
          if (condition.isInclusive && !hasCategory) {
            return { isValid: false, errorMessage: 'Required categories not in cart' };
          }
          if (!condition.isInclusive && hasCategory) {
            return { isValid: false, errorMessage: 'Excluded categories in cart' };
          }
          break;

        case 'minimum_quantity':
          const minQuantity = parseInt(conditionValue);
          const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
          
          if (totalQuantity < minQuantity) {
            return { isValid: false, errorMessage: `Minimum ${minQuantity} items required` };
          }
          break;
      }
    }

    return { isValid: true };
  } catch (error) {
    logger.error('Error validating coupon conditions:', error);
    return { isValid: false, errorMessage: 'Error validating coupon conditions' };
  }
};

/**
 * Calculate discount amount
 */
const calculateDiscount = (coupon: any, cartTotal: number, cartItems: CartItem[]): {
  discountAmount: number;
  applicableItems: Array<{
    productId: number;
    quantity: number;
    originalPrice: number;
    discountedPrice: number;
    discountAmount: number;
  }>;
} => {
  let discountAmount = 0;
  const applicableItems: any[] = [];

  switch (coupon.type) {
    case 'percentage':
      discountAmount = (cartTotal * Number(coupon.value)) / 100;
      break;

    case 'fixed_amount':
      discountAmount = Number(coupon.value);
      break;

    case 'free_shipping':
      // This would typically be handled differently
      discountAmount = 0; // Shipping cost would be set to 0
      break;

    case 'buy_x_get_y':
      // Complex calculation for buy X get Y
      if (coupon.buyXGetY) {
        discountAmount = calculateBuyXGetYDiscount(coupon.buyXGetY, cartItems);
      }
      break;
  }

  // Apply maximum discount limit
  if (coupon.maximumDiscountAmount && discountAmount > Number(coupon.maximumDiscountAmount)) {
    discountAmount = Number(coupon.maximumDiscountAmount);
  }

  // Ensure discount doesn't exceed cart total
  discountAmount = Math.min(discountAmount, cartTotal);

  return { discountAmount, applicableItems };
};

/**
 * Calculate Buy X Get Y discount
 */
const calculateBuyXGetYDiscount = (buyXGetY: any, cartItems: CartItem[]): number => {
  // This is a simplified implementation
  // In a real scenario, this would be much more complex
  let discountAmount = 0;

  // Find qualifying "buy" items
  const buyItems = cartItems.filter(item => {
    if (buyXGetY.buyProductIds && buyXGetY.buyProductIds.includes(item.productId)) {
      return true;
    }
    if (buyXGetY.buyCategoryIds && buyXGetY.buyCategoryIds.includes(item.categoryId)) {
      return true;
    }
    return false;
  });

  // Calculate how many free items user gets
  const totalBuyQuantity = buyItems.reduce((sum, item) => sum + item.quantity, 0);
  const freeItemSets = Math.floor(totalBuyQuantity / buyXGetY.buyQuantity);
  const freeItemsCount = freeItemSets * buyXGetY.getQuantity;

  if (freeItemsCount > 0) {
    // Find cheapest applicable "get" items to discount
    const getItems = cartItems.filter(item => {
      if (buyXGetY.getProductIds && buyXGetY.getProductIds.includes(item.productId)) {
        return true;
      }
      if (buyXGetY.getCategoryIds && buyXGetY.getCategoryIds.includes(item.categoryId)) {
        return true;
      }
      return false;
    });

    // Sort by price (cheapest first for maximum benefit to customer)
    getItems.sort((a, b) => a.price - b.price);

    let remainingFreeItems = freeItemsCount;
    for (const item of getItems) {
      if (remainingFreeItems <= 0) break;

      const itemsToDiscount = Math.min(remainingFreeItems, item.quantity);
      
      if (buyXGetY.getDiscountType === 'free') {
        discountAmount += item.price * itemsToDiscount;
      } else if (buyXGetY.getDiscountType === 'percentage') {
        discountAmount += (item.price * itemsToDiscount * Number(buyXGetY.getDiscountValue)) / 100;
      } else if (buyXGetY.getDiscountType === 'fixed_amount') {
        discountAmount += Number(buyXGetY.getDiscountValue) * itemsToDiscount;
      }

      remainingFreeItems -= itemsToDiscount;
    }
  }

  return discountAmount;
};