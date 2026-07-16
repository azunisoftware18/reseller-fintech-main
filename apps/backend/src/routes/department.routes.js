import { Router } from 'express';
import asyncHandler from '../lib/AsyncHandler.js';
import { AuthMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/zod-validate.js';
import { PermissionMiddleware } from '../middleware/permission.middleware.js';

import {
  createDepartment,
  findAllDepartments,
  findDepartment,
  updateDepartment,
  deleteDepartment,
  assignDepartmentPermissions,
} from '../controllers/department.controller.js';

import {
  departmentIdParamSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
  assignDepartmentPermissionsSchema,
} from '../validators/department.schema.js';
import { PermissionsRegistry } from '../lib/PermissionsRegistry.js';

const router = Router();
router.use(AuthMiddleware);

router.post(
  '/',
  PermissionMiddleware(PermissionsRegistry.DEPARTMENT.CREATE),
  validate({ body: createDepartmentSchema }),
  asyncHandler(createDepartment),
);

router.get(
  '/',
  PermissionMiddleware(PermissionsRegistry.DEPARTMENT.READ),
  asyncHandler(findAllDepartments),
);

router.get(
  '/:id',
  PermissionMiddleware(PermissionsRegistry.DEPARTMENT.READ),
  validate({ params: departmentIdParamSchema }),
  asyncHandler(findDepartment),
);

router.put(
  '/:id',
  PermissionMiddleware(PermissionsRegistry.DEPARTMENT.UPDATE),
  validate({ params: departmentIdParamSchema, body: updateDepartmentSchema }),
  asyncHandler(updateDepartment),
);

router.delete(
  '/:id',
  PermissionMiddleware(PermissionsRegistry.DEPARTMENT.DELETE),
  validate({ params: departmentIdParamSchema }),
  asyncHandler(deleteDepartment),
);

router.post(
  '/:id/permissions',
  PermissionMiddleware(PermissionsRegistry.DEPARTMENT.ASSIGN_PERMISSIONS),
  validate({
    params: departmentIdParamSchema,
    body: assignDepartmentPermissionsSchema,
  }),
  asyncHandler(assignDepartmentPermissions),
);

export default router;
