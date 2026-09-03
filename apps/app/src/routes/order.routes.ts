import { Router } from 'express';
import * as orderController from '../controllers/order.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.post('/', requireAuth, requireRole('customer'), orderController.createOrder);

export default router;
