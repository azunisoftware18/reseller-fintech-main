import { Router } from 'express';
import asyncHandler from '../lib/AsyncHandler.js';
import { AuthMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/zod-validate.js';

import { getMyLedger } from '../controllers/ledger.controller.js';
import { ledgerListQuerySchema } from '../validators/ledger.schema.js';
import { PermissionMiddleware } from '../middleware/permission.middleware.js';
import { PermissionsRegistry } from '../lib/PermissionsRegistry.js';

const router = Router();
router.use(AuthMiddleware);

// Single endpoint: only own ledger entries
router.get(
  '/list',
  PermissionMiddleware(PermissionsRegistry.LEDGER.READ),
  validate({ query: ledgerListQuerySchema }),
  asyncHandler(getMyLedger),
);

export default router;
