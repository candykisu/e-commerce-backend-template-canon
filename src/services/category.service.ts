import { Category } from '../models/ecommerce.schema';
import * as categoryRepository from '../repositories/category.repository';
import { CreateCategoryInput, UpdateCategoryInput } from '../schemas/category.schema';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/ApiError';
import { error as errorMessages } from '../constants/messages';

/**
 * Create a new category
 */
export const createCategory = async (categoryData: CreateCategoryInput): Promise<Category> => {
  // Check if slug already exists
  const existingCategory = await categoryRepository.findBySlug(categoryData.slug);
  if (existingCategory) {
    throw new ConflictError('Category with this slug already exists');
  }

  // If parentId is provided, verify parent exists
  if (categoryData.parentId) {
    const parentCategory = await categoryRepository.findById(categoryData.parentId);
    if (!parentCategory) {
      throw new BadRequestError('Parent category not found');
    }
  }

  return categoryRepository.create(categoryData);
};

/**
 * Get all categories with pagination and filtering
 */
export const getCategories = async (
  page: number = 1,
  limit: number = 10,
  isActive?: boolean,
  parentId?: number | null,
  search?: string
): Promise<{
  categories: Category[];
  total: number;
}> => {
  return categoryRepository.find(page, limit, isActive, parentId, search);
};

/**
 * Get category by ID
 */
export const getCategoryById = async (categoryId: string): Promise<Category> => {
  const id = parseInt(categoryId);
  if (isNaN(id)) {
    throw new BadRequestError(errorMessages.INVALID_ID('Category'));
  }

  const category = await categoryRepository.findById(id);
  if (!category) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Category'));
  }
  return category;
};

/**
 * Get category by slug
 */
export const getCategoryBySlug = async (slug: string): Promise<Category> => {
  const category = await categoryRepository.findBySlug(slug);
  if (!category) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Category'));
  }
  return category;
};

/**
 * Update category
 */
export const updateCategory = async (
  categoryId: string,
  updateData: UpdateCategoryInput
): Promise<Category> => {
  const id = parseInt(categoryId);
  if (isNaN(id)) {
    throw new BadRequestError(errorMessages.INVALID_ID('Category'));
  }

  // If slug is being updated, check for conflicts
  if (updateData.slug) {
    const existingCategory = await categoryRepository.findBySlug(updateData.slug);
    if (existingCategory && existingCategory.id !== id) {
      throw new ConflictError('Category with this slug already exists');
    }
  }

  // If parentId is being updated, verify parent exists and prevent circular reference
  if (updateData.parentId) {
    const parentCategory = await categoryRepository.findById(updateData.parentId);
    if (!parentCategory) {
      throw new BadRequestError('Parent category not found');
    }
    
    // Prevent setting parent to self
    if (updateData.parentId === id) {
      throw new BadRequestError('Category cannot be its own parent');
    }
  }

  const category = await categoryRepository.update(id, updateData);
  if (!category) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Category'));
  }
  return category;
};

/**
 * Delete category (soft delete)
 */
export const deleteCategory = async (categoryId: string): Promise<boolean> => {
  const id = parseInt(categoryId);
  if (isNaN(id)) {
    throw new BadRequestError(errorMessages.INVALID_ID('Category'));
  }

  const success = await categoryRepository.softDelete(id);
  if (!success) {
    throw new NotFoundError(errorMessages.NOT_FOUND('Category'));
  }
  return true;
};

/**
 * Get category hierarchy (all categories in tree structure)
 */
export const getCategoryHierarchy = async (): Promise<Category[]> => {
  return categoryRepository.getHierarchy();
};

/**
 * Get child categories
 */
export const getChildCategories = async (parentId: string): Promise<Category[]> => {
  const id = parseInt(parentId);
  if (isNaN(id)) {
    throw new BadRequestError(errorMessages.INVALID_ID('Category'));
  }

  return categoryRepository.getChildren(id);
};

/**
 * Get root categories (categories without parent)
 */
export const getRootCategories = async (): Promise<Category[]> => {
  const result = await categoryRepository.find(1, 100, true, null);
  return result.categories;
};