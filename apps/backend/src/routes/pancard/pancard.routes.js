import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { AuthMiddleware } from '../../middleware/auth.middleware.js';
import { rawQueryMiddleware } from '../../middleware/rawQuery.middleware.js';

import { pancardCallback } from '../../controllers/pancard/pancardCallback.controller.js';
import { validate } from '../../middleware/zod-validate.js';
import { verifyPanSchema } from '../../validators/pancard/pancard.schema.js';
import { verifyPan } from '../../controllers/pancard/pancard.controller.js';

const router = Router();

/**
 * 🔐 Auth Required Routes (PAN Verify)
 * Callback route PUBLIC hoga
 */
router.use('/secure', AuthMiddleware);

/**
 * 🚦 Callback rate limiter
 * PAN providers usually fewer retries
 */
const callbackLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
});

/**
 * 🔎 PAN Verify (Single Step)
 */
router.post('/verify', validate({ body: verifyPanSchema }), verifyPan);

/**
 * 🌐 PUBLIC CALLBACK ROUTE (Optional)
 * Provider hit karega
 * No Auth
 */
router.post(
  '/callback',
  rawQueryMiddleware, // required for HMAC verification
  callbackLimiter,
  pancardCallback,
);

export default router;
