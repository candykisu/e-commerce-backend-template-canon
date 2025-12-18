import { Category } from '../models/ecommerce.schema';

/**
 * Converts a Category object to a DTO
 */
export const toCategoryDto = (category: Category) => {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image,
    parentId: category.parentId,
    isActive: category.isActive,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
};

/**
 * Converts a Category object to a minimal DTO (for dropdowns, etc.)
 */
export const toCategoryMinimalDto = (category: Category) => {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
  };
};