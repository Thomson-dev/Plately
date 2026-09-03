import { z } from 'zod';

// Shape of the JSON body for PATCH /restaurants/:restaurantId/categories/:categoryId/foods/:foodId.
// All fields optional since a PATCH only sends what's changing. categoryId is
// deliberately NOT a field here — it comes from the URL and is verified via
// the seller → restaurant → category → food ownership chain, not trusted
// from the request body.
export const updateFoodSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  price: z.number().positive().optional(),
  imageUrl: z.string().trim().url().optional(),
  isAvailable: z.boolean().optional(),
  displayOrder: z.number().int().nonnegative().optional(),
});

export type UpdateFoodBody = z.infer<typeof updateFoodSchema>;
