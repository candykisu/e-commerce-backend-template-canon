import { Router, RequestHandler } from 'express';
import * as couponController from '../controllers/coupon.controller';
import { validate } from '../middlewares/validate';
import { 
  createCouponSchema, 
  updateCouponSchema, 
  applyCouponSchema,
  removeCouponSchema,
  validateCouponSchema,
  getCouponsSchema,
  assignCouponSchema,
  couponStatsSchema
} from '../schemas/coupon.schema';

const router = Router();

router.post('/', validate(createCouponSchema), couponController.createCoupon);
router.get('/', validate(getCouponsSchema) as any, couponController.getCoupons);
router.get('/public', couponController.getPublicCoupons);
router.get('/my-coupons', couponController.getUserCoupons);
router.post('/validate', validate(validateCouponSchema), couponController.validateCoupon);
router.post('/apply', validate(applyCouponSchema), couponController.applyCoupon);
router.post('/remove', validate(removeCouponSchema), couponController.removeCoupon);
router.get('/:couponId', couponController.getCouponById);
router.put('/:couponId', validate(updateCouponSchema), couponController.updateCoupon);
router.delete('/:couponId', couponController.deleteCoupon);
router.post('/assign', validate(assignCouponSchema), couponController.assignCouponToUsers);
router.get('/statistics', validate(couponStatsSchema) as any, couponController.getCouponStatistics);

export default router;
