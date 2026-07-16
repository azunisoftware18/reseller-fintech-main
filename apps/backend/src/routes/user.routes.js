import { Router } from 'express';
import asyncHandler from '../lib/AsyncHandler.js';
import { AuthMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/zod-validate.js';

import {
  createUser,
  findAllUsers,
  findUser,
  updateUser,
  getAllDescendants,
  assignUserPermissions,
} from '../controllers/user.controller.js';

import {
  createUserSchema,
  updateUserSchema,
  listUsersQuerySchema,
  userIdParamSchema,
  assignUserPermissionsSchema,
} from '../validators/user.schema.js';
import upload from '../middleware/multer.middleware.js';
import { PermissionMiddleware } from '../middleware/permission.middleware.js';
import { PermissionsRegistry } from '../lib/PermissionsRegistry.js';

const router = Router();

router.use(AuthMiddleware);

router.post(
  '/',
  PermissionMiddleware(PermissionsRegistry.USER.CREATE),
  validate(createUserSchema),
  asyncHandler(createUser),
);

router.get(
  '/',
  PermissionMiddleware(PermissionsRegistry.USER.READ),
  validate({ query: listUsersQuerySchema }),
  asyncHandler(findAllUsers),
);

router.get(
  '/:id',
  PermissionMiddleware(PermissionsRegistry.USER.READ),
  validate({ params: userIdParamSchema }),
  asyncHandler(findUser),
);

router.put(
  '/:id',
  PermissionMiddleware(PermissionsRegistry.USER.UPDATE),
  upload.single('profilePicture'),
  validate({ body: updateUserSchema, params: userIdParamSchema }),
  asyncHandler(updateUser),
);

router.get(
  '/:id/descendants',
  PermissionMiddleware(PermissionsRegistry.USER.VIEW_DESCENDANTS),
  validate({ params: userIdParamSchema }),
  asyncHandler(getAllDescendants),
);

router.post(
  '/:id/permissions',
  PermissionMiddleware(PermissionsRegistry.USER.ASSIGN_PERMISSIONS),
  validate({
    params: userIdParamSchema,
    body: assignUserPermissionsSchema,
  }),
  asyncHandler(assignUserPermissions),
);

export default router;
