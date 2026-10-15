import { Router } from 'express';
import { getProfitAndLoss } from '../controllers/report.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

import { cacheResponse } from '../utils/cache.js';

const router = Router();

// Protect all report routes with authentication
router.use(authenticate);

// Get live Profit & Loss (Income Statement, cached with 45s TTL)
router.get('/profit-and-loss', cacheResponse('reports', 45000), getProfitAndLoss);

export default router;
