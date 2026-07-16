import { Router } from 'express';
import { AuthMiddleware } from '../middleware/auth.middleware.js';
import asyncHandler from '../lib/AsyncHandler.js';
import { findAllPermissions } from '../controllers/permisson.controller.js';

const router = Router();

router.use(AuthMiddleware);

router.get('/', asyncHandler(findAllPermissions));

export default router;
