import * as RestaurantModel from '../models/Restaurant';
import * as CategoryModel from '../models/Category';
import type { Category } from '../models';
import { HttpError } from '../utils/http-error';
import type { CreateCategoryBody, UpdateCategoryBody } from '../types/category-requests';

export async function createCategory(
  restaurantId: string,
  sellerId: string,
  body: CreateCategoryBody
): Promise<Category> {
  const owned = await RestaurantModel.findByIdAndSellerId(restaurantId, sellerId);
  if (!owned) {
    // Doesn't exist, or exists but belongs to a different seller — both
    // collapse to 404 so a caller can't distinguish the two (see the
    // ownership-probing note on findByIdAndSellerId).
    throw new HttpError(404, 'Restaurant not found');
  }

  return CategoryModel.create({ restaurantId, ...body });
}

// Two ownership checks, in order: restaurant belongs to this seller, then
// category belongs to this restaurant. Checking category-vs-seller directly
// would let a category id from someone else's restaurant slip through as
// long as the URL's restaurantId happened to belong to the caller.
export async function updateCategory(
  restaurantId: string,
  categoryId: string,
  sellerId: string,
  patch: UpdateCategoryBody
): Promise<Category> {
  const ownedRestaurant = await RestaurantModel.findByIdAndSellerId(restaurantId, sellerId);
  if (!ownedRestaurant) {
    throw new HttpError(404, 'Restaurant not found');
  }

  const category = await CategoryModel.findByIdAndRestaurantId(categoryId, restaurantId);
  if (!category) {
    // Doesn't exist, or belongs to a different restaurant — both collapse to
    // 404 so a category id from another restaurant can't be probed for.
    throw new HttpError(404, 'Category not found');
  }

  return CategoryModel.update(categoryId, patch);
}

export async function deleteCategory(
  restaurantId: string,
  categoryId: string,
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

  await CategoryModel.deleteCategory(categoryId);
}
