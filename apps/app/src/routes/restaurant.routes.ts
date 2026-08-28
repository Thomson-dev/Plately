import { Router } from 'express';
import * as restaurantController from '../controllers/restaurant.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', restaurantController.listActiveRestaurants);
router.get('/:id', restaurantController.getRestaurant);
router.post('/', requireAuth, requireRole('seller'), restaurantController.createRestaurant);
router.patch('/:id', requireAuth, requireRole('seller'), restaurantController.updateRestaurant);
router.get('/:restaurantId/categories', restaurantController.getCategories);
router.post(
  '/:restaurantId/categories',
  requireAuth,
  requireRole('seller'),
  restaurantController.createCategory
);
router.patch(
  '/:restaurantId/categories/:categoryId',
  requireAuth,
  requireRole('seller'),
  restaurantController.updateCategory
);
router.delete(
  '/:restaurantId/categories/:categoryId',
  requireAuth,
  requireRole('seller'),
  restaurantController.deleteCategory
);

export default router;
