import { Request, Response } from 'express';
import * as productService from '../services/product.service';
import { toProductDto, toProductMinimalDto, toProductPublicDto } from '../mappers/product.mapper';
import { CreateProductInput, UpdateProductInput } from '../schemas/product.schema';
import { asyncHandler } from '../utils/asyncHandler';
import { success as successMessages } from '../constants/messages';
import { sendSuccessResponse } from '../utils/responseHandler';

/**
 * Create a new product
 */
export const createProduct = asyncHandler(
  async (req: Request<object, object, CreateProductInput>, res: Response): Promise<void> => {
    const product = await productService.createProduct(req.body);
    const productDto = toProductDto(product);

    sendSuccessResponse(res, 201, successMessages.CREATED('Product'), productDto);
  }
);

/**
 * Get all products with pagination and filtering
 */
export const getProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
  const status = req.query.status as string;
  const isFeatured = req.query.isFeatured !== undefined ? req.query.isFeatured === 'true' : undefined;
  const search = req.query.search as string;
  const tags = req.query.tags ? (req.query.tags as string).split(',') : undefined;

  const result = await productService.getProducts(page, limit, categoryId, status, isFeatured, search, tags);
  const productsDto = result.products.map(toProductDto);

  sendSuccessResponse(res, 200, successMessages.FETCHED('Products'), productsDto, {
    page,
    limit,
    total: result.total,
    pages: Math.ceil(result.total / limit),
  });
});

/**
 * Get product by ID
 */
export const getProductById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const product = await productService.getProductById(id);
  const productDto = toProductDto(product);

  sendSuccessResponse(res, 200, successMessages.FETCHED('Product'), productDto);
});

/**
 * Get product by slug
 */
export const getProductBySlug = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { slug } = req.params;
  const product = await productService.getProductBySlug(slug);
  const productDto = toProductPublicDto(product);

  sendSuccessResponse(res, 200, successMessages.FETCHED('Product'), productDto);
});

/**
 * Update product
 */
export const updateProduct = asyncHandler(
  async (req: Request<{ id: string }, object, UpdateProductInput>, res: Response): Promise<void> => {
    const { id } = req.params;
    const product = await productService.updateProduct(id, req.body);
    const productDto = toProductDto(product);

    sendSuccessResponse(res, 200, successMessages.UPDATED('Product'), productDto);
  }
);

/**
 * Delete product (archive)
 */
export const deleteProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  await productService.deleteProduct(id);
  res.status(204).send();
});

/**
 * Update product inventory
 */
export const updateProductInventory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (typeof quantity !== 'number' || quantity < 0) {
    res.status(400).json({ message: 'Invalid quantity' });
    return;
  }

  await productService.updateProductInventory(id, quantity);
  sendSuccessResponse(res, 200, 'Inventory updated successfully');
});

/**
 * Get featured products
 */
export const getFeaturedProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const limit = parseInt(req.query.limit as string) || 10;
  const products = await productService.getFeaturedProducts(limit);
  const productsDto = products.map(toProductMinimalDto);

  sendSuccessResponse(res, 200, successMessages.FETCHED('Featured products'), productsDto);
});

/**
 * Get products by category
 */
export const getProductsByCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { categoryId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await productService.getProductsByCategory(categoryId, page, limit);
  const productsDto = result.products.map(toProductPublicDto);

  sendSuccessResponse(res, 200, successMessages.FETCHED('Products'), productsDto, {
    page,
    limit,
    total: result.total,
    pages: Math.ceil(result.total / limit),
  });
});

/**
 * Search products
 */
export const searchProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { q } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  if (!q || typeof q !== 'string') {
    res.status(400).json({ message: 'Search query is required' });
    return;
  }

  const result = await productService.searchProducts(q, page, limit);
  const productsDto = result.products.map(toProductPublicDto);

  sendSuccessResponse(res, 200, successMessages.FETCHED('Products'), productsDto, {
    page,
    limit,
    total: result.total,
    pages: Math.ceil(result.total / limit),
  });
});