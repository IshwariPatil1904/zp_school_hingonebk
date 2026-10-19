import { Router } from 'express';
import authRoutes from './auth.routes';
import publicRoutes from './public.routes';
import portalRoutes from './portal.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/public', publicRoutes);
router.use('/portal', portalRoutes);

export default router;
