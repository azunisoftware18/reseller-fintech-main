import { Router } from 'express';
import asyncHandler from '../lib/AsyncHandler.js';
import { AuthMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/zod-validate.js';
import { auditLogListQuerySchema } from '../validators/audit.schema.js';
import { listAll } from '../controllers/audit.controller.js';
import { PermissionMiddleware } from '../middleware/permission.middleware.js';
import { PermissionsRegistry } from '../lib/PermissionsRegistry.js';

const router = Router();
router.use(AuthMiddleware);

// Audit log routes
router.get(
  '/list',
  PermissionMiddleware(PermissionsRegistry.LOGS.READ),
  validate({ query: auditLogListQuerySchema }),
  asyncHandler(listAll),
);

export default router;
