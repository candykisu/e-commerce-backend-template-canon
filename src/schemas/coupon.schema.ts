import { z } from 'zod';

// Create coupon schema
export const createCouponSchema = z.object({
  body: z.object({
    code: z.string().min(3, 'Code must be at least 3 characters').max(50, 'Code must be less than 50 characters').regex(/^[A-Z0-9_-]+$/, 'Code must contain only uppercase letters, numbers, underscores, and hyphens'),
    name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
    description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
    type: z.enum(['percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y']),
    value: z.number().min(0, 'Value must be non-negative'),
    minimumOrderAmount: z.number().min(0, 'Minimum order amount must be non-negative').optional(),
    maximumDiscountAmount: z.number().min(0, 'Maximum discount amount must be non-negative').optional(),
    usageLimit: z.number().int().min(1, 'Usage limit must be at least 1').optional(),
    userUsageLimit: z.number().int().min(1, 'User usage limit must be at least 1').default(1),
    isActive: z.boolean().default(true),
    isPublic: z.boolean().default(true),
    stackable: z.boolean().default(false),
    firstTimeCustomerOnly: z.boolean().default(false),
    validFrom: z.string().datetime('Invalid date format for validFrom'),
    validUntil: z.string().datetime('Invalid date format for validUntil'),
    conditions: z.array(z.object({
      conditionType: z.enum(['product', 'category', 'user_group', 'minimum_quantity']),
      conditionValue: z.string(),
      isInclusive: z.boolean().default(true),
    })).optional(),
    buyXGetY: z.object({
      buyQuantity: z.number().int().min(1),
      getQuantity: z.number().int().min(1),
      buyProductIds: z.array(z.number().int()).optional(),
      getProductIds: z.array(z.number().int()).optional(),
      buyCategoryIds: z.array(z.number().int()).optional(),
      getCategoryIds: z.array(z.number().int()).optional(),
      getDiscountType: z.enum(['free', 'percentage', 'fixed_amount']).default('free'),
      getDiscountValue: z.number().min(0).default(0),
    }).optional(),
  }).refine((data) => {
    // Validate percentage values
    if (data.type === 'percentage' && data.value > 100) {
      return false;
    }
    // Validate buy_x_get_y requires buyXGetY object
    if (data.type === 'buy_x_get_y' && !data.buyXGetY) {
      return false;
    }
    // Validate date range
    if (new Date(data.validFrom) >= new Date(data.validUntil)) {
      return false;
    }
    return true;
  }, {
    message: 'Invalid coupon configuration',
  }),
});

// Update coupon schema
export const updateCouponSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional(),
    value: z.number().min(0).optional(),
    minimumOrderAmount: z.number().min(0).optional(),
    maximumDiscountAmount: z.number().min(0).optional(),
    usageLimit: z.number().int().min(1).optional(),
    userUsageLimit: z.number().int().min(1).optional(),
    isActive: z.boolean().optional(),
    isPublic: z.boolean().optional(),
    stackable: z.boolean().optional(),
    firstTimeCustomerOnly: z.boolean().optional(),
    validFrom: z.string().datetime().optional(),
    validUntil: z.string().datetime().optional(),
  }),
});

// Apply coupon schema
export const applyCouponSchema = z.object({
  body: z.object({
    couponCode: z.string().min(1, 'Coupon code is required'),
    cartId: z.number().int().positive('Cart ID must be a positive integer').optional(),
    userId: z.string().uuid('Invalid user ID format').optional(),
  }),
});

// Remove coupon schema
export const removeCouponSchema = z.object({
  body: z.object({
    couponCode: z.string().min(1, 'Coupon code is required'),
    cartId: z.number().int().positive('Cart ID must be a positive integer').optional(),
  }),
});

// Validate coupon schema
export const validateCouponSchema = z.object({
  body: z.object({
    couponCode: z.string().min(1, 'Coupon code is required'),
    cartTotal: z.number().min(0, 'Cart total must be non-negative'),
    cartItems: z.array(z.object({
      productId: z.number().int(),
      categoryId: z.number().int(),
      quantity: z.number().int().min(1),
      price: z.number().min(0),
    })),
    userId: z.string().uuid().optional(),
  }),
});

// Get coupons schema
export const getCouponsSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => parseInt(val || '1') || 1),
    limit: z.string().optional().transform(val => Math.min(parseInt(val || '10') || 10, 50)),
    type: z.enum(['percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y']).optional(),
    isActive: z.string().optional().transform(val => val === 'true'),
    isPublic: z.string().optional().transform(val => val === 'true'),
    search: z.string().optional(),
    sortBy: z.enum(['created_at', 'name', 'code', 'usage_count', 'valid_until']).optional().default('created_at'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

// Create automatic discount schema
export const createAutomaticDiscountSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(255),
    description: z.string().max(1000).optional(),
    type: z.enum(['percentage', 'fixed_amount', 'free_shipping']),
    value: z.number().min(0),
    minimumOrderAmount: z.number().min(0).optional(),
    maximumDiscountAmount: z.number().min(0).optional(),
    priority: z.number().int().default(0),
    isActive: z.boolean().default(true),
    stackable: z.boolean().default(false),
    validFrom: z.string().datetime(),
    validUntil: z.string().datetime(),
    conditions: z.array(z.object({
      conditionType: z.enum(['product', 'category', 'user_group', 'minimum_quantity']),
      conditionValue: z.string(),
      isInclusive: z.boolean().default(true),
    })).optional(),
  }),
});

// Assign coupon to user schema
export const assignCouponSchema = z.object({
  body: z.object({
    couponId: z.number().int().positive(),
    userIds: z.array(z.string().uuid()).min(1, 'At least one user ID is required'),
  }),
});

// Coupon statistics schema
export const couponStatsSchema = z.object({
  query: z.object({
    period: z.enum(['7d', '30d', '90d', '1y', 'all']).optional().default('30d'),
    couponId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  }),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>['body'];
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>['body'];
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>['body'];
export type RemoveCouponInput = z.infer<typeof removeCouponSchema>['body'];
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>['body'];
export type GetCouponsInput = z.infer<typeof getCouponsSchema>['query'];
export type CreateAutomaticDiscountInput = z.infer<typeof createAutomaticDiscountSchema>['body'];
export type AssignCouponInput = z.infer<typeof assignCouponSchema>['body'];
export type CouponStatsInput = z.infer<typeof couponStatsSchema>['query'];