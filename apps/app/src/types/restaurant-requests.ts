import { z } from 'zod';

// Shape of the JSON body for POST /restaurants — client-controlled fields
// only. seller_id, id, status, created_at, updated_at are server-controlled
// and must never be read from this schema's source (req.body).
export const createRestaurantSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  addressLine: z.string().trim().min(1).max(300),
  city: z.string().trim().min(1).max(120),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  phone: z.string().trim().min(1).max(30),
  email: z.string().trim().email().optional(),
  deliveryRadiusKm: z.number().positive().optional(),
  minOrderAmount: z.number().nonnegative().optional(),
  deliveryFee: z.number().nonnegative().optional(),
  estimatedDeliveryMinutes: z.number().int().positive().optional(),
});

export type CreateRestaurantBody = z.infer<typeof createRestaurantSchema>;

// Shape of the JSON body for PATCH /restaurants/:id — same client-controlled
// fields as create, all optional since a PATCH only sends what's changing.
export const updateRestaurantSchema = createRestaurantSchema.partial();

export type UpdateRestaurantBody = z.infer<typeof updateRestaurantSchema>;
