import { eq, and, desc, sql, like, or, inArray } from 'drizzle-orm';
import { db } from '../db';
import { products, NewProduct, categories, Product } from '../models/ecommerce.schema';
import { logger } from '../utils';
import { CreateProductInput, UpdateProductInput } from '../schemas/product.schema';

// Type for product with category info
type ProductWithCategory = Product & {
  category?: {
    id: number;
    name: string;
    slug: string;
  } | null;
};

export const create = async (productData: CreateProductInput): Promise<typeof products.$inferSelect> => {
  try {
    logger.info('Creating new product in repository', { name: productData.name, sku: productData.sku });

    const newProduct: NewProduct = {
      name: productData.name,
      slug: productData.slug,
      description: productData.description,
      shortDescription: productData.shortDescription,
      sku: productData.sku,
      price: productData.price.toString(),
      comparePrice: productData.comparePrice?.toString(),
      costPrice: productData.costPrice?.toString(),
      trackQuantity: productData.trackQuantity,
      quantity: productData.quantity,
      allowBackorder: productData.allowBackorder,
      weight: productData.weight?.toString(),
      dimensions: productData.dimensions,
      categoryId: productData.categoryId,
      tags: productData.tags,
      images: productData.images,
      status: productData.status || 'draft',
      isFeatured: productData.isFeatured,
      seoTitle: productData.seoTitle,
      seoDescription: productData.seoDescription,
    };

    const [savedProduct] = await db.insert(products).values(newProduct).returning();

    logger.info('Product created successfully in repository', { productId: savedProduct.id });
    return savedProduct;
  } catch (error) {
    logger.error('Error creating product in repository:', error);
    throw error;
  }
};

