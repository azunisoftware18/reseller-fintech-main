import Router from 'express';
import asyncHandler from '../lib/AsyncHandler.js';
import { AuthMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/zod-validate.js';
import {
  createTenantPageSchema,
  updateTenantPageSchema,
  idParamSchema,
} from '../validators/tenantPage.schema.js';

import {
  createTenantPage,
  updateTenantPage,
  deleteTenantPage,
  getTenantPageById,
  getPublicTenantPages,
} from '../controllers/tenantPage.controller.js';

const router = Router();

// 🔐 ADMIN ROUTES
router.post(
  '/',
  AuthMiddleware,
  validate({ body: createTenantPageSchema }),
  asyncHandler(createTenantPage),
);

router.put(
  '/:id',
  AuthMiddleware,
  validate({ params: idParamSchema, body: updateTenantPageSchema }),
  asyncHandler(updateTenantPage),
);

router.delete(
  '/:id',
  AuthMiddleware,
  validate({ params: idParamSchema }),
  asyncHandler(deleteTenantPage),
);

router.get(
  '/:id',
  AuthMiddleware,
  validate({ params: idParamSchema }),
  asyncHandler(getTenantPageById),
);

// 🌍 PUBLIC ROUTE
router.get('/public/all', asyncHandler(getPublicTenantPages));

export default router;
