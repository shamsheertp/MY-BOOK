import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import companyRoutes from './company.routes.js';
import contactRoutes from './contact.routes.js';
import productRoutes from './product.routes.js';
import saleRoutes from './sale.routes.js';
import purchaseRoutes from './purchase.routes.js';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Mount modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/company', companyRoutes);
router.use('/contacts', contactRoutes);
router.use('/products', productRoutes);
router.use('/sales', saleRoutes);
router.use('/purchases', purchaseRoutes);

export default router;

