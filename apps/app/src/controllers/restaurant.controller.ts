import type { Request, Response, NextFunction } from 'express';
import * as RestaurantModel from '../models/Restaurant';
import * as restaurantService from '../services/restaurant.service';
import { createRestaurantSchema, updateRestaurantSchema } from '../types/restaurant-requests';

export async function listActiveRestaurants(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const restaurants = await RestaurantModel.findActive();
    res.json({ restaurants });
  } catch (err) {
    next(err);
  }
}

export async function createRestaurant(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = createRestaurantSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Invalid request body', errors: parsed.error.flatten() });
      return;
    }

    const sellerId = req.user!.sub;
    const restaurant = await RestaurantModel.create({ sellerId, ...parsed.data });

    res.status(201).json({ restaurant });
  } catch (err) {
    next(err);
  }
}

export async function updateRestaurant(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = updateRestaurantSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Invalid request body', errors: parsed.error.flatten() });
      return;
    }

    const sellerId = req.user!.sub;
    const restaurant = await restaurantService.updateRestaurant(
      req.params.id,
      sellerId,
      parsed.data
    );

    res.json({ restaurant });
  } catch (err) {
    next(err);
  }
}
