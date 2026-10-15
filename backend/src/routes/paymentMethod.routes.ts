import { Router } from 'express';
import {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
} from '../controllers/paymentMethod.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// Protect all routes with authentication
router.use(authenticate);

// Get all payment methods
router.get('/', getPaymentMethods);

// Create new payment method (Admin, Manager, Accountant)
router.post(
  '/',
  authorize(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT),
  validate(createPaymentMethodSchema),
  createPaymentMethod
);

// Update payment method (Admin, Manager, Accountant)
router.put(
  '/:id',
  authorize(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT),
  validate(updatePaymentMethodSchema),
  updatePaymentMethod
);

// Delete payment method (Admin, Manager)
router.delete(
  '/:id',
  authorize(Role.ADMIN, Role.MANAGER),
  deletePaymentMethod
);

export default router;
