import { Router } from 'express';
import {
  register,
  login,
  getMe,
  refreshToken,
  logout,
  registerSchema,
  loginSchema,
  refreshSchema,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refreshToken);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

export default router;
