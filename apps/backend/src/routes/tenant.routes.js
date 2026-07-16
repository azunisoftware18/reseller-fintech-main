import { Router } from 'express';
import {
  createTenant,
  findTenant,
  updateTenant,
  findAllTenants,
  getAllDescendants,
} from '../controllers/tenant.controller.js';
import { validate } from '../middleware/zod-validate.js';
import {
  createTenantSchema,
  idParamSchema,
  updateTenantSchema,
} from '../validators/tenant.schema.js';
import asyncHandler from '../lib/AsyncHandler.js';
import { AuthMiddleware } from '../middleware/auth.middleware.js';
import { PermissionsRegistry } from '../lib/PermissionsRegistry.js';
import { PermissionMiddleware } from '../middleware/permission.middleware.js';

const router = Router();

router.use(AuthMiddleware);

router.post(
  '/',
  PermissionMiddleware(PermissionsRegistry.TENANT.CREATE),
  validate({ body: createTenantSchema }),
  asyncHandler(createTenant),
);

router.get(
  '/',
  PermissionMiddleware(PermissionsRegistry.TENANT.READ),
  asyncHandler(findAllTenants),
);

router.get(
  '/:id',
  PermissionMiddleware(PermissionsRegistry.TENANT.READ),
  validate({ params: idParamSchema }),
  asyncHandler(findTenant),
);

router.put(
  '/:id',
  PermissionMiddleware(PermissionsRegistry.TENANT.UPDATE),
  validate({ params: idParamSchema, body: updateTenantSchema }),
  asyncHandler(updateTenant),
);

router.get('/:tenantId/descendants', asyncHandler(getAllDescendants));

export default router;
