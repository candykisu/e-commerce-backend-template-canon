import { z } from 'zod';

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - slug
 *         - sku
 *         - price
 *         - categoryId
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the product
 *         name:
 *           type: string
 *           description: Product name
 *         slug:
 *           type: string
 *           description: URL-friendly product identifier
 *         description:
 *           type: string
 *           description: Product description
 *         shortDescription:
 *           type: string
 *           description: Brief product description
 *         sku:
 *           type: string
 *           description: Stock Keeping Unit (unique identifier)
 *         price:
 *           type: number
 *           format: decimal
 *           description: Product price
 *         comparePrice:
 *           type: number
 *           format: decimal
 *           description: Compare at price (original price)
 *         costPrice:
 *           type: number
 *           format: decimal
 *           description: Cost price for profit calculation
 *         trackQuantity:
 *           type: boolean
 *           description: Whether to track inventory
 *         quantity:
 *           type: integer
 *           description: Available quantity
 *         allowBackorder:
 *           type: boolean
 *           description: Allow orders when out of stock
 *         weight:
 *           type: number
 *           format: decimal
 *           description: Product weight
 *         dimensions:
 *           type: object
 *           properties:
 *             length:
 *               type: number
 *             width:
 *               type: number
 *             height:
 *               type: number
 *             unit:
 *               type: string
 *         categoryId:
 *           type: integer
 *           description: Category ID
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Product tags
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: Product image URLs
 *         status:
 *           type: string
 *           enum: [draft, active, archived]
 *           description: Product status
 *         isFeatured:
 *           type: boolean
 *           description: Whether product is featured
 *         seoTitle:
 *           type: string
 *           description: SEO title
 *         seoDescription:
 *           type: string
 *           description: SEO description
 */

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(255),
    slug: z.string().min(1, 'Slug is required').max(255).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    description: z.string().optional(),
    shortDescription: z.string().optional(),
    sku: z.string().min(1, 'SKU is required').max(100),
    price: z.number().min(0, 'Price must be positive'),
    comparePrice: z.number().min(0).optional(),
    costPrice: z.number().min(0).optional(),
    trackQuantity: z.boolean().default(true),
    quantity: z.number().int().min(0).default(0),
    allowBackorder: z.boolean().default(false),
    weight: z.number().min(0).optional(),
    dimensions: z.object({
      length: z.number().min(0).optional(),
      width: z.number().min(0).optional(),
      height: z.number().min(0).optional(),
      unit: z.string().optional(),
    }).optional(),
    categoryId: z.number().int().positive('Category ID is required'),
    tags: z.array(z.string()).max(20).default([]),
    images: z.array(z.string().url('Invalid image URL')).max(10).default([]),
    status: z.enum(['draft', 'active', 'archived']).default('draft'),
    isFeatured: z.boolean().default(false),
    seoTitle: z.string().max(255).optional(),
    seoDescription: z.string().optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens').optional(),
    description: z.string().optional(),
    shortDescription: z.string().optional(),
    sku: z.string().min(1).max(100).optional(),
    price: z.number().min(0).optional(),
    comparePrice: z.number().min(0).optional(),
    costPrice: z.number().min(0).optional(),
    trackQuantity: z.boolean().optional(),
    quantity: z.number().int().min(0).optional(),
    allowBackorder: z.boolean().optional(),
    weight: z.number().min(0).optional(),
    dimensions: z.object({
      length: z.number().min(0).optional(),
      width: z.number().min(0).optional(),
      height: z.number().min(0).optional(),
      unit: z.string().optional(),
    }).optional(),
    categoryId: z.number().int().positive().optional(),
    tags: z.array(z.string()).max(20).optional(),
    images: z.array(z.string().url('Invalid image URL')).max(10).optional(),
    status: z.enum(['draft', 'active', 'archived']).optional(),
    isFeatured: z.boolean().optional(),
    seoTitle: z.string().max(255).optional(),
    seoDescription: z.string().optional(),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];