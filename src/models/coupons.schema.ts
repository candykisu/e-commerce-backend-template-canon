import { pgTable, serial, text, boolean, timestamp, integer, decimal, uuid, varchar, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, products, categories, orders } from './ecommerce.schema';

// Coupons table
export const coupons = pgTable('coupons', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 20 }).notNull(), // 'percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y'
  value: decimal('value', { precision: 10, scale: 2 }).notNull(), // Percentage (0-100) or fixed amount
  minimumOrderAmount: decimal('minimum_order_amount', { precision: 10, scale: 2 }),
  maximumDiscountAmount: decimal('maximum_discount_amount', { precision: 10, scale: 2 }),
  usageLimit: integer('usage_limit'), // null = unlimited
  usageCount: integer('usage_count').default(0),
  userUsageLimit: integer('user_usage_limit').default(1), // How many times one user can use it
  isActive: boolean('is_active').default(true),
  isPublic: boolean('is_public').default(true), // false = private/targeted coupon
  stackable: boolean('stackable').default(false), // Can be combined with other coupons
  firstTimeCustomerOnly: boolean('first_time_customer_only').default(false),
  validFrom: timestamp('valid_from').notNull(),
  validUntil: timestamp('valid_until').notNull(),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  codeIdx: index('idx_coupons_code').on(table.code),
  typeIdx: index('idx_coupons_type').on(table.type),
  activeIdx: index('idx_coupons_active').on(table.isActive),
  validityIdx: index('idx_coupons_validity').on(table.validFrom, table.validUntil),
}));

// Coupon usage tracking
export const couponUsages = pgTable('coupon_usages', {
  id: serial('id').primaryKey(),
  couponId: integer('coupon_id').notNull(),
  userId: uuid('user_id'),
  orderId: integer('order_id'),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).notNull(),
  originalAmount: decimal('original_amount', { precision: 10, scale: 2 }).notNull(),
  usedAt: timestamp('used_at').defaultNow(),
}, (table) => ({
  couponIdIdx: index('idx_coupon_usages_coupon_id').on(table.couponId),
  userIdIdx: index('idx_coupon_usages_user_id').on(table.userId),
  orderIdIdx: index('idx_coupon_usages_order_id').on(table.orderId),
}));

// Coupon conditions (what products/categories the coupon applies to)
export const couponConditions = pgTable('coupon_conditions', {
  id: serial('id').primaryKey(),
  couponId: integer('coupon_id').notNull(),
  conditionType: varchar('condition_type', { length: 20 }).notNull(), // 'product', 'category', 'user_group', 'minimum_quantity'
  conditionValue: text('condition_value').notNull(), // JSON string with condition details
  isInclusive: boolean('is_inclusive').default(true), // true = include, false = exclude
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  couponIdIdx: index('idx_coupon_conditions_coupon_id').on(table.couponId),
  typeIdx: index('idx_coupon_conditions_type').on(table.conditionType),
}));

// Buy X Get Y promotions (special type of coupon)
export const buyXGetYPromotions = pgTable('buy_x_get_y_promotions', {
  id: serial('id').primaryKey(),
  couponId: integer('coupon_id').notNull(),
  buyQuantity: integer('buy_quantity').notNull(),
  getQuantity: integer('get_quantity').notNull(),
  buyProductIds: integer('buy_product_ids').array(), // Products that qualify for "buy"
  getProductIds: integer('get_product_ids').array(), // Products that are free/discounted
  buyCategoryIds: integer('buy_category_ids').array(),
  getCategoryIds: integer('get_category_ids').array(),
  getDiscountType: varchar('get_discount_type', { length: 20 }).notNull().default('free'), // 'free', 'percentage', 'fixed_amount'
  getDiscountValue: decimal('get_discount_value', { precision: 10, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  couponIdIdx: index('idx_buy_x_get_y_coupon_id').on(table.couponId),
}));

// User-specific coupon assignments (for targeted marketing)
export const userCoupons = pgTable('user_coupons', {
  id: serial('id').primaryKey(),
  couponId: integer('coupon_id').notNull(),
  userId: uuid('user_id').notNull(),
  assignedBy: uuid('assigned_by').notNull(),
  assignedAt: timestamp('assigned_at').defaultNow(),
  usedAt: timestamp('used_at'),
  isUsed: boolean('is_used').default(false),
}, (table) => ({
  couponUserIdx: index('idx_user_coupons_coupon_user').on(table.couponId, table.userId),
  userIdIdx: index('idx_user_coupons_user_id').on(table.userId),
}));

// Automatic discount rules (cart-level discounts that apply automatically)
export const automaticDiscounts = pgTable('automatic_discounts', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 20 }).notNull(), // 'percentage', 'fixed_amount', 'free_shipping'
  value: decimal('value', { precision: 10, scale: 2 }).notNull(),
  minimumOrderAmount: decimal('minimum_order_amount', { precision: 10, scale: 2 }),
  maximumDiscountAmount: decimal('maximum_discount_amount', { precision: 10, scale: 2 }),
  priority: integer('priority').default(0), // Higher priority applies first
  isActive: boolean('is_active').default(true),
  stackable: boolean('stackable').default(false),
  validFrom: timestamp('valid_from').notNull(),
  validUntil: timestamp('valid_until').notNull(),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  activeIdx: index('idx_automatic_discounts_active').on(table.isActive),
  priorityIdx: index('idx_automatic_discounts_priority').on(table.priority),
  validityIdx: index('idx_automatic_discounts_validity').on(table.validFrom, table.validUntil),
}));

