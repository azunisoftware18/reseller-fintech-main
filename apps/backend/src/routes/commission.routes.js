import { Router } from 'express';
import asyncHandler from '../lib/AsyncHandler.js';
import { AuthMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/zod-validate.js';
import { PermissionMiddleware } from '../middleware/permission.middleware.js';
import { PermissionsRegistry } from '../lib/PermissionsRegistry.js';

import {
  createCommission,
  updateCommission,
  getAllCommissionList,
} from '../controllers/commission.controller.js';

import {
  commissionListQuerySchema,
  createCommissionSchema,
  updateCommissionSchema,
} from '../validators/commission.schema.js';

const router = Router();

router.use(AuthMiddleware);

// Create route
router.post(
  '/',
  PermissionMiddleware(PermissionsRegistry.COMMISSION.SET_RULE),
  validate({ body: createCommissionSchema }),
  asyncHandler(createCommission),
);

// Update route
router.put(
  '/:id',
  PermissionMiddleware(PermissionsRegistry.COMMISSION.SET_RULE),
  validate({ body: updateCommissionSchema }),
  asyncHandler(updateCommission),
);

// List route
router.get(
  '/',
  PermissionMiddleware(PermissionsRegistry.COMMISSION.READ),
  validate({ query: commissionListQuerySchema }),
  asyncHandler(getAllCommissionList),
);

export default router;
