import { Router } from 'express';
import { getLedgerAccounts, getLedgerAccountDetails } from '../controllers/ledger.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

import { cacheResponse } from '../utils/cache.js';

const router = Router();

// Protect all ledger routes with authentication
router.use(authenticate);

// Get Chart of Accounts with live ledger balances (cached with 45s TTL)
router.get('/accounts', cacheResponse('ledgers', 45000), getLedgerAccounts);
router.get('/chart-of-accounts', cacheResponse('ledgers', 45000), getLedgerAccounts);

// Get detailed running ledger for a specific account code (cached with 45s TTL)
router.get('/accounts/:code', cacheResponse('ledgers', 45000), getLedgerAccountDetails);
router.get('/:code', cacheResponse('ledgers', 45000), getLedgerAccountDetails);

export default router;
