import bcrypt from 'bcrypt';
import { User } from '../models/ecommerce.schema';
import * as userRepository from '../repositories/user.repository';
import { CreateUserInput, UpdateUserInput, ChangePasswordInput } from '../schemas/user.schema';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/ApiError';
import { error as errorMessages } from '../constants/messages';

// Type for user without password (for public API responses)
type UserWithoutPassword = Omit<User, 'password'>;

/**
 * Create a new user
 */
export const createUser = async (userData: CreateUserInput): Promise<UserWithoutPassword> => {
  // Check if user already exists
  const existingUser = await userRepository.findByEmail(userData.email);
  if (existingUser) {
    throw new ConflictError('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(userData.password, 12);

  return userRepository.create({
    ...userData,
    password: hashedPassword,
  });
};

/**
 * Get all users with pagination and filtering
 */
export const getUsers = async (
  page: number = 1,
  limit: number = 10,
  role?: string,
  isActive?: boolean,
  search?: string
): Promise<{
  users: UserWithoutPassword[];
  total: number;
}> => {
  return userRepository.find(page, limit, role, isActive, search);
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<UserWithoutPassword> => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError(errorMessages.NOT_FOUND('User'));
  }
  return user;
};

/**
 * Get user by email
 */
export const getUserByEmail = async (email: string): Promise<UserWithoutPassword | null> => {
  return userRepository.findByEmail(email);
};

/**
 * Update user
 */
export const updateUser = async (userId: string, updateData: UpdateUserInput): Promise<UserWithoutPassword> => {
  // If email is being updated, check for conflicts
  if (updateData.email) {
    const existingUser = await userRepository.findByEmail(updateData.email);
    if (existingUser && existingUser.id !== userId) {
      throw new ConflictError('User with this email already exists');
    }
  }

  const user = await userRepository.update(userId, updateData);
  if (!user) {
    throw new NotFoundError(errorMessages.NOT_FOUND('User'));
  }
  return user;
};

/**
 * Change user password
 */
export const changePassword = async (
  userId: string,
  passwordData: ChangePasswordInput
): Promise<boolean> => {
  // Get user with password for verification
  const user = await userRepository.findByIdWithPassword(userId);
  if (!user) {
    throw new NotFoundError(errorMessages.NOT_FOUND('User'));
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(passwordData.currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new BadRequestError('Current password is incorrect');
  }

  // Hash new password
  const hashedNewPassword = await bcrypt.hash(passwordData.newPassword, 12);

  const success = await userRepository.updatePassword(userId, hashedNewPassword);
  if (!success) {
    throw new NotFoundError(errorMessages.NOT_FOUND('User'));
  }

  return true;
};

/**
 * Deactivate user (soft delete)
 */
export const deactivateUser = async (userId: string): Promise<boolean> => {
  const success = await userRepository.softDelete(userId);
  if (!success) {
    throw new NotFoundError(errorMessages.NOT_FOUND('User'));
  }
  return true;
};

/**
 * Verify user password (for authentication)
 */
export const verifyPassword = async (email: string, password: string): Promise<UserWithoutPassword | null> => {
  const user = await userRepository.findByEmailWithPassword(email);
  if (!user || !user.isActive) {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return null;
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword as UserWithoutPassword;
};