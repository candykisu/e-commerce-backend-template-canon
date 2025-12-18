import { Request, Response } from 'express';
import * as userService from '../services/user.service';
import { toUserDto } from '../mappers/user.mapper';
import { CreateUserInput, UpdateUserInput, ChangePasswordInput } from '../schemas/user.schema';
import { asyncHandler } from '../utils/asyncHandler';
import { success as successMessages } from '../constants/messages';
import { sendSuccessResponse } from '../utils/responseHandler';

/**
 * Create a new user
 */
export const createUser = asyncHandler(
  async (req: Request<object, object, CreateUserInput>, res: Response): Promise<void> => {
    const user = await userService.createUser(req.body);
    const userDto = toUserDto(user);

    sendSuccessResponse(res, 201, successMessages.CREATED('User'), userDto);
  }
);

/**
 * Get all users with pagination and filtering
 */
export const getUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const role = req.query.role as string;
  const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
  const search = req.query.search as string;

  const result = await userService.getUsers(page, limit, role, isActive, search);
  const usersDto = result.users.map(toUserDto);

  sendSuccessResponse(res, 200, successMessages.FETCHED('Users'), usersDto, {
    page,
    limit,
    total: result.total,
    pages: Math.ceil(result.total / limit),
  });
});

/**
 * Get user by ID
 */
export const getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = await userService.getUserById(id);
  const userDto = toUserDto(user);

  sendSuccessResponse(res, 200, successMessages.FETCHED('User'), userDto);
});

/**
 * Update user
 */
export const updateUser = asyncHandler(
  async (req: Request<{ id: string }, object, UpdateUserInput>, res: Response): Promise<void> => {
    const { id } = req.params;
    const user = await userService.updateUser(id, req.body);
    const userDto = toUserDto(user);

    sendSuccessResponse(res, 200, successMessages.UPDATED('User'), userDto);
  }
);

/**
 * Change user password
 */
export const changePassword = asyncHandler(
  async (req: Request<{ id: string }, object, ChangePasswordInput>, res: Response): Promise<void> => {
    const { id } = req.params;
    await userService.changePassword(id, req.body);

    sendSuccessResponse(res, 200, 'Password changed successfully');
  }
);

/**
 * Deactivate user (soft delete)
 */
export const deactivateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  await userService.deactivateUser(id);
  res.status(204).send();
});

/**
 * Get current user profile (for authenticated users)
 */
export const getCurrentUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // This would typically get user ID from JWT token
  // For now, we'll expect it in headers or implement JWT middleware later
  const userId = req.headers['x-user-id'] as string; // Temporary solution
  
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const user = await userService.getUserById(userId);
  const userDto = toUserDto(user);

  sendSuccessResponse(res, 200, successMessages.FETCHED('User profile'), userDto);
});