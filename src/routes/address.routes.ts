import { Router } from 'express';
import * as addressController from '../controllers/address.controller';
import { validate } from '../middlewares/validate';
import { createAddressSchema, updateAddressSchema } from '../schemas/address.schema';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Addresses
 *   description: Address management API
 */

/**
 * @swagger
 * /addresses:
 *   post:
 *     summary: Create a new address
 *     tags: [Addresses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - type
 *               - firstName
 *               - lastName
 *               - address1
 *               - city
 *               - state
 *               - postalCode
 *               - country
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [billing, shipping]
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               company:
 *                 type: string
 *               address1:
 *                 type: string
 *               address2:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               country:
 *                 type: string
 *               phone:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Address created successfully
 *       400:
 *         description: Bad request
 */
router.post('/', validate(createAddressSchema), addressController.createAddress);

/**
 * @swagger
 * /addresses/{id}:
 *   get:
 *     summary: Get address by ID
 *     tags: [Addresses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Address retrieved successfully
 *       404:
 *         description: Address not found
 */
router.get('/:id', addressController.getAddressById);

/**
 * @swagger
 * /addresses/user/{userId}:
 *   get:
 *     summary: Get addresses for a user
 *     tags: [Addresses]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [billing, shipping]
 *     responses:
 *       200:
 *         description: Addresses retrieved successfully
 *       404:
 *         description: User not found
 */
router.get('/user/:userId', addressController.getUserAddresses);

/**
 * @swagger
 * /addresses/user/{userId}/shipping:
 *   get:
 *     summary: Get shipping addresses for a user
 *     tags: [Addresses]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Shipping addresses retrieved successfully
 */
router.get('/user/:userId/shipping', addressController.getShippingAddresses);

/**
 * @swagger
 * /addresses/user/{userId}/billing:
 *   get:
 *     summary: Get billing addresses for a user
 *     tags: [Addresses]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Billing addresses retrieved successfully
 */
router.get('/user/:userId/billing', addressController.getBillingAddresses);

/**
 * @swagger
 * /addresses/user/{userId}/default:
 *   get:
 *     summary: Get default address for a user
 *     tags: [Addresses]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [billing, shipping]
 *     responses:
 *       200:
 *         description: Default address retrieved successfully
 *       404:
 *         description: No default address found
 */
router.get('/user/:userId/default', addressController.getDefaultAddress);

/**
 * @swagger
 * /addresses/user/{userId}/{id}:
 *   get:
 *     summary: Get user's address by ID
 *     tags: [Addresses]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Address retrieved successfully
 *       404:
 *         description: Address not found
 */
router.get('/user/:userId/:id', addressController.getUserAddressById);

/**
 * @swagger
 * /addresses/user/{userId}/{id}:
 *   put:
 *     summary: Update user's address
 *     tags: [Addresses]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *               type:
 *                 type: string
 *                 enum: [billing, shipping]
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               company:
 *                 type: string
 *               address1:
 *                 type: string
 *               address2:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               country:
 *                 type: string
 *               phone:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Address updated successfully
 *       404:
 *         description: Address not found
 */
router.put('/user/:userId/:id', validate(updateAddressSchema), addressController.updateAddress);

/**
 * @swagger
 * /addresses/user/{userId}/{id}/default:
 *   put:
 *     summary: Set address as default
 *     tags: [Addresses]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [billing, shipping]
 *     responses:
 *       200:
 *         description: Address set as default successfully
 *       400:
 *         description: Invalid address type
 *       404:
 *         description: Address not found
 */
router.put('/user/:userId/:id/default', addressController.setDefaultAddress);

/**
 * @swagger
 * /addresses/user/{userId}/{id}:
 *   delete:
 *     summary: Delete user's address
 *     tags: [Addresses]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Address deleted successfully
 *       404:
 *         description: Address not found
 */
router.delete('/user/:userId/:id', addressController.deleteAddress);

export default router;