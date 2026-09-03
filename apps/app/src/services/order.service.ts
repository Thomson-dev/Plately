import * as RestaurantModel from '../models/Restaurant';
import * as FoodModel from '../models/Food';
import * as OrderModel from '../models/Order';
import * as OrderItemModel from '../models/OrderItem';
import type { Order, OrderItem } from '../models';
import { HttpError } from '../utils/http-error';
import { withTransaction } from '../config/db';
import type { CreateOrderBody } from '../types/order-requests';

export async function createOrder(
  customerId: string,
  body: CreateOrderBody
): Promise<{ order: Order; items: OrderItem[] }> {
  // findById only returns active restaurants, so this doubles as the
  // "can this restaurant take orders" check.
  const restaurant = await RestaurantModel.findById(body.restaurantId);
  if (!restaurant) {
    throw new HttpError(404, 'Restaurant not found');
  }

  // Resolve and validate every item — existence, restaurant ownership, and
  // availability — before writing anything, so a bad item fails the whole
  // order instead of leaving a partial one behind. Price comes from the
  // food's current row, never from the request body.
  const lineItems = await Promise.all(
    body.items.map(async (item) => {
      const food = await FoodModel.findByIdAndRestaurantId(item.foodId, restaurant.id);
      if (!food) {
        // Doesn't exist, or belongs to a different restaurant — both
        // collapse to 404 so a food id from elsewhere can't be probed for.
        throw new HttpError(404, `Food not found: ${item.foodId}`);
      }
      if (!food.isAvailable) {
        throw new HttpError(400, `Food not available: ${food.name}`);
      }

      const subtotal = Number((food.price * item.quantity).toFixed(2));
      return { foodId: food.id, quantity: item.quantity, price: food.price, subtotal };
    })
  );

  const total = Number(lineItems.reduce((sum, li) => sum + li.subtotal, 0).toFixed(2));

  return withTransaction(async (client) => {
    const order = await OrderModel.create(
      {
        customerId,
        restaurantId: restaurant.id,
        addressLine: body.addressLine,
        city: body.city,
        latitude: body.latitude,
        longitude: body.longitude,
        total,
      },
      client
    );

    const items = await Promise.all(
      lineItems.map((li) => OrderItemModel.create({ orderId: order.id, ...li }, client))
    );

    return { order, items };
  });
}
