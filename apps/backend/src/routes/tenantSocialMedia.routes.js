import Router from 'express';
import asyncHandler from '../lib/AsyncHandler.js';
import { AuthMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/zod-validate.js';
import { upsertTenantSocialMediaSchema } from '../validators/tenantSocialMedia.schema.js';
import {
  upsertTenantSocialMedia,
  getTenantSocialMedia,
} from '../controllers/tenantSocialMedia.controller.js';

const router = Router();

// UPSERT (create/update)
router.post(
  '/',
  AuthMiddleware,
  validate({ body: upsertTenantSocialMediaSchema }),
  asyncHandler(upsertTenantSocialMedia),
);

// GET
router.get('/', asyncHandler(getTenantSocialMedia));

export default router;
