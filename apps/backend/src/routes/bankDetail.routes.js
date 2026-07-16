import { Router } from 'express';
import asyncHandler from '../lib/AsyncHandler.js';
import { AuthMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/zod-validate.js';
import { PermissionMiddleware } from '../middleware/permission.middleware.js';
import { PermissionsRegistry } from '../lib/PermissionsRegistry.js';

import {
  submitBankDetail,
  approveBankDetail,
  rejectBankDetail,
  getBankDetailStatus,
  resubmitBankDetail,
  getBankDetailsForApprover,
  getUserBankDetails,
  getBankDetailById,
  setPrimaryBank,
  deleteBankDetail,
  getAllBanks,
} from '../controllers/bankDetail.controller.js';

import {
  submitBankDetailSchema,
  approveBankDetailSchema,
  rejectBankDetailSchema,
  userIdParamSchema,
  listBankDetailQuerySchema,
  resubmitBankDetailSchema,
  bankDetailIdParamSchema,
  getAllBanksQuerySchema,
} from '../validators/bankDetail.schema.js';

const router = Router();
router.use(AuthMiddleware);

// GET ALL BANKS (with pagination, search, and filters)
router.get(
  '/',
  PermissionMiddleware(PermissionsRegistry.BANK.SUBMIT),
  validate({ query: getAllBanksQuerySchema }),
  asyncHandler(getAllBanks),
);

// ✅ LIST FOR APPROVER — MUST BE BEFORE /:bankDetailId
router.get(
  '/list',
  PermissionMiddleware(PermissionsRegistry.BANK.APPROVE),
  validate({ query: listBankDetailQuerySchema }),
  asyncHandler(getBankDetailsForApprover),
);

// SUBMIT
router.post(
  '/submit',
  PermissionMiddleware(PermissionsRegistry.BANK.SUBMIT),
  validate({ body: submitBankDetailSchema }),
  asyncHandler(submitBankDetail),
);

// RESUBMIT
router.post(
  '/resubmit',
  PermissionMiddleware(PermissionsRegistry.BANK.RESUBMIT),
  validate({ body: resubmitBankDetailSchema }),
  asyncHandler(resubmitBankDetail),
);

// APPROVE
router.post(
  '/approve',
  PermissionMiddleware(PermissionsRegistry.BANK.APPROVE),
  validate({ body: approveBankDetailSchema }),
  asyncHandler(approveBankDetail),
);

// REJECT
router.post(
  '/reject',
  PermissionMiddleware(PermissionsRegistry.BANK.REJECT),
  validate({ body: rejectBankDetailSchema }),
  asyncHandler(rejectBankDetail),
);

// GET ALL BANK DETAILS FOR A USER
router.get(
  '/user/:userId',
  PermissionMiddleware(PermissionsRegistry.BANK.READ),
  validate({ params: userIdParamSchema }),
  asyncHandler(getUserBankDetails),
);

// GET STATUS (Backward compatible - returns primary bank)
router.get(
  '/status/:userId',
  PermissionMiddleware(PermissionsRegistry.BANK.READ),
  validate({ params: userIdParamSchema }),
  asyncHandler(getBankDetailStatus),
);

// GET SINGLE BANK DETAIL BY ID — MUST BE AFTER all specific routes
router.get(
  '/:bankDetailId',
  PermissionMiddleware(PermissionsRegistry.BANK.READ),
  validate({ params: bankDetailIdParamSchema }),
  asyncHandler(getBankDetailById),
);

// SET PRIMARY BANK
router.put(
  '/:bankDetailId/primary',
  PermissionMiddleware(PermissionsRegistry.BANK.UPDATE),
  validate({ params: bankDetailIdParamSchema }),
  asyncHandler(setPrimaryBank),
);

// DELETE BANK DETAIL
router.delete(
  '/:bankDetailId',
  PermissionMiddleware(PermissionsRegistry.BANK.DELETE),
  validate({ params: bankDetailIdParamSchema }),
  asyncHandler(deleteBankDetail),
);

export default router;
