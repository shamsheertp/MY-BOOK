import { Router } from 'express';
import {
  getSales,
  getSaleById,
  createSale,
  recordPayment,
  voidPayment,
  voidSale,
  deleteSale,
  createSaleSchema,
  recordPaymentSchema,
} from '../controllers/sale.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// Protect all sales routes with authentication
router.use(authenticate);

// Get all sales invoices (All authenticated users can view)
router.get('/', getSales);

// Get single sale invoice by ID or reference
router.get('/:id', getSaleById);

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