// Automatic discount conditions
export const automaticDiscountConditions = pgTable('automatic_discount_conditions', {
  id: serial('id').primaryKey(),
  discountId: integer('discount_id').notNull(),
  conditionType: varchar('condition_type', { length: 20 }).notNull(),
  conditionValue: text('condition_value').notNull(),
  isInclusive: boolean('is_inclusive').default(true),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  discountIdIdx: index('idx_auto_discount_conditions_discount_id').on(table.discountId),
}));

// Define relations
export const couponsRelations = relations(coupons, ({ one, many }) => ({
  creator: one(users, {
    fields: [coupons.createdBy],
    references: [users.id],
  }),
  usages: many(couponUsages),
  conditions: many(couponConditions),
  buyXGetYPromotion: one(buyXGetYPromotions, {
    fields: [coupons.id],
    references: [buyXGetYPromotions.couponId],
  }),
  userAssignments: many(userCoupons),
}));

export const couponUsagesRelations = relations(couponUsages, ({ one }) => ({
  coupon: one(coupons, {
    fields: [couponUsages.couponId],
    references: [coupons.id],
  }),
  user: one(users, {
    fields: [couponUsages.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [couponUsages.orderId],
    references: [orders.id],
  }),
}));

export const couponConditionsRelations = relations(couponConditions, ({ one }) => ({
  coupon: one(coupons, {
    fields: [couponConditions.couponId],
    references: [coupons.id],
  }),
}));

export const buyXGetYPromotionsRelations = relations(buyXGetYPromotions, ({ one }) => ({
  coupon: one(coupons, {
    fields: [buyXGetYPromotions.couponId],
    references: [coupons.id],
  }),
}));

export const userCouponsRelations = relations(userCoupons, ({ one }) => ({
  coupon: one(coupons, {
    fields: [userCoupons.couponId],
    references: [coupons.id],
  }),
  user: one(users, {
    fields: [userCoupons.userId],
    references: [users.id],
  }),
  assignedBy: one(users, {
    fields: [userCoupons.assignedBy],
    references: [users.id],
  }),
}));

export const automaticDiscountsRelations = relations(automaticDiscounts, ({ one, many }) => ({
  creator: one(users, {
    fields: [automaticDiscounts.createdBy],
    references: [users.id],
  }),
  conditions: many(automaticDiscountConditions),
}));

export const automaticDiscountConditionsRelations = relations(automaticDiscountConditions, ({ one }) => ({
  discount: one(automaticDiscounts, {
    fields: [automaticDiscountConditions.discountId],
    references: [automaticDiscounts.id],
  }),
}));

// Export types
export type Coupon = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;

export type CouponUsage = typeof couponUsages.$inferSelect;
export type NewCouponUsage = typeof couponUsages.$inferInsert;

export type CouponCondition = typeof couponConditions.$inferSelect;
export type NewCouponCondition = typeof couponConditions.$inferInsert;

export type BuyXGetYPromotion = typeof buyXGetYPromotions.$inferSelect;
export type NewBuyXGetYPromotion = typeof buyXGetYPromotions.$inferInsert;

export type UserCoupon = typeof userCoupons.$inferSelect;
export type NewUserCoupon = typeof userCoupons.$inferInsert;

export type AutomaticDiscount = typeof automaticDiscounts.$inferSelect;
export type NewAutomaticDiscount = typeof automaticDiscounts.$inferInsert;

export type AutomaticDiscountCondition = typeof automaticDiscountConditions.$inferSelect;
export type NewAutomaticDiscountCondition = typeof automaticDiscountConditions.$inferInsert;