import { Router } from 'express';
import {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  createContactSchema,
  updateContactSchema,
} from '../controllers/contact.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// Protect all contact routes with authentication
router.use(authenticate);

// Get all contacts (All authenticated users can view)
router.get('/', getContacts);

// Get contact by ID or code
router.get('/:id', getContactById);

// Create new contact (Admin, Manager, Accountant)
router.post(
  '/',
  authorize(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT),
  validate(createContactSchema),
  createContact
);

// Update contact details (Admin, Manager, Accountant)
router.put(
  '/:id',
  authorize(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT),
  validate(updateContactSchema),
  updateContact
);

// Delete contact (Admin, Manager)
router.delete(
  '/:id',
  authorize(Role.ADMIN, Role.MANAGER),
  deleteContact
);

export default router;
