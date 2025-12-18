import { z } from 'zod';

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       required:
 *         - email
 *         - subtotal
 *         - total
 *         - shippingAddress
 *         - billingAddress
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the order
 *         orderNumber:
 *           type: string
 *           description: Unique order number
 *         userId:
 *           type: string
 *           format: uuid
 *           description: User ID (optional for guest orders)
 *         email:
 *           type: string
 *           format: email
 *           description: Customer email
 *         status:
 *           type: string
 *           enum: [pending, confirmed, processing, shipped, delivered, cancelled, refunded]
 *           description: Order status
 *         paymentStatus:
 *           type: string
 *           enum: [pending, paid, failed, refunded]
 *           description: Payment status
 *         subtotal:
 *           type: number
 *           format: decimal
 *           description: Subtotal amount
 *         taxAmount:
 *           type: number
 *           format: decimal
 *           description: Tax amount
 *         shippingAmount:
 *           type: number
 *           format: decimal
 *           description: Shipping amount
 *         discountAmount:
 *           type: number
 *           format: decimal
 *           description: Discount amount
 *         total:
 *           type: number
 *           format: decimal
 *           description: Total amount
 *         currency:
 *           type: string
 *           description: Currency code
 *         shippingAddress:
 *           type: object
 *           description: Shipping address details
 *         billingAddress:
 *           type: object
 *           description: Billing address details
 *         notes:
 *           type: string
 *           description: Order notes
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const addressSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  company: z.string().optional(),
  address1: z.string().min(1, 'Address line 1 is required'),
  address2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().optional(),
});

export const createOrderSchema = z.object({
  body: z.object({
    userId: z.string().uuid().optional(),
    email: z.string().email('Invalid email format'),
    subtotal: z.number().min(0, 'Subtotal must be positive'),
    taxAmount: z.number().min(0).default(0),
    shippingAmount: z.number().min(0).default(0),
    discountAmount: z.number().min(0).default(0),
    total: z.number().min(0, 'Total must be positive'),
    currency: z.string().length(3).default('USD'),
    shippingAddress: addressSchema,
    billingAddress: addressSchema,
    notes: z.string().optional(),
    items: z.array(z.object({
      productId: z.number().int().positive(),
      variantId: z.number().int().positive().optional(),
      quantity: z.number().int().min(1),
      price: z.number().min(0),
    })).min(1, 'At least one item is required'),
  }),
});

export const updateOrderSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).optional(),
    paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
    notes: z.string().optional(),
    shippingAddress: addressSchema.optional(),
    billingAddress: addressSchema.optional(),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
    notes: z.string().optional(),
  }),
});

export const updatePaymentStatusSchema = z.object({
  body: z.object({
    paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']),
    notes: z.string().optional(),
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>['body'];
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>['body'];
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>['body'];
export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>['body'];
export type OrderItemInput = CreateOrderInput['items'][0];