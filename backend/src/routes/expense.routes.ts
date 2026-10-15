import { Router } from 'express';
import {
  getExpenses,
  getExpenseSummary,
  getExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  getExpenseById,
  createExpense,
  updateExpense,
  voidExpense,
  deleteExpense,
  createExpenseSchema,
  updateExpenseSchema,
  voidExpenseSchema,
  createExpenseCategorySchema,
  updateExpenseCategorySchema,
} from '../controllers/expense.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

import { cacheResponse } from '../utils/cache.js';

// Protect all expense routes with authentication
router.use(authenticate);

// Get all expenses with filtering, searching, and pagination (cached with 45s TTL)
router.get('/', cacheResponse('expenses', 45000), getExpenses);

// Get expense analytics and summary totals (cached with 45s TTL)
router.get('/summary', cacheResponse('expenses', 45000), getExpenseSummary);

// Get all expense categories (cached with 45s TTL)
router.get('/categories', cacheResponse('expenses', 45000), getExpenseCategories);

// Create custom expense category (Admin, Manager, Accountant)
router.post(
  '/categories',
  authorize(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT),
  validate(createExpenseCategorySchema),
  createExpenseCategory
);

// Update expense category (Admin, Manager, Accountant)
router.put(
  '/categories/:id',
  authorize(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT),
  validate(updateExpenseCategorySchema),
  updateExpenseCategory
);

// Delete expense category (Admin, Manager)
router.delete(
  '/categories/:id',
  authorize(Role.ADMIN, Role.MANAGER),
  deleteExpenseCategory
);

// Get single expense by ID or reference code
router.get('/:id', getExpenseById);

// Create new expense with validation (Admin, Manager, Accountant)
router.post(
  '/',
  authorize(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT),
  validate(createExpenseSchema),
  createExpense
);

// Update expense details with validation (Admin, Manager, Accountant)
router.put(
  '/:id',
  authorize(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT),
  validate(updateExpenseSchema),
  updateExpense
);

// Void an expense (Requires Admin PIN) (Admin, Manager, Accountant)
router.post(
  '/:id/void',
  authorize(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT),
  validate(voidExpenseSchema),
  voidExpense
);

// Delete an expense (Admin, Manager)
router.delete(
  '/:id',
  authorize(Role.ADMIN, Role.MANAGER),
  deleteExpense
);

export default router;
