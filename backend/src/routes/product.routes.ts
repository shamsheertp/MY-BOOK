import { Router } from 'express';
import {
  getProducts,
  getCategories,
  getProductById,
  createProduct,
  updateProduct,
  adjustStock,
  deleteProduct,
  createProductSchema,
  updateProductSchema,
  adjustStockSchema,
} from '../controllers/product.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// Protect all product routes with authentication
router.use(authenticate);

// Get distinct categories
router.get('/categories', getCategories);

// Get all products (All authenticated users can view)
router.get('/', getProducts);

// Get product by ID or SKU
router.get('/:id', getProductById);

// Create new product (Admin, Manager, Accountant)
router.post(
  '/',
  authorize(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT),
  validate(createProductSchema),
  createProduct
);

// Update product details (Admin, Manager, Accountant)
router.put(
  '/:id',
  authorize(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT),
  validate(updateProductSchema),
  updateProduct
);

// Adjust stock in kg (Admin, Manager, Accountant)
router.post(
  '/:id/adjust-stock',
  authorize(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT),
  validate(adjustStockSchema),
  adjustStock
);

// Delete product (Admin, Manager)
router.delete(
  '/:id',
  authorize(Role.ADMIN, Role.MANAGER),
  deleteProduct
);

export default router;
