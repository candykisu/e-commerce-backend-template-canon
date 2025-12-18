import { eq, and, desc, sql, like, or } from 'drizzle-orm';
import { db } from '../db';
import { users, NewUser, User } from '../models/ecommerce.schema';
import { logger } from '../utils';
import { CreateUserInput, UpdateUserInput } from '../schemas/user.schema';

// Type for user without password
type UserWithoutPassword = Omit<User, 'password'>;

export const create = async (userData: CreateUserInput & { password: string }): Promise<UserWithoutPassword> => {
  try {
    logger.info('Creating new user in repository', { email: userData.email });

    const newUser: NewUser = {
      email: userData.email,
      password: userData.password, // Should be hashed before calling this
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      role: userData.role || 'customer',
    };

    const [savedUser] = await db.insert(users).values(newUser).returning({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      role: users.role,
      isEmailVerified: users.isEmailVerified,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    });

    logger.info('User created successfully in repository', { userId: savedUser.id });
    return savedUser;
  } catch (error) {
    logger.error('Error creating user in repository:', error);
    throw error;
  }
};

export const find = async (
  page: number = 1,
  limit: number = 10,
  role?: string,
  isActive?: boolean,
  search?: string
): Promise<{
  users: UserWithoutPassword[];
  total: number;
}> => {
  try {
    const offset = (page - 1) * limit;
    const conditions = [];

    if (role) conditions.push(eq(users.role, role));
    if (isActive !== undefined) conditions.push(eq(users.isActive, isActive));
    if (search) {
      conditions.push(
        or(
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`),
          like(users.email, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [resultUsers, totalResult] = await Promise.all([
      db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          phone: users.phone,
          role: users.role,
          isEmailVerified: users.isEmailVerified,
          isActive: users.isActive,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(users.createdAt)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    logger.info('Users retrieved successfully from repository', {
      count: resultUsers.length,
      page,
      limit,
    });
    return { users: resultUsers, total };
  } catch (error) {
    logger.error('Error retrieving users from repository:', error);
    throw error;
  }
};

export const findById = async (userId: string): Promise<UserWithoutPassword | null> => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        role: users.role,
        isEmailVerified: users.isEmailVerified,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      logger.warn('User not found in repository', { userId });
      return null;
    }

    logger.info('User retrieved successfully from repository', { userId });
    return user;
  } catch (error) {
    logger.error('Error retrieving user from repository:', error);
    throw error;
  }
};

export const findByEmail = async (email: string): Promise<UserWithoutPassword | null> => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        role: users.role,
        isEmailVerified: users.isEmailVerified,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.email, email));

    return user || null;
  } catch (error) {
    logger.error('Error finding user by email:', error);
    throw error;
  }
};

export const findByEmailWithPassword = async (email: string): Promise<User | null> => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    return user || null;
  } catch (error) {
    logger.error('Error finding user by email with password:', error);
    throw error;
  }
};

export const findByIdWithPassword = async (userId: string): Promise<User | null> => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    return user || null;
  } catch (error) {
    logger.error('Error finding user by ID with password:', error);
    throw error;
  }
};

export const update = async (
  userId: string,
  updateData: UpdateUserInput
): Promise<UserWithoutPassword | null> => {
  try {
    const updateValues: Partial<NewUser> = {
      ...updateData,
      updatedAt: new Date(),
    };

    const [user] = await db
      .update(users)
      .set(updateValues)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        role: users.role,
        isEmailVerified: users.isEmailVerified,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    if (!user) {
      logger.warn('User not found for update in repository', { userId });
      return null;
    }

    logger.info('User updated successfully in repository', { userId });
    return user;
  } catch (error) {
    logger.error('Error updating user in repository:', error);
    throw error;
  }
};

export const updatePassword = async (userId: string, hashedPassword: string): Promise<boolean> => {
  try {
    const [user] = await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({ id: users.id });

    if (!user) {
      logger.warn('User not found for password update', { userId });
      return false;
    }

    logger.info('User password updated successfully', { userId });
    return true;
  } catch (error) {
    logger.error('Error updating user password:', error);
    throw error;
  }
};

export const softDelete = async (userId: string): Promise<boolean> => {
  try {
    const [user] = await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({ id: users.id });

    if (!user) {
      logger.warn('User not found for deletion in repository', { userId });
      return false;
    }

    logger.info('User deactivated successfully in repository', { userId });
    return true;
  } catch (error) {
    logger.error('Error deactivating user in repository:', error);
    throw error;
  }
};