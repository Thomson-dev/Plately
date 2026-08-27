import { pool } from '../config/db';

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
