import { pool } from '../config/db';

export type RestaurantImageType = 'logo' | 'cover' | 'interior' | 'food';
export type SingletonImageType = 'logo' | 'cover';
export type GalleryImageType = 'interior' | 'food';

export interface RestaurantImage {
  id: string;
  restaurantId: string;
  type: RestaurantImageType;
  imageUrl: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface RestaurantImageRow {
  id: string;
  restaurant_id: string;
  type: RestaurantImageType;
  image_url: string;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: RestaurantImageRow): RestaurantImage {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    type: row.type,
    imageUrl: row.image_url,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findByRestaurantId(restaurantId: string): Promise<RestaurantImage[]> {
  const result = await pool.query<RestaurantImageRow>(
    'SELECT * FROM restaurant_images WHERE restaurant_id = $1 ORDER BY type, display_order',
    [restaurantId]
  );
  return result.rows.map(mapRow);
}

// logo/cover are singletons per restaurant (enforced by a partial unique
// index), so setting one replaces whatever was there rather than adding a row.
export async function upsertSingleton(input: {
  restaurantId: string;
  type: SingletonImageType;
  imageUrl: string;
}): Promise<RestaurantImage> {
  const result = await pool.query<RestaurantImageRow>(
    `INSERT INTO restaurant_images (restaurant_id, type, image_url)
     VALUES ($1, $2, $3)
     ON CONFLICT (restaurant_id, type) WHERE type IN ('logo', 'cover')
     DO UPDATE SET image_url = EXCLUDED.image_url, updated_at = now()
     RETURNING *`,
    [input.restaurantId, input.type, input.imageUrl]
  );
  return mapRow(result.rows[0]);
}

// interior/food photos are an unrestricted gallery, so this always adds a
// new row rather than replacing one.
export async function addGalleryImage(input: {
  restaurantId: string;
  type: GalleryImageType;
  imageUrl: string;
  displayOrder?: number;
}): Promise<RestaurantImage> {
  const result = await pool.query<RestaurantImageRow>(
    `INSERT INTO restaurant_images (restaurant_id, type, image_url, display_order)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.restaurantId, input.type, input.imageUrl, input.displayOrder ?? 0]
  );
  return mapRow(result.rows[0]);
}
