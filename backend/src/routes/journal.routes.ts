import { Router } from 'express';
import {
  getJournals,
  getJournalById,
  createJournal,
  voidJournal,
  createJournalSchema,
  voidJournalSchema,
} from '../controllers/journal.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { Role } from '@prisma/client';

import { cacheResponse } from '../utils/cache.js';

const router = Router();

// Protect all journal routes with authentication
router.use(authenticate);

// List journals with search, status, date filters, and pagination (cached with 45s TTL)
router.get('/', cacheResponse('journals', 45000), getJournals);

// Get single journal by ID or Ref (cached with 45s TTL)
router.get('/:id', cacheResponse('journals', 45000), getJournalById);

// Create new journal entry (Admin, Manager, Accountant)
router.post(
  '/',
  authorize(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT),
  validate(createJournalSchema),
  createJournal
);

// Void a journal entry (Admin, Manager, Accountant with PIN)
router.post(
  '/:id/void',
  authorize(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT),
  validate(voidJournalSchema),
  voidJournal
);

export default router;
