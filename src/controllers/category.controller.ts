import { Request, Response } from 'express';
import * as categoryService from '../services/category.service';
import { toCategoryDto } from '../mappers/category.mapper';
import { CreateCategoryInput, UpdateCategoryInput } from '../schemas/category.schema';
import { asyncHandler } from '../utils/asyncHandler';
import { success as successMessages } from '../constants/messages';
import { sendSuccessResponse } from '../utils/responseHandler';

/**
 * Create a new category
 */
export const createCategory = asyncHandler(
  async (req: Request<object, object, CreateCategoryInput>, res: Response): Promise<void> => {
    const category = await categoryService.createCategory(req.body);
    const categoryDto = toCategoryDto(category);

    sendSuccessResponse(res, 201, successMessages.CREATED('Category'), categoryDto);
  }
);

/**
 * Get all categories with pagination and filtering
 */
export const getCategories = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
  const parentId = req.query.parentId ? parseInt(req.query.parentId as string) : undefined;
  const search = req.query.search as string;

  const result = await categoryService.getCategories(page, limit, isActive, parentId, search);
  const categoriesDto = result.categories.map(toCategoryDto);

  sendSuccessResponse(res, 200, successMessages.FETCHED('Categories'), categoriesDto, {
    page,
    limit,
    total: result.total,
    pages: Math.ceil(result.total / limit),
  });
});

/**
 * Get category by ID
 */
export const getCategoryById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const category = await categoryService.getCategoryById(id);
  const categoryDto = toCategoryDto(category);

  sendSuccessResponse(res, 200, successMessages.FETCHED('Category'), categoryDto);
});

/**
 * Get category by slug
 */
export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { slug } = req.params;
  const category = await categoryService.getCategoryBySlug(slug);
  const categoryDto = toCategoryDto(category);

  sendSuccessResponse(res, 200, successMessages.FETCHED('Category'), categoryDto);
});

/**
 * Update category
 */
export const updateCategory = asyncHandler(
  async (req: Request<{ id: string }, object, UpdateCategoryInput>, res: Response): Promise<void> => {
    const { id } = req.params;
    const category = await categoryService.updateCategory(id, req.body);
    const categoryDto = toCategoryDto(category);

    sendSuccessResponse(res, 200, successMessages.UPDATED('Category'), categoryDto);
  }
);

/**
 * Delete category (soft delete)
 */
export const deleteCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  await categoryService.deleteCategory(id);
  res.status(204).send();
});

/**
 * Get category hierarchy
 */
export const getCategoryHierarchy = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const categories = await categoryService.getCategoryHierarchy();
  const categoriesDto = categories.map(toCategoryDto);

  sendSuccessResponse(res, 200, successMessages.FETCHED('Category hierarchy'), categoriesDto);
});

/**
 * Get child categories
 */
export const getChildCategories = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { parentId } = req.params;
  const categories = await categoryService.getChildCategories(parentId);
  const categoriesDto = categories.map(toCategoryDto);

  sendSuccessResponse(res, 200, successMessages.FETCHED('Child categories'), categoriesDto);
});

/**
 * Get root categories
 */
export const getRootCategories = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const categories = await categoryService.getRootCategories();
  const categoriesDto = categories.map(toCategoryDto);

  sendSuccessResponse(res, 200, successMessages.FETCHED('Root categories'), categoriesDto);
});