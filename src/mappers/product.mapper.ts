import { Product } from '../models/ecommerce.schema';

/**
 * Converts a Product object to a DTO
 */
export const toProductDto = (product: Product & { category?: any }) => {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    sku: product.sku,
    price: parseFloat(product.price),
    comparePrice: product.comparePrice ? parseFloat(product.comparePrice) : null,
    costPrice: product.costPrice ? parseFloat(product.costPrice) : null,
    trackQuantity: product.trackQuantity,
    quantity: product.quantity,
    allowBackorder: product.allowBackorder,
    weight: product.weight ? parseFloat(product.weight) : null,
    dimensions: product.dimensions,
    categoryId: product.categoryId,
    category: product.category ? {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
    } : null,
    tags: product.tags,
    images: product.images,
    status: product.status,
    isFeatured: product.isFeatured,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
};

/**
 * Converts a Product object to a minimal DTO (for listings, search results)
 */
export const toProductMinimalDto = (product: Product) => {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    sku: product.sku,
    price: parseFloat(product.price),
    comparePrice: product.comparePrice ? parseFloat(product.comparePrice) : null,
    quantity: product.quantity,
    images: product.images?.slice(0, 1) || [], // Only first image
    status: product.status,
    isFeatured: product.isFeatured,
  };
};

/**
 * Converts a Product object to a public DTO (for storefront)
 */
export const toProductPublicDto = (product: Product & { category?: any }) => {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    price: parseFloat(product.price),
    comparePrice: product.comparePrice ? parseFloat(product.comparePrice) : null,
    quantity: product.trackQuantity ? product.quantity : null,
    allowBackorder: product.allowBackorder,
    weight: product.weight ? parseFloat(product.weight) : null,
    dimensions: product.dimensions,
    category: product.category ? {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
    } : null,
    tags: product.tags,
    images: product.images,
    isFeatured: product.isFeatured,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
  };
};