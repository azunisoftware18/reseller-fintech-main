import { Router } from 'express';
import asyncHandler from '../lib/AsyncHandler.js';
import { AuthMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/zod-validate.js';

import {
  createRole,
  updateRole,
  deleteRole,
  assignPermissions,
  findAllRoles,
  findRole,
} from '../controllers/role.controller.js';

import {
  roleIdParamSchema,
  createRoleSchema,
  updateRoleSchema,
  assignRolePermissionsSchema,
} from '../validators/role.schema.js';
import { PermissionMiddleware } from '../middleware/permission.middleware.js';
import { PermissionsRegistry } from '../lib/PermissionsRegistry.js';

const router = Router();
router.use(AuthMiddleware);

router.post(
  '/',
  PermissionMiddleware(PermissionsRegistry.ROLE.CREATE),
  validate({ body: createRoleSchema }),
  asyncHandler(createRole),
);

router.get(
  '/',
  PermissionMiddleware(PermissionsRegistry.ROLE.READ),
  asyncHandler(findAllRoles),
);

router.get(
  '/:id',
  PermissionMiddleware(PermissionsRegistry.ROLE.READ),
  validate({ params: roleIdParamSchema }),
  asyncHandler(findRole),
);

router.put(
  '/:id',
  PermissionMiddleware(PermissionsRegistry.ROLE.UPDATE),
  validate({ params: roleIdParamSchema, body: updateRoleSchema }),
  asyncHandler(updateRole),
);

router.delete(
  '/:id',
  PermissionMiddleware(PermissionsRegistry.ROLE.DELETE),
  validate({ params: roleIdParamSchema }),
  asyncHandler(deleteRole),
);

router.post(
  '/:id/permissions',
  PermissionMiddleware(PermissionsRegistry.ROLE.ASSIGN_PERMISSIONS),
  validate({
    params: roleIdParamSchema,
    body: assignRolePermissionsSchema,
  }),
  asyncHandler(assignPermissions),
);

export default router;