export const find = async (
  page: number = 1,
  limit: number = 10,
  categoryId?: number,
  status?: string,
  isFeatured?: boolean,
  search?: string,
  tags?: string[]
): Promise<{
  products: ProductWithCategory[];
  total: number;
}> => {
  try {
    const offset = (page - 1) * limit;
    const conditions = [];

    if (categoryId) conditions.push(eq(products.categoryId, categoryId));
    if (status) conditions.push(eq(products.status, status));
    if (isFeatured !== undefined) conditions.push(eq(products.isFeatured, isFeatured));
    if (search) {
      conditions.push(
        or(
          like(products.name, `%${search}%`),
          like(products.description, `%${search}%`),
          like(products.sku, `%${search}%`)
        )
      );
    }
    if (tags && tags.length > 0) {
      // PostgreSQL array overlap operator
      conditions.push(sql`${products.tags} && ${tags}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [resultProducts, totalResult] = await Promise.all([
      db
        .select({
          id: products.id,
          name: products.name,
          slug: products.slug,
          description: products.description,
          shortDescription: products.shortDescription,
          sku: products.sku,
          price: products.price,
          comparePrice: products.comparePrice,
          costPrice: products.costPrice,
          trackQuantity: products.trackQuantity,
          quantity: products.quantity,
          allowBackorder: products.allowBackorder,
          weight: products.weight,
          dimensions: products.dimensions,
          categoryId: products.categoryId,
          tags: products.tags,
          images: products.images,
          status: products.status,
          isFeatured: products.isFeatured,
          seoTitle: products.seoTitle,
          seoDescription: products.seoDescription,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
          category: {
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
          },
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(products.createdAt)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    logger.info('Products retrieved successfully from repository', {
      count: resultProducts.length,
      page,
      limit,
    });
    return { products: resultProducts, total };
  } catch (error) {
    logger.error('Error retrieving products from repository:', error);
    throw error;
  }
};

export const findById = async (productId: number): Promise<ProductWithCategory | null> => {
  try {
    const [product] = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        description: products.description,
        shortDescription: products.shortDescription,
        sku: products.sku,
        price: products.price,
        comparePrice: products.comparePrice,
        costPrice: products.costPrice,
        trackQuantity: products.trackQuantity,
        quantity: products.quantity,
        allowBackorder: products.allowBackorder,
        weight: products.weight,
        dimensions: products.dimensions,
        categoryId: products.categoryId,
        tags: products.tags,
        images: products.images,
        status: products.status,
        isFeatured: products.isFeatured,
        seoTitle: products.seoTitle,
        seoDescription: products.seoDescription,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        },
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, productId));

    if (!product) {
      logger.warn('Product not found in repository', { productId });
      return null;
    }

    logger.info('Product retrieved successfully from repository', { productId });
    return product;
  } catch (error) {
    logger.error('Error retrieving product from repository:', error);
    throw error;
  }
};

export const findBySlug = async (slug: string): Promise<ProductWithCategory | null> => {
  try {
    const [product] = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        description: products.description,
        shortDescription: products.shortDescription,
        sku: products.sku,
        price: products.price,
        comparePrice: products.comparePrice,
        costPrice: products.costPrice,
        trackQuantity: products.trackQuantity,
        quantity: products.quantity,
        allowBackorder: products.allowBackorder,
        weight: products.weight,
        dimensions: products.dimensions,
        categoryId: products.categoryId,
        tags: products.tags,
        images: products.images,
        status: products.status,
        isFeatured: products.isFeatured,
        seoTitle: products.seoTitle,
        seoDescription: products.seoDescription,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        },
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.slug, slug));

    return product || null;
  } catch (error) {
    logger.error('Error finding product by slug:', error);
    throw error;
  }
};

export const findBySku = async (sku: string): Promise<typeof products.$inferSelect | null> => {
  try {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.sku, sku));

    return product || null;
  } catch (error) {
    logger.error('Error finding product by SKU:', error);
    throw error;
  }
};

export const update = async (
  productId: number,
  updateData: UpdateProductInput
): Promise<typeof products.$inferSelect | null> => {
  try {
    const updateValues: Partial<NewProduct> = {
      ...updateData,
      price: updateData.price?.toString(),
      comparePrice: updateData.comparePrice?.toString(),
      costPrice: updateData.costPrice?.toString(),
      weight: updateData.weight?.toString(),
      updatedAt: new Date(),
    };

    const [product] = await db
      .update(products)
      .set(updateValues)
      .where(eq(products.id, productId))
      .returning();

    if (!product) {
      logger.warn('Product not found for update in repository', { productId });
      return null;
    }

    logger.info('Product updated successfully in repository', { productId });
    return product;
  } catch (error) {
    logger.error('Error updating product in repository:', error);
    throw error;
  }
};

export const softDelete = async (productId: number): Promise<boolean> => {
  try {
    const [product] = await db
      .update(products)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(eq(products.id, productId))
      .returning({ id: products.id });

    if (!product) {
      logger.warn('Product not found for deletion in repository', { productId });
      return false;
    }

    logger.info('Product archived successfully in repository', { productId });
    return true;
  } catch (error) {
    logger.error('Error archiving product in repository:', error);
    throw error;
  }
};

export const updateInventory = async (productId: number, quantity: number): Promise<boolean> => {
  try {
    const [product] = await db
      .update(products)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(products.id, productId))
      .returning({ id: products.id });

    if (!product) {
      logger.warn('Product not found for inventory update', { productId });
      return false;
    }

    logger.info('Product inventory updated successfully', { productId, quantity });
    return true;
  } catch (error) {
    logger.error('Error updating product inventory:', error);
    throw error;
  }
};

export const getFeaturedProducts = async (limit: number = 10): Promise<typeof products.$inferSelect[]> => {
  try {
    const featuredProducts = await db
      .select()
      .from(products)
      .where(and(eq(products.isFeatured, true), eq(products.status, 'active')))
      .limit(limit)
      .orderBy(desc(products.createdAt));

    logger.info('Featured products retrieved successfully', { count: featuredProducts.length });
    return featuredProducts;
  } catch (error) {
    logger.error('Error retrieving featured products:', error);
    throw error;
  }
};