import { Router } from 'express';
import asyncHandler from '../lib/AsyncHandler.js';
import { AuthMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/zod-validate.js';
import { PermissionMiddleware } from '../middleware/permission.middleware.js';
import { PermissionsRegistry } from '../lib/PermissionsRegistry.js';
import upload from '../middleware/multer.middleware.js';

import {
  submitKyc,
  approveKyc,
  rejectKyc,
  getKycStatus,
  resubmitKyc,
  getKycsForApprover,
} from '../controllers/kyc.controller.js';

import {
  submitKycSchema,
  approveKycSchema,
  rejectKycSchema,
  userIdParamSchema,
  listKycQuerySchema,
  resubmitKycSchema,
} from '../validators/kyc.schema.js';
import { parseFormJson } from '../middleware/parseFormJson.middleware.js';

const router = Router();
router.use(AuthMiddleware);

// Fields that contain JSON strings in multipart form-data
const JSON_FIELDS = ['personalInfo', 'address', 'documents'];

// SUBMIT
router.post(
  '/submit',
  upload.array('documents', 5),
  parseFormJson(JSON_FIELDS),
  validate({ body: submitKycSchema }),
  asyncHandler(submitKyc),
);

// RESUBMIT
router.post(
  '/resubmit',
  upload.array('documents', 5),
  parseFormJson(JSON_FIELDS),
  validate({ body: resubmitKycSchema }),
  asyncHandler(resubmitKyc),
);

router.post(
  '/approve',
  PermissionMiddleware(PermissionsRegistry.KYC.APPROVE),
  validate({ body: approveKycSchema }),
  asyncHandler(approveKyc),
);

router.post(
  '/reject',
  PermissionMiddleware(PermissionsRegistry.KYC.REJECT),
  validate({ body: rejectKycSchema }),
  asyncHandler(rejectKyc),
);

router.get(
  '/status/:userId',
  validate({ params: userIdParamSchema }),
  asyncHandler(getKycStatus),
);

router.get(
  '/list',
  PermissionMiddleware(PermissionsRegistry.KYC.APPROVE),
  validate({ query: listKycQuerySchema }),
  asyncHandler(getKycsForApprover),
);

export default router;
