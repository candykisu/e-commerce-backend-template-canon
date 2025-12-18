import { eq, and, desc, sql, like, isNull } from 'drizzle-orm';
import { db } from '../db';
import { categories, NewCategory } from '../models/ecommerce.schema';
import { logger } from '../utils';
import { CreateCategoryInput, UpdateCategoryInput } from '../schemas/category.schema';

export const create = async (categoryData: CreateCategoryInput): Promise<typeof categories.$inferSelect> => {
  try {
    logger.info('Creating new category in repository', { name: categoryData.name });

    const newCategory: NewCategory = {
      name: categoryData.name,
      slug: categoryData.slug,
      description: categoryData.description,
      image: categoryData.image,
      parentId: categoryData.parentId,
    };

    const [savedCategory] = await db.insert(categories).values(newCategory).returning();

    logger.info('Category created successfully in repository', { categoryId: savedCategory.id });
    return savedCategory;
  } catch (error) {
    logger.error('Error creating category in repository:', error);
    throw error;
  }
};

export const find = async (
  page: number = 1,
  limit: number = 10,
  isActive?: boolean,
  parentId?: number | null,
  search?: string
): Promise<{
  categories: (typeof categories.$inferSelect)[];
  total: number;
}> => {
  try {
    const offset = (page - 1) * limit;
    const conditions = [];

    if (isActive !== undefined) conditions.push(eq(categories.isActive, isActive));
    if (parentId !== undefined) {
      if (parentId === null) {
        conditions.push(isNull(categories.parentId));
      } else {
        conditions.push(eq(categories.parentId, parentId));
      }
    }
    if (search) {
      conditions.push(like(categories.name, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [resultCategories, totalResult] = await Promise.all([
      db
        .select()
        .from(categories)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(categories.createdAt)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(categories)
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    logger.info('Categories retrieved successfully from repository', {
      count: resultCategories.length,
      page,
      limit,
    });
    return { categories: resultCategories, total };
  } catch (error) {
    logger.error('Error retrieving categories from repository:', error);
    throw error;
  }
};

export const findById = async (categoryId: number): Promise<typeof categories.$inferSelect | null> => {
  try {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId));

    if (!category) {
      logger.warn('Category not found in repository', { categoryId });
      return null;
    }

    logger.info('Category retrieved successfully from repository', { categoryId });
    return category;
  } catch (error) {
    logger.error('Error retrieving category from repository:', error);
    throw error;
  }
};

export const findBySlug = async (slug: string): Promise<typeof categories.$inferSelect | null> => {
  try {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug));

    return category || null;
  } catch (error) {
    logger.error('Error finding category by slug:', error);
    throw error;
  }
};

export const update = async (
  categoryId: number,
  updateData: UpdateCategoryInput
): Promise<typeof categories.$inferSelect | null> => {
  try {
    const updateValues: Partial<NewCategory> = {
      ...updateData,
      updatedAt: new Date(),
    };

    const [category] = await db
      .update(categories)
      .set(updateValues)
      .where(eq(categories.id, categoryId))
      .returning();

    if (!category) {
      logger.warn('Category not found for update in repository', { categoryId });
      return null;
    }

    logger.info('Category updated successfully in repository', { categoryId });
    return category;
  } catch (error) {
    logger.error('Error updating category in repository:', error);
    throw error;
  }
};

export const softDelete = async (categoryId: number): Promise<boolean> => {
  try {
    const [category] = await db
      .update(categories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(categories.id, categoryId))
      .returning({ id: categories.id });

    if (!category) {
      logger.warn('Category not found for deletion in repository', { categoryId });
      return false;
    }

    logger.info('Category deactivated successfully in repository', { categoryId });
    return true;
  } catch (error) {
    logger.error('Error deactivating category in repository:', error);
    throw error;
  }
};

export const getHierarchy = async (): Promise<typeof categories.$inferSelect[]> => {
  try {
    const allCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(categories.name);

    logger.info('Category hierarchy retrieved successfully', { count: allCategories.length });
    return allCategories;
  } catch (error) {
    logger.error('Error retrieving category hierarchy:', error);
    throw error;
  }
};

export const getChildren = async (parentId: number): Promise<typeof categories.$inferSelect[]> => {
  try {
    const children = await db
      .select()
      .from(categories)
      .where(and(eq(categories.parentId, parentId), eq(categories.isActive, true)))
      .orderBy(categories.name);

    logger.info('Child categories retrieved successfully', { parentId, count: children.length });
    return children;
  } catch (error) {
    logger.error('Error retrieving child categories:', error);
    throw error;
  }
};