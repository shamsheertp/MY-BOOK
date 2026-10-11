import { Router } from 'express';
import {
  getCompanyProfile,
  updateCompanyProfile,
  updateCompanyProfileSchema,
} from '../controllers/company.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// GET company profile - available to all authenticated users
router.get('/', authenticate, getCompanyProfile);

// PUT / PATCH company profile - restricted to Admin & Manager
router.put(
  '/',
  authenticate,
  authorize(Role.ADMIN, Role.MANAGER),
  validate(updateCompanyProfileSchema),
  updateCompanyProfile
);

router.patch(
  '/',
  authenticate,
  authorize(Role.ADMIN, Role.MANAGER),
  validate(updateCompanyProfileSchema),
  updateCompanyProfile
);

export default router;
