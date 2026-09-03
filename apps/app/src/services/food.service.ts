import * as RestaurantModel from '../models/Restaurant';
import * as CategoryModel from '../models/Category';
import * as FoodModel from '../models/Food';
import type { Food } from '../models';
import { HttpError } from '../utils/http-error';
import type { UpdateFoodBody } from '../types/food-requests';

export async function getFoodsByCategory(
  restaurantId: string,
  categoryId: string
): Promise<Food[]> {
  // findById only returns active restaurants, so this doubles as the
  // public-visibility check — no seller ownership needed for a read.
  const restaurant = await RestaurantModel.findById(restaurantId);
  if (!restaurant) {
    throw new HttpError(404, 'Restaurant not found');
  }

  const category = await CategoryModel.findByIdAndRestaurantId(categoryId, restaurantId);
  if (!category) {
    // Doesn't exist, or belongs to a different restaurant — both collapse to
    // 404 so a category id from another restaurant can't be probed for.
    throw new HttpError(404, 'Category not found');
  }

  return FoodModel.findByCategoryId(categoryId);
}

// Three ownership checks, in order: restaurant belongs to this seller, then
// category belongs to this restaurant, then food belongs to that category.
// Checking food-vs-category directly would let a food id from someone
// else's restaurant slip through as long as the URL's restaurantId/categoryId
// happened to belong to the caller.
export async function updateFood(
  restaurantId: string,
  categoryId: string,
  foodId: string,
  sellerId: string,
  patch: UpdateFoodBody
): Promise<Food> {
  const ownedRestaurant = await RestaurantModel.findByIdAndSellerId(restaurantId, sellerId);
  if (!ownedRestaurant) {
    throw new HttpError(404, 'Restaurant not found');
  }

  const category = await CategoryModel.findByIdAndRestaurantId(categoryId, restaurantId);
  if (!category) {
    throw new HttpError(404, 'Category not found');
  }

  const food = await FoodModel.findByIdAndCategoryId(foodId, categoryId);
  if (!food) {
    // Doesn't exist, or belongs to a different category — both collapse to
    // 404 so a food id from another category can't be probed for.
    throw new HttpError(404, 'Food not found');
  }

  return FoodModel.update(foodId, patch);
}

export async function deleteFood(
  restaurantId: string,
  categoryId: string,
  foodId: string,
  sellerId: string
): Promise<void> {
  const ownedRestaurant = await RestaurantModel.findByIdAndSellerId(restaurantId, sellerId);
  if (!ownedRestaurant) {
    throw new HttpError(404, 'Restaurant not found');
  }

  const category = await CategoryModel.findByIdAndRestaurantId(categoryId, restaurantId);
  if (!category) {
    throw new HttpError(404, 'Category not found');
  }

  const food = await FoodModel.findByIdAndCategoryId(foodId, categoryId);
  if (!food) {
    throw new HttpError(404, 'Food not found');
  }

  await FoodModel.deleteFood(foodId);
}
