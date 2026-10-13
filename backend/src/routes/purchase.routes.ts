import { Router } from 'express';
import {
  getPurchases,
  getPurchaseById,
  createPurchase,
  createReceipt,
  voidReceipt,
  createBill,
  voidBill,
  recordPayment,
  voidPayment,
  voidPurchase,
  deletePurchase,
  createPurchaseSchema,
  createReceiptSchema,
  createBillSchema,
  recordPurchasePaymentSchema,
  voidPurchaseSchema,
} from '../controllers/purchase.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// Protect all purchase routes with authentication
router.use(authenticate);

// Get all purchase orders (All authenticated users can view)
router.get('/', getPurchases);

// Get single purchase order by ID or reference
router.get('/:id', getPurchaseById);

// Create new purchase order (Admin, Manager, Accountant)
router.post(
  '/',
  authorize(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT),
  validate(createPurchaseSchema),
  createPurchase
);

// Create goods receipt note / GRN (Admin, Manager, Accountant)
router.post(
  '/:id/receipts',
  authorize(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT),
  validate(createReceiptSchema),
  createReceipt
);

// Void goods receipt note (Admin, Manager)
router.post(
  '/:id/receipts/:receiptId/void',
  authorize(Role.ADMIN, Role.MANAGER),
  voidReceipt
);

// Create purchase bill (Admin, Manager, Accountant)
router.post(
  '/:id/bills',
  authorize(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT),
  validate(createBillSchema),
  createBill
);

// Void purchase bill (Admin, Manager)
router.post(
  '/:id/bills/:billId/void',
  authorize(Role.ADMIN, Role.MANAGER),
  voidBill
);

// Record payment out to supplier (Admin, Manager, Accountant)
router.post(
  '/:id/payments',
  authorize(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT),
  validate(recordPurchasePaymentSchema),
  recordPayment
);

// Void a payment out (Admin, Manager)
router.post(
  '/:id/payments/:paymentId/void',
  authorize(Role.ADMIN, Role.MANAGER),
  voidPayment
);

// Void entire purchase order (Admin, Manager, Accountant)
router.post(
  '/:id/void',
  authorize(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT),
  validate(voidPurchaseSchema),
  voidPurchase
);

// Delete purchase order (Admin, Manager)
router.delete(
  '/:id',
  authorize(Role.ADMIN, Role.MANAGER),
  deletePurchase
);

export default router;
