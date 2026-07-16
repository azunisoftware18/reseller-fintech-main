import { Router } from 'express';
import asyncHandler from '../lib/AsyncHandler.js';
import { AuthMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/zod-validate.js';
import { PermissionMiddleware } from '../middleware/permission.middleware.js';
import { PermissionsRegistryAdmin } from '../lib/PermissionsRegistryAdmin.js';

import {
  createServiceSchema,
  updateServiceSchema,
  idParamSchema,
  createProviderSchema,
  updateProviderSchema,
  createServiceProviderMappingSchema,
  updateServiceProviderMappingSchema,
} from '../validators/service.schema.js';

import {
  createMapping,
  createProvider,
  createService,
  getAllowedMappings,
  getMappings,
  getProviders,
  getServices,
  hardDeleteMapping,
  updateMapping,
  updateProvider,
  updateService,
} from '../controllers/service.controller.js';

const router = Router();

router.use(AuthMiddleware);

/* ================= SERVICES ================= */

router.post(
  '/services/',
  PermissionMiddleware(PermissionsRegistryAdmin.SERVICE.CREATE),
  validate({ body: createServiceSchema }),
  asyncHandler(createService),
);

router.get(
  '/services/',
  PermissionMiddleware(PermissionsRegistryAdmin.SERVICE.READ),
  asyncHandler(getServices),
);

router.patch(
  '/services/:id',
  PermissionMiddleware(PermissionsRegistryAdmin.SERVICE.UPDATE),
  validate({
    params: idParamSchema,
    body: updateServiceSchema,
  }),
  asyncHandler(updateService),
);

/* ================= PROVIDERS ================= */

router.post(
  '/providers/',
  PermissionMiddleware(PermissionsRegistryAdmin.PROVIDER.CREATE),
  validate({ body: createProviderSchema }),
  asyncHandler(createProvider),
);

router.get(
  '/providers/',
  PermissionMiddleware(PermissionsRegistryAdmin.PROVIDER.READ),
  asyncHandler(getProviders),
);

router.patch(
  '/providers/:id',
  PermissionMiddleware(PermissionsRegistryAdmin.PROVIDER.UPDATE),
  validate({
    params: idParamSchema,
    body: updateProviderSchema,
  }),
  asyncHandler(updateProvider),
);

/* ================= MAPPINGS ================= */

router.post(
  '/mappings/',
  PermissionMiddleware(PermissionsRegistryAdmin.MAPPING.CREATE),
  validate({ body: createServiceProviderMappingSchema }),
  asyncHandler(createMapping),
);

router.get(
  '/mappings/',
  PermissionMiddleware(PermissionsRegistryAdmin.MAPPING.READ),
  asyncHandler(getMappings),
);

router.get('/mappings/allowed', asyncHandler(getAllowedMappings));

router.patch(
  '/mappings/:id',
  PermissionMiddleware(PermissionsRegistryAdmin.MAPPING.UPDATE),
  validate({
    params: idParamSchema,
    body: updateServiceProviderMappingSchema,
  }),
  asyncHandler(updateMapping),
);

router.delete(
  '/mappings/hard/:id',
  PermissionMiddleware(PermissionsRegistryAdmin.MAPPING.DELETE),
  validate({ params: idParamSchema }),
  asyncHandler(hardDeleteMapping),
);

export default router;
