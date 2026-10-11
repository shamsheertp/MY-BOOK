import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  changeUserPassword,
  createUserSchema,
  updateUserSchema,
  updateStatusSchema,
  changePasswordSchema,
} from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// Protect all user routes with authentication
router.use(authenticate);

// Get all users (Admin & Manager)
router.get('/', authorize(Role.ADMIN, Role.MANAGER), getUsers);

// Get user by ID (Admin & Manager)
router.get('/:id', authorize(Role.ADMIN, Role.MANAGER), getUserById);

// Create new user (Admin only)
router.post('/', authorize(Role.ADMIN), validate(createUserSchema), createUser);

// Update user details (Admin only)
router.put('/:id', authorize(Role.ADMIN), validate(updateUserSchema), updateUser);

// Delete user (Admin only)
router.delete('/:id', authorize(Role.ADMIN), deleteUser);

// Update user status (Admin only)
router.patch('/:id/status', authorize(Role.ADMIN), validate(updateStatusSchema), updateUserStatus);

// Change password (User themselves or Admin)
router.patch('/:id/password', validate(changePasswordSchema), changeUserPassword);

export default router;
