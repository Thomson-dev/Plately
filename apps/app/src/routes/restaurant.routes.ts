import { Router } from 'express';
import * as restaurantController from '../controllers/restaurant.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', restaurantController.listActiveRestaurants);
router.post('/', requireAuth, requireRole('seller'), restaurantController.createRestaurant);
router.patch('/:id', requireAuth, requireRole('seller'), restaurantController.updateRestaurant);

export default router;
