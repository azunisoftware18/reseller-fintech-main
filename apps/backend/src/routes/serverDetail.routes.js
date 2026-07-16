import { Router } from 'express';
import {
  getAll,
  getServerDetailById,
  upsertServerDetail,
} from '../controllers/serverDetail.controller.js';
import { validate } from '../middleware/zod-validate.js';
import { serverDetailSchema } from '../validators/serverDetail.schema.js';
import asyncHandler from '../lib/AsyncHandler.js';
import { AuthMiddleware } from '../middleware/auth.middleware.js';
import { PermissionMiddleware } from '../middleware/permission.middleware.js';
import { PermissionsRegistry } from '../lib/PermissionsRegistry.js';

const router = Router();

router.use(AuthMiddleware);

router.post(
  '/',
  PermissionMiddleware(
    PermissionsRegistry.SERVER.UPSERT,
  ),
  validate({ body: serverDetailSchema }),
  asyncHandler(upsertServerDetail),
);

// GET BY actor 's tenantId
router.get(
  '/',
  PermissionMiddleware(PermissionsRegistry.SERVER.READ),
  asyncHandler(getServerDetailById),
);

router.get(
  '/list',
  PermissionMiddleware(PermissionsRegistry.SERVER.READ),
  asyncHandler(getAll),
);

export default router;
