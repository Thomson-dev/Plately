import { pool } from '../config/db';
import { HttpError } from '../utils/http-error';

export interface Food {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface FoodRow {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  is_available: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: FoodRow): Food {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description,
    // NUMERIC columns come back from pg as strings to avoid float rounding.
    price: Number(row.price),
    imageUrl: row.image_url,
    isAvailable: row.is_available,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findById(id: string): Promise<Food | null> {
  const result = await pool.query<FoodRow>('SELECT * FROM foods WHERE id = $1', [id]);
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function findByCategoryId(categoryId: string): Promise<Food[]> {
  const result = await pool.query<FoodRow>(
    'SELECT * FROM foods WHERE category_id = $1 ORDER BY display_order, name',
    [categoryId]
  );
  return result.rows.map(mapRow);
}

// Confirms the food belongs to this category in one query, rather than
// fetching by id and checking category_id separately — so a food id from
// one category can't be used to update a food under another.
export async function findByIdAndCategoryId(id: string, categoryId: string): Promise<Food | null> {
  const result = await pool.query<FoodRow>(
    'SELECT * FROM foods WHERE id = $1 AND category_id = $2',
    [id, categoryId]
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

// Confirms the food belongs to this restaurant (via its category) in one
// query, rather than fetching by id and checking separately — so a food id
// from another restaurant can't be used to order across restaurants.
export async function findByIdAndRestaurantId(id: string, restaurantId: string): Promise<Food | null> {
  const result = await pool.query<FoodRow>(
    `SELECT foods.* FROM foods
     JOIN categories ON categories.id = foods.category_id
     WHERE foods.id = $1 AND categories.restaurant_id = $2`,
    [id, restaurantId]
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function create(input: {
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  displayOrder?: number;
}): Promise<Food> {
  const result = await pool.query<FoodRow>(
    `INSERT INTO foods (category_id, name, description, price, image_url, display_order)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      input.categoryId,
      input.name,
      input.description ?? null,
      input.price,
      input.imageUrl ?? null,
      input.displayOrder ?? 0,
    ]
  );
  return mapRow(result.rows[0]);
}

// PATCH-style partial update: only columns present (not undefined) in
// `patch` are included in the SET clause, so omitted fields are left alone.
export async function update(
  id: string,
  patch: {
    name?: string;
    description?: string;
    price?: number;
    imageUrl?: string;
    isAvailable?: boolean;
    displayOrder?: number;
  }
): Promise<Food> {
  const columns: Record<string, unknown> = {
    name: patch.name,
    description: patch.description,
    price: patch.price,
    image_url: patch.imageUrl,
    is_available: patch.isAvailable,
    display_order: patch.displayOrder,
  };

  const setClauses: string[] = [];
  const values: unknown[] = [];

  for (const [column, value] of Object.entries(columns)) {
    if (value === undefined) continue;
    values.push(value);
    setClauses.push(`${column} = $${values.length}`);
  }

  setClauses.push('updated_at = now()');
  values.push(id);

  const result = await pool.query<FoodRow>(
    `UPDATE foods SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  );
  if (!result.rows[0]) {
    throw new HttpError(404, 'Food not found');
  }
  return mapRow(result.rows[0]);
}

export async function deleteFood(id: string): Promise<void> {
  await pool.query('DELETE FROM foods WHERE id = $1', [id]);
}
