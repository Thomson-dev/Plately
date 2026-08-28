import { pool } from '../config/db';
import { HttpError } from '../utils/http-error';

export interface Category {
  id: string;
  restaurantId: string;
  name: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CategoryRow {
  id: string;
  restaurant_id: string;
  name: string;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: CategoryRow): Category {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    name: row.name,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findById(id: string): Promise<Category | null> {
  const result = await pool.query<CategoryRow>('SELECT * FROM categories WHERE id = $1', [id]);
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function findByRestaurantId(restaurantId: string): Promise<Category[]> {
  const result = await pool.query<CategoryRow>(
    'SELECT * FROM categories WHERE restaurant_id = $1 ORDER BY display_order, name',
    [restaurantId]
  );
  return result.rows.map(mapRow);
}

// Confirms the category belongs to this restaurant in one query, rather than
// fetching by id and checking restaurant_id separately — so a category id
// from one restaurant can't be used to update a category under another.
export async function findByIdAndRestaurantId(
  id: string,
  restaurantId: string
): Promise<Category | null> {
  const result = await pool.query<CategoryRow>(
    'SELECT * FROM categories WHERE id = $1 AND restaurant_id = $2',
    [id, restaurantId]
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function create(input: {
  restaurantId: string;
  name: string;
  displayOrder?: number;
}): Promise<Category> {
  const result = await pool.query<CategoryRow>(
    `INSERT INTO categories (restaurant_id, name, display_order)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [input.restaurantId, input.name, input.displayOrder ?? 0]
  );
  return mapRow(result.rows[0]);
}

// PATCH-style partial update: only columns present (not undefined) in
// `patch` are included in the SET clause, so omitted fields are left alone.
export async function update(
  id: string,
  patch: {
    name?: string;
    displayOrder?: number;
  }
): Promise<Category> {
  const columns: Record<string, unknown> = {
    name: patch.name,
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

  const result = await pool.query<CategoryRow>(
    `UPDATE categories SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  );
  if (!result.rows[0]) {
    throw new HttpError(404, 'Category not found');
  }
  return mapRow(result.rows[0]);
}

export async function deleteCategory(id: string): Promise<void> {
  await pool.query('DELETE FROM categories WHERE id = $1', [id]);
}
