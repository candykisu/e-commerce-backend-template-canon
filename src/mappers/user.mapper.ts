import { User } from '../models/ecommerce.schema';

// Type for user without password
type UserWithoutPassword = Omit<User, 'password'>;

/**
 * Converts a User object to a safe DTO (excludes password)
 */
export const toUserDto = (user: UserWithoutPassword) => {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * Converts a User object to a public profile DTO (minimal info)
 */
export const toUserProfileDto = (user: UserWithoutPassword) => {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
};