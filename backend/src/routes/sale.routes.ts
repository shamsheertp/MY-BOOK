import { Router } from 'express';
import {
  getSales,
  getSaleById,
  createSale,
  recordPayment,
  voidPayment,
  updatePaymentProof,
  voidSale,
  deleteSale,
  createSaleSchema,
  recordPaymentSchema,
} from '../controllers/sale.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { Role } from '@prisma/client';

import { cacheResponse } from '../utils/cache.js';

const router = Router();

// Protect all sales routes with authentication
router.use(authenticate);

// Get all sales invoices (All authenticated users can view, cached with 45s TTL)
router.get('/', cacheResponse('sales', 45000), getSales);

// Get single sale invoice by ID or reference
router.get('/:id', cacheResponse('sales', 45000), getSaleById);

// Create new sales invoice (Admin, Manager, Accountant)
router.post(
  '/',
  authorize(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT),
  validate(createSaleSchema),
  createSale
);

// Record payment receipt for sale invoice (Admin, Manager, Accountant)
router.post(
  '/:id/payments',
  authorize(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT),
  validate(recordPaymentSchema),
  recordPayment
);

// Void a payment receipt (Admin, Manager)
router.post(
  '/:id/payments/:paymentId/void',
  authorize(Role.ADMIN, Role.MANAGER),
  voidPayment
);

// Attach or update payment proof document (Admin, Manager, Accountant)
router.patch(
  '/:id/payments/:paymentId/proof',
  authorize(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT),
  updatePaymentProof
);

// Void entire sales invoice (Admin, Manager, Accountant)
router.post(
  '/:id/void',
  authorize(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT),
  voidSale
);

// Delete sales invoice (Admin, Manager)
router.delete(
  '/:id',
  authorize(Role.ADMIN, Role.MANAGER),
  deleteSale
);

export default router;
