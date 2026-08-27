import { pool } from '../config/db';

export interface Review {
  id: string;
  restaurantId: string;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ReviewRow {
  id: string;
  restaurant_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: ReviewRow): Review {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    userId: row.user_id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findByRestaurantId(restaurantId: string): Promise<Review[]> {
  const result = await pool.query<ReviewRow>(
    'SELECT * FROM reviews WHERE restaurant_id = $1 ORDER BY created_at DESC',
    [restaurantId]
  );
  return result.rows.map(mapRow);
}

export async function findByUserId(userId: string): Promise<Review[]> {
  const result = await pool.query<ReviewRow>(
    'SELECT * FROM reviews WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows.map(mapRow);
}

// A user can only have one review per restaurant, so leaving another
// replaces the existing one rather than adding a row.
export async function upsert(input: {
  restaurantId: string;
  userId: string;
  rating: number;
  comment?: string;
}): Promise<Review> {
  const result = await pool.query<ReviewRow>(
    `INSERT INTO reviews (restaurant_id, user_id, rating, comment)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (restaurant_id, user_id)
     DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, updated_at = now()
     RETURNING *`,
    [input.restaurantId, input.userId, input.rating, input.comment ?? null]
  );
  return mapRow(result.rows[0]);
}
