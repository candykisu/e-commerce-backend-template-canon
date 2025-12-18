import { Product } from '../models/ecommerce.schema';
import * as productRepository from '../repositories/product.repository';
import * as categoryRepository from '../repositories/category.repository';
import { CreateProductInput, UpdateProductInput } from '../schemas/product.schema';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/ApiError';
import { error as errorMessages } from '../constants/messages';

/**
 * Create a new product
 */
export const createProduct = async (productData: CreateProductInput): Promise<Product> => {
  // Check if SKU already exists
  const existingProduct = await productRepository.findBySku(productData.sku);
  if (existingProduct) {
    throw new ConflictError('Product with this SKU already exists');
  }

  // Check if slug already exists
  const existingSlug = await productRepository.findBySlug(productData.slug);
  if (existingSlug) {
    throw new ConflictError('Product with this slug already exists');
  }

  // Verify category exists
  const category = await categoryRepository.findById(productData.categoryId);
  if (!category) {
    throw new BadRequestError('Category not found');
  }

  return productRepository.create(productData);
};

/**
 * Get all products with pagination and filtering
 */
export const getProducts = async (
  page: number = 1,
  limit: number = 10,
  categoryId?: number,
  status?: string,
  isFeatured?: boolean,
  search?: string,
  tags?: string[]
): Promise<{
  products: Product[];
  total: number;
}> => {
  return productRepository.find(page, limit, categoryId, status, isFeatured, search, tags);
};

/**
 * Get product by ID
 */
export const getProductById = async (productId: string): Promise<Product> => {
  const id = parseInt(productId);
  if (isNaN(id)) {
    throw new BadRequestError(errorMessages.INVALID_ID('Product'));
  }

  const product = await productRepository.findById(id);
  if (!product) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Product'));
  }
  return product;
};

/**
 * Get product by slug
 */
export const getProductBySlug = async (slug: string): Promise<Product> => {
  const product = await productRepository.findBySlug(slug);
  if (!product) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Product'));
  }
  return product;
};

/**
 * Update product
 */
export const updateProduct = async (
  productId: string,
  updateData: UpdateProductInput
): Promise<Product> => {
  const id = parseInt(productId);
  if (isNaN(id)) {
    throw new BadRequestError(errorMessages.INVALID_ID('Product'));
  }

  // If SKU is being updated, check for conflicts
  if (updateData.sku) {
    const existingProduct = await productRepository.findBySku(updateData.sku);
    if (existingProduct && existingProduct.id !== id) {
      throw new ConflictError('Product with this SKU already exists');
    }
  }

  // If slug is being updated, check for conflicts
  if (updateData.slug) {
    const existingSlug = await productRepository.findBySlug(updateData.slug);
    if (existingSlug && existingSlug.id !== id) {
      throw new ConflictError('Product with this slug already exists');
    }
  }

  // If category is being updated, verify it exists
  if (updateData.categoryId) {
    const category = await categoryRepository.findById(updateData.categoryId);
    if (!category) {
      throw new BadRequestError('Category not found');
    }
  }

  const product = await productRepository.update(id, updateData);
  if (!product) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Product'));
  }
  return product;
};

/**
 * Delete product (soft delete - archive)
 */
export const deleteProduct = async (productId: string): Promise<boolean> => {
  const id = parseInt(productId);
  if (isNaN(id)) {
    throw new BadRequestError(errorMessages.INVALID_ID('Product'));
  }

  const success = await productRepository.softDelete(id);
  if (!success) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Product'));
  }
  return true;
};

/**
 * Update product inventory
 */
export const updateProductInventory = async (
  productId: string,
  quantity: number
): Promise<boolean> => {
  const id = parseInt(productId);
  if (isNaN(id)) {
    throw new BadRequestError(errorMessages.INVALID_ID('Product'));
  }

  if (quantity < 0) {
    throw new BadRequestError('Quantity cannot be negative');
  }

  const success = await productRepository.updateInventory(id, quantity);
  if (!success) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Product'));
  }
  return true;
};

/**
 * Get featured products
 */
export const getFeaturedProducts = async (limit: number = 10): Promise<Product[]> => {
  return productRepository.getFeaturedProducts(limit);
};

/**
 * Get products by category
 */
export const getProductsByCategory = async (
  categoryId: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  products: Product[];
  total: number;
}> => {
  const id = parseInt(categoryId);
  if (isNaN(id)) {
    throw new BadRequestError(errorMessages.INVALID_ID('Category'));
  }

  // Verify category exists
  const category = await categoryRepository.findById(id);
  if (!category) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Category'));
  }

  return productRepository.find(page, limit, id, 'active');
};

/**
 * Search products
 */
export const searchProducts = async (
  searchTerm: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  products: Product[];
  total: number;
}> => {
  return productRepository.find(page, limit, undefined, 'active', undefined, searchTerm);
};