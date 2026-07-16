import { Router } from 'express';
import { validate } from '../../middleware/zod-validate.js';
import { AuthMiddleware } from '../../middleware/auth.middleware.js';
import { PermissionMiddleware } from '../../middleware/permission.middleware.js';
import { PermissionsRegistry } from '../../lib/PermissionsRegistry.js';
import rateLimit from 'express-rate-limit';

import { pennyDropSchema } from '../../validators/bank/bankVerfication.schema.js';
import asyncHandler from '../../lib/AsyncHandler.js';
import { pennyDropVerification } from '../../controllers/bank/bankVerification.controller.js';

const router = Router();

// Rate limiting for penny drop verification
const pennyDropLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 penny drop requests per minute
  message: {
    success: false,
    message: 'Too many verification requests, please try again later',
  },
});

// Status check rate limit
const statusLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'Too many status check requests',
  },
});

router.use(AuthMiddleware);

// Penny Drop Verification
router.post(
  '/penny-drop',
  pennyDropLimiter,
  PermissionMiddleware(PermissionsRegistry.BANK.VERIFICATION, {
    requireService: true,
  }),
  validate({ body: pennyDropSchema }),
  asyncHandler(pennyDropVerification),
);

export default router;
