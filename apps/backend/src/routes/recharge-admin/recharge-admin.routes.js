import { Router } from 'express';
import { AuthMiddleware } from '../../middleware/auth.middleware.js';
import { PermissionMiddleware } from '../../middleware/permission.middleware.js';
import { PermissionsRegistryAdmin } from '../../lib/PermissionsRegistryAdmin.js';
import { PermissionsRegistry } from '../../lib/PermissionsRegistry.js';
import { validate } from '../../middleware/zod-validate.js';
import { z } from 'zod'; // 👈 Add zod for query validation

import * as OperatorMap from '../../controllers/recharge-admin/operatorMap.controller.js';
import * as CircleMap from '../../controllers/recharge-admin/circleMap.controller.js';

import { upsertOperatorMapSchema } from '../../validators/recharge-admin/operatorMap.schema.js';
import { upsertCircleMapSchema } from '../../validators/recharge-admin/circleMap.schema.js';

const listQuerySchema = z.object({
  direction: z.enum(['PLAN_FETCH', 'RECHARGE_EXECUTE']).optional(),
  serviceId: z.string().uuid().optional(),
  providerId: z.string().uuid().optional(),
});

const router = Router();
router.use(AuthMiddleware);

// ✅ OPERATOR MAP CREATE/UPDATE
router.post(
  '/operator-map',
  PermissionMiddleware(
    PermissionsRegistryAdmin.RECHARGE_ADMIN_OPERATORS.CREATE,
  ),
  validate({ body: upsertOperatorMapSchema }),
  OperatorMap.upsertOperatorMap,
);

// ✅ OPERATOR MAP LIST (with filters)
router.get(
  '/operator-map',
  PermissionMiddleware(PermissionsRegistry.RECHARGE.READ),
  validate({ query: listQuerySchema }),
  OperatorMap.listOperatorMaps,
);

// ✅ CIRCLE MAP CREATE/UPDATE
router.post(
  '/circle-map',
  PermissionMiddleware(
    PermissionsRegistryAdmin.RECHARGE_ADMIN_CIRCLES.CREATE,
  ),
  validate({ body: upsertCircleMapSchema }),
  CircleMap.upsertCircleMap,
);

// ✅ CIRCLE MAP LIST (with filters)
router.get(
  '/circle-map',
  PermissionMiddleware(PermissionsRegistry.RECHARGE.READ),
  validate({ query: listQuerySchema }),
  CircleMap.listCircleMaps,
);

export default router;
