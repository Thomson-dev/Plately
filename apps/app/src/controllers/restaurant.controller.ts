import type { Request, Response, NextFunction } from 'express';
import * as RestaurantModel from '../models/Restaurant';
import * as CategoryModel from '../models/Category';
import * as restaurantService from '../services/restaurant.service';
import * as categoryService from '../services/category.service';
import { createRestaurantSchema, updateRestaurantSchema } from '../types/restaurant-requests';
import { createCategorySchema, updateCategorySchema } from '../types/category-requests';

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

export async function getRestaurant(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const restaurant = await RestaurantModel.findById(req.params.id);
    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    res.json({ restaurant });
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

export async function getCategories(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // findById only returns active restaurants, so this doubles as the
    // public-visibility check — no seller ownership needed for a read.
    const restaurant = await RestaurantModel.findById(req.params.restaurantId);
    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const categories = await CategoryModel.findByRestaurantId(restaurant.id);
    res.json({ categories });
  } catch (err) {
    next(err);
  }
}

export async function createCategory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = createCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Invalid request body', errors: parsed.error.flatten() });
      return;
    }

    const sellerId = req.user!.sub;
    const category = await categoryService.createCategory(
      req.params.restaurantId,
      sellerId,
      parsed.data
    );

    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = updateCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Invalid request body', errors: parsed.error.flatten() });
      return;
    }

    const sellerId = req.user!.sub;
    const category = await categoryService.updateCategory(
      req.params.restaurantId,
      req.params.categoryId,
      sellerId,
      parsed.data
    );

    res.json({ category });
  } catch (err) {
    next(err);
  }
}
