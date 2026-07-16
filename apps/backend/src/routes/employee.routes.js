import { Router } from 'express';
import {
  createEmployee,
  updateEmployee,
  findEmployee,
  findAllEmployees,
  deleteEmployee,
  assignEmployeePermissions,
} from '../controllers/employee.controller.js';
import { validate } from '../middleware/zod-validate.js';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  idParamSchema,
  assignEmployeePermissionsSchema,
} from '../validators/employee.schema.js';
import asyncHandler from '../lib/AsyncHandler.js';
import { AuthMiddleware } from '../middleware/auth.middleware.js';
import upload from '../middleware/multer.middleware.js';
import { PermissionMiddleware } from '../middleware/permission.middleware.js';
import { PermissionsRegistry } from '../lib/PermissionsRegistry.js';

const router = Router();

router.use(AuthMiddleware);

router.post(
  '/',
  PermissionMiddleware(PermissionsRegistry.EMPLOYEE.CREATE),
  validate({ body: createEmployeeSchema }),
  asyncHandler(createEmployee),
);

router.get(
  '/',
  PermissionMiddleware(PermissionsRegistry.EMPLOYEE.READ),
  asyncHandler(findAllEmployees),
);

router.get(
  '/:id',
  PermissionMiddleware(PermissionsRegistry.EMPLOYEE.READ),
  validate({ params: idParamSchema }),
  asyncHandler(findEmployee),
);

router.put(
  '/:id',
  PermissionMiddleware(PermissionsRegistry.EMPLOYEE.UPDATE),
  upload.single('profilePicture'),
  validate({ params: idParamSchema, body: updateEmployeeSchema }),
  asyncHandler(updateEmployee),
);

router.delete(
  '/:id',
  PermissionMiddleware(PermissionsRegistry.EMPLOYEE.DELETE),
  validate({ params: idParamSchema }),
  asyncHandler(deleteEmployee),
);

router.post(
  '/:id/permissions',
  PermissionMiddleware(PermissionsRegistry.EMPLOYEE.ASSIGN_PERMISSIONS),
  validate({
    params: idParamSchema,
    body: assignEmployeePermissionsSchema,
  }),
  asyncHandler(assignEmployeePermissions),
);

export default router;
