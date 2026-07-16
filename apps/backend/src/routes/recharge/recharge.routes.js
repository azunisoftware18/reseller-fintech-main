import { Router } from 'express';
import { validate } from '../../middleware/zod-validate.js';
import { AuthMiddleware } from '../../middleware/auth.middleware.js';
import { PermissionMiddleware } from '../../middleware/permission.middleware.js';
import { PermissionsRegistry } from '../../lib/PermissionsRegistry.js';
import rateLimit from 'express-rate-limit';

import * as RechargeController from '../../controllers/recharge/recharge.controller.js';
import {
  fetchPlansSchema,
  performRechargeSchema,
  checkStatusSchema,
  rechargeCallbackSchema,
  rechargeHistorySchema,
} from '../../validators/recharge/recharge.schema.js';

const router = Router();

// Rate limiting
const rechargeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
});

const statusLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
});

// All routes require authentication except callback
router.use(AuthMiddleware);

router.post(
  '/plans',
  PermissionMiddleware(PermissionsRegistry.RECHARGE.CREATE, {
    requireService: true,
  }),
  validate({ body: fetchPlansSchema }),
  RechargeController.fetchPlans,
);

// Perform Recharge
router.post(
  '/',
  rechargeLimiter,
  PermissionMiddleware(PermissionsRegistry.RECHARGE.CREATE, {
    requireService: true,
  }),
  validate({ body: performRechargeSchema }),
  RechargeController.performRecharge,
);

// Check Status
router.get(
  '/status/:transactionId',
  statusLimiter,
  PermissionMiddleware(PermissionsRegistry.RECHARGE.READ, {
    requireService: true,
  }),
  validate({ params: checkStatusSchema }),
  RechargeController.checkStatus,
);

// History list
router.get(
  '/history',
  PermissionMiddleware(PermissionsRegistry.RECHARGE.READ, {
    requireService: true,
  }),
  validate({ query: rechargeHistorySchema }),
  RechargeController.getHistory,
);

// History details
router.get(
  '/history/:transactionId',
  PermissionMiddleware(PermissionsRegistry.RECHARGE.READ, {
    requireService: true,
  }),
  RechargeController.getDetails,
);

// Callback - NO AUTH (called by provider)
router.get(
  '/callback',
  validate({ query: rechargeCallbackSchema }),
  RechargeController.handleCallback,
);

export default router;
