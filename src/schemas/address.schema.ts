import { z } from 'zod';

/**
 * @swagger
 * components:
 *   schemas:
 *     Address:
 *       type: object
 *       required:
 *         - userId
 *         - type
 *         - firstName
 *         - lastName
 *         - address1
 *         - city
 *         - state
 *         - postalCode
 *         - country
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the address
 *         userId:
 *           type: string
 *           format: uuid
 *           description: User ID who owns this address
 *         type:
 *           type: string
 *           enum: [billing, shipping]
 *           description: Address type
 *         firstName:
 *           type: string
 *           description: First name
 *         lastName:
 *           type: string
 *           description: Last name
 *         company:
 *           type: string
 *           description: Company name (optional)
 *         address1:
 *           type: string
 *           description: Address line 1
 *         address2:
 *           type: string
 *           description: Address line 2 (optional)
 *         city:
 *           type: string
 *           description: City
 *         state:
 *           type: string
 *           description: State/Province
 *         postalCode:
 *           type: string
 *           description: Postal/ZIP code
 *         country:
 *           type: string
 *           description: Country
 *         phone:
 *           type: string
 *           description: Phone number (optional)
 *         isDefault:
 *           type: boolean
 *           description: Whether this is the default address for this type
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

export const createAddressSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID'),
    type: z.enum(['billing', 'shipping']),
    firstName: z.string().min(1, 'First name is required').max(100),
    lastName: z.string().min(1, 'Last name is required').max(100),
    company: z.string().max(100).optional(),
    address1: z.string().min(1, 'Address line 1 is required'),
    address2: z.string().optional(),
    city: z.string().min(1, 'City is required').max(100),
    state: z.string().min(1, 'State is required').max(100),
    postalCode: z.string().min(1, 'Postal code is required').max(20),
    country: z.string().min(1, 'Country is required').max(100),
    phone: z.string().max(20).optional(),
    isDefault: z.boolean().default(false),
  }),
});

export const updateAddressSchema = z.object({
  body: z.object({
    type: z.enum(['billing', 'shipping']).optional(),
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    company: z.string().max(100).optional(),
    address1: z.string().min(1).optional(),
    address2: z.string().optional(),
    city: z.string().min(1).max(100).optional(),
    state: z.string().min(1).max(100).optional(),
    postalCode: z.string().min(1).max(20).optional(),
    country: z.string().min(1).max(100).optional(),
    phone: z.string().max(20).optional(),
    isDefault: z.boolean().optional(),
  }),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>['body'];
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>['body'];