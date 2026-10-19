import { Router } from 'express';
import {
  login,
  logout,
  getCurrentUser,
  changePassword,
  getCsrfToken,
  getHealth,
} from '../controllers/auth.controller';
import {
  authenticate,
  loginRateLimiter,
  csrfProtection,
} from '../middleware/auth.middleware';

const router = Router();

router.get('/health', getHealth);
router.get('/csrf-token', getCsrfToken);
router.post('/login', loginRateLimiter, login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getCurrentUser);
router.post('/change-password', authenticate, csrfProtection, changePassword);

export default router;
