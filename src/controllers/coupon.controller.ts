import { Request, Response } from 'express';
import * as couponService from '../services/coupon.service';
import { 
  CreateCouponInput, 
  UpdateCouponInput, 
  ApplyCouponInput, 
  RemoveCouponInput,
  ValidateCouponInput,
  GetCouponsInput,
  AssignCouponInput,
  CouponStatsInput
} from '../schemas/coupon.schema';
import { asyncHandler } from '../utils/asyncHandler';
import { success as successMessages } from '../constants/messages';
import { sendSuccessResponse } from '../utils/responseHandler';

/**
 * Create a new coupon
 */
export const createCoupon = asyncHandler(
  async (req: Request<object, object, CreateCouponInput>, res: Response): Promise<void> => {
    // TODO: Get userId from authentication middleware
    const createdBy = 'temp-admin-id'; // This should come from req.user.id after auth is implemented
    
    const coupon = await couponService.createCoupon(req.body, createdBy);
    sendSuccessResponse(res, 201, successMessages.CREATED('Coupon'), coupon);
  }
);

/**
 * Get coupons with filtering and pagination
 */
export const getCoupons = asyncHandler(
  async (req: Request<object, object, object, GetCouponsInput>, res: Response): Promise<void> => {
    const result = await couponService.getCoupons(req.query);
    
    sendSuccessResponse(
      res,
      200,
      successMessages.FETCHED('Coupons'),
      result,
      {
        page: req.query.page,
        limit: req.query.limit,
        total: result.total,
        pages: Math.ceil(result.total / req.query.limit),
      }
    );
  }
);

/**
 * Get coupon by ID
 */
export const getCouponById = asyncHandler(
  async (req: Request<{ couponId: string }>, res: Response): Promise<void> => {
    const couponId = parseInt(req.params.couponId);
    if (isNaN(couponId)) {
      res.status(400).json({ message: 'Invalid coupon ID' });
      return;
    }

    const coupon = await couponService.getCouponById(couponId);
    sendSuccessResponse(res, 200, successMessages.FETCHED('Coupon'), coupon);
  }
);

/**
 * Update coupon
 */
export const updateCoupon = asyncHandler(
  async (req: Request<{ couponId: string }, object, UpdateCouponInput>, res: Response): Promise<void> => {
    const couponId = parseInt(req.params.couponId);
    if (isNaN(couponId)) {
      res.status(400).json({ message: 'Invalid coupon ID' });
      return;
    }

    // TODO: Implement update coupon logic
    sendSuccessResponse(res, 200, successMessages.UPDATED('Coupon'));
  }
);

/**
 * Delete/deactivate coupon
 */
export const deleteCoupon = asyncHandler(
  async (req: Request<{ couponId: string }>, res: Response): Promise<void> => {
    const couponId = parseInt(req.params.couponId);
    if (isNaN(couponId)) {
      res.status(400).json({ message: 'Invalid coupon ID' });
      return;
    }

    // TODO: Implement delete coupon logic
    res.status(204).send();
  }
);

/**
 * Validate coupon
 */
export const validateCoupon = asyncHandler(
  async (req: Request<object, object, ValidateCouponInput>, res: Response): Promise<void> => {
    const result = await couponService.validateCoupon(req.body);
    
    if (result.isValid) {
      sendSuccessResponse(res, 200, 'Coupon is valid', {
        coupon: result.coupon,
        discountAmount: result.discountAmount,
        applicableItems: result.applicableItems,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.errorMessage || 'Coupon is not valid',
      });
    }
  }
);

/**
 * Apply coupon to cart
 */
export const applyCoupon = asyncHandler(
  async (req: Request<object, object, ApplyCouponInput>, res: Response): Promise<void> => {
    const result = await couponService.applyCoupon(req.body);
    
    sendSuccessResponse(res, 200, 'Coupon applied successfully', {
      coupon: result.coupon,
      discountAmount: result.discountAmount,
    });
  }
);

/**
 * Remove coupon from cart
 */
export const removeCoupon = asyncHandler(
  async (req: Request<object, object, RemoveCouponInput>, res: Response): Promise<void> => {
    // TODO: Implement remove coupon logic
    sendSuccessResponse(res, 200, 'Coupon removed successfully');
  }
);

/**
 * Get user's available coupons
 */
export const getUserCoupons = asyncHandler(
  async (req: Request<{ userId: string }>, res: Response): Promise<void> => {
    const { userId } = req.params;
    
    const coupons = await couponService.getUserAvailableCoupons(userId);
    sendSuccessResponse(res, 200, successMessages.FETCHED('User coupons'), coupons);
  }
);

/**
 * Get current user's available coupons
 */
export const getMyAvailableCoupons = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // TODO: Get userId from authentication middleware
    const userId = 'temp-user-id'; // This should come from req.user.id after auth is implemented
    
    const coupons = await couponService.getUserAvailableCoupons(userId);
    sendSuccessResponse(res, 200, successMessages.FETCHED('Available coupons'), coupons);
  }
);

/**
 * Assign coupon to users (admin)
 */
export const assignCouponToUsers = asyncHandler(
  async (req: Request<object, object, AssignCouponInput>, res: Response): Promise<void> => {
    // TODO: Get userId from authentication middleware
    const assignedBy = 'temp-admin-id'; // This should come from req.user.id after auth is implemented
    
    await couponService.assignCouponToUsers(req.body, assignedBy);
    sendSuccessResponse(res, 200, 'Coupon assigned to users successfully');
  }
);

/**
 * Get coupon statistics (admin)
 */
export const getCouponStatistics = asyncHandler(
  async (req: Request<object, object, object, CouponStatsInput>, res: Response): Promise<void> => {
    const stats = await couponService.getCouponStatistics(req.query.period, req.query.couponId);
    sendSuccessResponse(res, 200, successMessages.FETCHED('Coupon statistics'), stats);
  }
);

/**
 * Get public coupons (for promotional display)
 */
export const getPublicCoupons = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await couponService.getCoupons({
      page: 1,
      limit,
      isActive: true,
      isPublic: true,
      type: undefined,
      search: undefined,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
    
    sendSuccessResponse(res, 200, successMessages.FETCHED('Public coupons'), result.coupons);
  }
);