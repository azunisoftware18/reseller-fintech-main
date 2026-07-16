import { Router } from 'express';
import { AuthMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/zod-validate.js';

import {
  createFundTransaction,
  changeFundStatus,
  refundFundTransaction,
  listTransactions,
} from '../../controllers/fund-request/fundTransaction.controller.js';

import {
  createFundTransactionSchema,
  changeFundStatusSchema,
  fundTransactionIdParamSchema,
} from '../../validators/fund-request/fundTransaction.schema.js';

const router = Router();

router.use(AuthMiddleware);

/**
 * USER: Create fund request
 */
router.post(
  '/',
  validate({ body: createFundTransactionSchema }),
  createFundTransaction,
);

/**
 * USER: List own fund transactions
 */
router.get('/', listTransactions);

/**
 * ADMIN: Approve / Reject fund
 */
router.patch(
  '/:id/status',
  validate({
    params: fundTransactionIdParamSchema,
    body: changeFundStatusSchema,
  }),
  changeFundStatus,
);

/**
 * ADMIN: Refund fund
 */
router.post(
  '/:id/refund',
  validate({ params: fundTransactionIdParamSchema }),
  refundFundTransaction,
);

export default router;
