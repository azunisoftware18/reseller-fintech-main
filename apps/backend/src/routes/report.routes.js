import { Router } from 'express';
import asyncHandler from '../lib/AsyncHandler.js';
import { AuthMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/zod-validate.js';
import { getAllRefunds } from '../controllers/refund.controller.js';
import { refundListQuerySchema } from '../validators/refund.schema.js';
import {
  transactionEarningsListQuerySchema,
  transactionListQuerySchema,
} from '../validators/transaction.schema.js';
import {
  getTransactionEarnings,
  getTransactions,
} from '../controllers/transaction.controller.js';
import { ledgerListQuerySchema } from '../validators/ledger.schema.js';
import { getMyLedger } from '../controllers/ledger.controller.js';
import { PermissionsRegistry } from '../lib/PermissionsRegistry.js';
import { PermissionMiddleware } from '../middleware/permission.middleware.js';

const router = Router();
router.use(AuthMiddleware);

router.get(
  '/refunds/list',
  PermissionMiddleware(PermissionsRegistry.REFUND.READ),
  validate({ query: refundListQuerySchema }),
  asyncHandler(getAllRefunds),
);

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

// Single endpoint: only own ledger entries
router.get(
  '/ledger/list',
  PermissionMiddleware(PermissionsRegistry.LEDGER.READ),
  validate({ query: ledgerListQuerySchema }),
  asyncHandler(getMyLedger),
);

export default router;
