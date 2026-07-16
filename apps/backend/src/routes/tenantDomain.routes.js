import { Router } from 'express';
import {
  createTenantDomain,
  getByTenantId,
} from '../controllers/tenantDomain.controller.js';
import { validate } from '../middleware/zod-validate.js';
import {
  createTenantDomainSchema,
  idParamSchema,
} from '../validators/tenantDomain.schema.js';
import asyncHandler from '../lib/AsyncHandler.js';
import { AuthMiddleware } from '../middleware/auth.middleware.js';
import { PermissionMiddleware } from '../middleware/permission.middleware.js';
import { PermissionsRegistry } from '../lib/PermissionsRegistry.js';

const router = Router();

router.use(AuthMiddleware);

// CREATE
router.post(
  '/',
  PermissionMiddleware(PermissionsRegistry.DOMAIN.CREATE),
  validate({ body: createTenantDomainSchema }),
  asyncHandler(createTenantDomain),
);

// Get by tenant id
router.get(
  '/:tenantId',
  PermissionMiddleware(PermissionsRegistry.DOMAIN.READ),
  validate({ params: idParamSchema }),
  asyncHandler(getByTenantId),
);
export default router;
