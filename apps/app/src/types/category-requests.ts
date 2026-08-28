import { z } from 'zod';

// Shape of the JSON body for POST /restaurants/:restaurantId/categories.
// restaurantId is deliberately NOT a field here — it comes from the URL and
// is verified against the authenticated seller via findByIdAndSellerId, not
// trusted from the request body.
export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  displayOrder: z.number().int().nonnegative().optional(),
});

export type CreateCategoryBody = z.infer<typeof createCategorySchema>;

// Shape of the JSON body for PATCH /restaurants/:restaurantId/categories/:id —
// same client-controlled fields as create, all optional since a PATCH only
// sends what's changing.
export const updateCategorySchema = createCategorySchema.partial();

export type UpdateCategoryBody = z.infer<typeof updateCategorySchema>;
