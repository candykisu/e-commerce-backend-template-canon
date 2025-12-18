import { z } from 'zod';

/**
 * @swagger
 * components:
 *   schemas:
 *     AdminDashboard:
 *       type: object
 *       properties:
 *         totalOrders:
 *           type: integer
 *         totalRevenue:
 *           type: number
 *         totalCustomers:
 *           type: integer
 *         totalProducts:
 *           type: integer
 *         recentOrders:
 *           type: array
 *         topProducts:
 *           type: array
 *         salesChart:
 *           type: array
 */

export const adminDateRangeSchema = z.object({
  query: z.object({
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    period: z.enum(['today', 'week', 'month', 'quarter', 'year']).optional(),
  }),
});

export const adminBulkActionSchema = z.object({
  body: z.object({
    action: z.enum(['activate', 'deactivate', 'delete', 'archive']),
    ids: z.array(z.number().int().positive()).min(1, 'At least one ID is required'),
    reason: z.string().optional(),
  }),
});

export const adminInventoryUpdateSchema = z.object({
  body: z.object({
    updates: z.array(z.object({
      productId: z.number().int().positive(),
      quantity: z.number().int().min(0),
      reason: z.string().optional(),
    })).min(1, 'At least one update is required'),
  }),
});

export const adminOrderBulkUpdateSchema = z.object({
  body: z.object({
    orderIds: z.array(z.number().int().positive()).min(1, 'At least one order ID is required'),
    status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
    notes: z.string().optional(),
  }),
});

export const adminReportSchema = z.object({
  query: z.object({
    type: z.enum(['sales', 'products', 'customers', 'inventory']),
    format: z.enum(['json', 'csv']).default('json'),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }),
});

export type AdminDateRangeInput = z.infer<typeof adminDateRangeSchema>['query'];
export type AdminBulkActionInput = z.infer<typeof adminBulkActionSchema>['body'];
export type AdminInventoryUpdateInput = z.infer<typeof adminInventoryUpdateSchema>['body'];
export type AdminOrderBulkUpdateInput = z.infer<typeof adminOrderBulkUpdateSchema>['body'];
export type AdminReportInput = z.infer<typeof adminReportSchema>['query'];