import Router from 'express';
import {
  getTenantWebsite,
  upsertTenantWebsite,
} from '../controllers/tenantWebsite.controller.js';
import upload from '../middleware/multer.middleware.js';
import asyncHandler from '../lib/AsyncHandler.js';
import { AuthMiddleware } from '../middleware/auth.middleware.js';
import { upsertTenantWebsiteSchema } from '../validators/tenantWebsite.schema.js';
import { validate } from '../middleware/zod-validate.js';

const router = Router();

router.post(
  '/',
  AuthMiddleware,
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'favicon', maxCount: 1 },
  ]),
  validate({ body: upsertTenantWebsiteSchema }),
  asyncHandler(upsertTenantWebsite),
);

router.get('/', asyncHandler(getTenantWebsite));

export default router;
