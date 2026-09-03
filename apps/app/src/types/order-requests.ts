import { z } from 'zod';

// Shape of the JSON body for POST /orders. Only foodId + quantity are
// client-controlled per item — price is looked up server-side from the
// food's current price, never trusted from the request.
const orderItemSchema = z.object({
  foodId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const createOrderSchema = z.object({
  restaurantId: z.string().uuid(),
  addressLine: z.string().trim().min(1).max(300),
  city: z.string().trim().min(1).max(120),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  items: z.array(orderItemSchema).min(1),
});

export type CreateOrderBody = z.infer<typeof createOrderSchema>;
