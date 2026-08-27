import { pool } from '../config/db';

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
