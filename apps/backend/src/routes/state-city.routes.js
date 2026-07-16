import { Router } from 'express';
import asyncHandler from '../lib/AsyncHandler.js';
import { AuthMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/zod-validate.js';

import {
  getAllStates,
  getCitiesByState,
} from '../controllers/state-city.controller.js';

import { stateByCodeSchema } from '../validators/state-city.schema.js';

const router = Router();

// Apply authentication to all routes
router.use(AuthMiddleware);

// ==================== STATE ROUTES ====================

// Get all states (with pagination)
router.get('/states', asyncHandler(getAllStates));

// ==================== CITY ROUTES ====================

// Get cities by state code
router.get(
  '/cities/state/:stateCode',
  validate({ params: stateByCodeSchema }),
  asyncHandler(getCitiesByState),
);

export default router;
