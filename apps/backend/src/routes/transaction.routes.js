// routes/transaction.routes.js
import { Router } from 'express';
import asyncHandler from '../lib/AsyncHandler.js';
import { AuthMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/zod-validate.js';
import {
  transactionListQuerySchema,
  transactionEarningsListQuerySchema,
} from '../validators/transaction.schema.js';
import {
  getTransactions,
  getTransactionEarnings,
} from '../controllers/transaction.controller.js';
import { PermissionsRegistry } from '../lib/PermissionsRegistry.js';
import { PermissionMiddleware } from '../middleware/permission.middleware.js';

const router = Router();
router.use(AuthMiddleware);

// Transaction routes
router.get(
  '/transactions/list',
  PermissionMiddleware(PermissionsRegistry.TRANSACTION.READ),
  validate({ query: transactionListQuerySchema }),
  asyncHandler(getTransactions),
);

// Transaction earnings routes
router.get(
  '/transactions/earnings/list',
    PermissionMiddleware(PermissionsRegistry.TRANSACTION.READ),
  validate({ query: transactionEarningsListQuerySchema }),
  asyncHandler(getTransactionEarnings),
);

export default router;
