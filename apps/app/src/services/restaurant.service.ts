import * as RestaurantModel from '../models/Restaurant';
import type { Restaurant } from '../models';
import { HttpError } from '../utils/http-error';
import type { UpdateRestaurantBody } from '../types/restaurant-requests';

export async function updateRestaurant(
  restaurantId: string,
  sellerId: string,
  patch: UpdateRestaurantBody
): Promise<Restaurant> {
  const owned = await RestaurantModel.findByIdAndSellerId(restaurantId, sellerId);
  if (!owned) {
    // Doesn't exist, or exists but belongs to a different seller — both
    // collapse to 404 so a caller can't distinguish the two (see the
    // ownership-probing note on findByIdAndSellerId).
    throw new HttpError(404, 'Restaurant not found');
  }

  return RestaurantModel.update(restaurantId, patch);
}
