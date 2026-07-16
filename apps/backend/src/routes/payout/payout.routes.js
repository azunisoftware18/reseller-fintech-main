import { Router } from 'express';
import { validate } from '../../middleware/zod-validate.js';
import { AuthMiddleware } from '../../middleware/auth.middleware.js';
import { PermissionMiddleware } from '../../middleware/permission.middleware.js';
import { PermissionsRegistry } from '../../lib/PermissionsRegistry.js';
import rateLimit from 'express-rate-limit';

import * as PayoutController from '../../controllers/payout/payout.controller.js';
import {
  performPayoutSchema,
  checkStatusSchema,
  payoutHistorySchema,
} from '../../validators/payout/payout.schema.js';

const router = Router();

// RBL recommends 190 sec timeout for IMPS
const payoutLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10, // 10 requests per minute max
  message: {
    success: false,
    message: 'Too many payout requests, please try again later',
  },
});

// Status check rate limit - RBL recommends checking every 15-20 min for NEFT/RTGS
const statusLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // 30 status checks per minute max
  message: {
    success: false,
    message: 'Too many status check requests',
  },
});

router.use(AuthMiddleware);

// Initiate payout
router.post(
  '/',
  payoutLimiter,
  PermissionMiddleware(PermissionsRegistry.PAYOUT.CREATE, {
    requireService: true,
  }),
  validate({ body: performPayoutSchema }),
  PayoutController.performPayout,
);

// Check status
router.get(
  '/status/:transactionId',
  statusLimiter,
  PermissionMiddleware(PermissionsRegistry.PAYOUT.READ, {
    requireService: true,
  }),
  validate({ params: checkStatusSchema }),
  PayoutController.checkStatus,
);

// History list
router.get(
  '/history',
  PermissionMiddleware(PermissionsRegistry.PAYOUT.READ, {
    requireService: true,
  }),
  validate({ query: payoutHistorySchema }),
  PayoutController.getHistory,
);

// History details
router.get(
  '/history/:transactionId',
  PermissionMiddleware(PermissionsRegistry.PAYOUT.READ, {
    requireService: true,
  }),
  PayoutController.getDetails,
);

export default router;
