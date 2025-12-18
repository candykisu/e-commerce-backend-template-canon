import { Router } from 'express';
import * as productController from '../controllers/product.controller';
import { validate } from '../middlewares/validate';
import { createProductSchema, updateProductSchema } from '../schemas/product.schema';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management API
 */

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - slug
 *               - sku
 *               - price
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               shortDescription:
 *                 type: string
 *               sku:
 *                 type: string
 *               price:
 *                 type: number
 *               comparePrice:
 *                 type: number
 *               costPrice:
 *                 type: number
 *               trackQuantity:
 *                 type: boolean
 *               quantity:
 *                 type: integer
 *               allowBackorder:
 *                 type: boolean
 *               weight:
 *                 type: number
 *               dimensions:
 *                 type: object
 *               categoryId:
 *                 type: integer
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [draft, active, archived]
 *               isFeatured:
 *                 type: boolean
 *               seoTitle:
 *                 type: string
 *               seoDescription:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Bad request
 *       409:
 *         description: SKU or slug already exists
 */
router.post('/', validate(createProductSchema), productController.createProduct);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products with pagination and filtering
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, active, archived]
 *       - in: query
 *         name: isFeatured
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *           description: Comma-separated list of tags
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 */
router.get('/', productController.getProducts);

/**
 * @swagger
 * /products/featured:
 *   get:
 *     summary: Get featured products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Featured products retrieved successfully
 */
router.get('/featured', productController.getFeaturedProducts);

/**
 * @swagger
 * /products/search:
 *   get:
 *     summary: Search products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Products found
 *       400:
 *         description: Search query required
 */
router.get('/search', productController.searchProducts);

/**
 * @swagger
 * /products/category/{categoryId}:
 *   get:
 *     summary: Get products by category
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *       404:
 *         description: Category not found
 */
router.get('/category/:categoryId', productController.getProductsByCategory);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       404:
 *         description: Product not found
 */
router.get('/:id', productController.getProductById);

/**
 * @swagger
 * /products/slug/{slug}:
 *   get:
 *     summary: Get product by slug
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       404:
 *         description: Product not found
 */
router.get('/slug/:slug', productController.getProductBySlug);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Products]
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
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               shortDescription:
 *                 type: string
 *               sku:
 *                 type: string
 *               price:
 *                 type: number
 *               comparePrice:
 *                 type: number
 *               costPrice:
 *                 type: number
 *               trackQuantity:
 *                 type: boolean
 *               quantity:
 *                 type: integer
 *               allowBackorder:
 *                 type: boolean
 *               weight:
 *                 type: number
 *               dimensions:
 *                 type: object
 *               categoryId:
 *                 type: integer
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [draft, active, archived]
 *               isFeatured:
 *                 type: boolean
 *               seoTitle:
 *                 type: string
 *               seoDescription:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 *       409:
 *         description: SKU or slug already exists
 */
router.put('/:id', validate(updateProductSchema), productController.updateProduct);

/**
 * @swagger
 * /products/{id}/inventory:
 *   put:
 *     summary: Update product inventory
 *     tags: [Products]
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
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Inventory updated successfully
 *       400:
 *         description: Invalid quantity
 *       404:
 *         description: Product not found
 */
router.put('/:id/inventory', productController.updateProductInventory);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Archive product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Product archived successfully
 *       404:
 *         description: Product not found
 */
router.delete('/:id', productController.deleteProduct);

export default router;