import { pool } from '../config/db';
import { HttpError } from '../utils/http-error';

export type RestaurantStatus = 'pending' | 'active' | 'suspended' | 'closed';

export interface Restaurant {
  id: string;
  sellerId: string;
  name: string;
  description: string | null;
  addressLine: string;
  city: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string | null;
  status: RestaurantStatus;
  deliveryRadiusKm: number;
  minOrderAmount: number;
  deliveryFee: number;
  estimatedDeliveryMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

interface RestaurantRow {
  id: string;
  seller_id: string;
  name: string;
  description: string | null;
  address_line: string;
  city: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string | null;
  status: RestaurantStatus;
  delivery_radius_km: number;
  min_order_amount: string;
  delivery_fee: string;
  estimated_delivery_minutes: number;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: RestaurantRow): Restaurant {
  return {
    id: row.id,
    sellerId: row.seller_id,
    name: row.name,
    description: row.description,
    addressLine: row.address_line,
    city: row.city,
    latitude: row.latitude,
    longitude: row.longitude,
    phone: row.phone,
    email: row.email,
    status: row.status,
    deliveryRadiusKm: row.delivery_radius_km,
    // NUMERIC columns come back from pg as strings to avoid float rounding.
    minOrderAmount: Number(row.min_order_amount),
    deliveryFee: Number(row.delivery_fee),
    estimatedDeliveryMinutes: row.estimated_delivery_minutes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findById(id: string): Promise<Restaurant | null> {
  const result = await pool.query<RestaurantRow>(
    "SELECT * FROM restaurants WHERE id = $1 AND status = 'active'",
    [id]
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function findActive(): Promise<Restaurant[]> {
  const result = await pool.query<RestaurantRow>(
    "SELECT * FROM restaurants WHERE status = 'active' ORDER BY created_at DESC"
  );
  return result.rows.map(mapRow);
}

export async function findBySellerId(sellerId: string): Promise<Restaurant[]> {
  const result = await pool.query<RestaurantRow>(
    'SELECT * FROM restaurants WHERE seller_id = $1 ORDER BY created_at DESC',
    [sellerId]
  );
  return result.rows.map(mapRow);
}

// Confirms ownership and existence in one query, rather than fetching by id
// and checking seller_id separately — so a stolen/guessed id can't be used
// to probe whether a restaurant exists under someone else's account.
export async function findByIdAndSellerId(
  id: string,
  sellerId: string
): Promise<Restaurant | null> {
  const result = await pool.query<RestaurantRow>(
    'SELECT * FROM restaurants WHERE id = $1 AND seller_id = $2',
    [id, sellerId]
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function create(input: {
  sellerId: string;
  name: string;
  description?: string;
  addressLine: string;
  city: string;
  latitude: number;
  longitude: number;
  phone: string;
  email?: string;
  deliveryRadiusKm?: number;
  minOrderAmount?: number;
  deliveryFee?: number;
  estimatedDeliveryMinutes?: number;
}): Promise<Restaurant> {
  const result = await pool.query<RestaurantRow>(
    `INSERT INTO restaurants (
       seller_id, name, description, address_line, city, latitude, longitude, phone, email,
       delivery_radius_km, min_order_amount, delivery_fee, estimated_delivery_minutes
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING *`,
    [
      input.sellerId,
      input.name,
      input.description ?? null,
      input.addressLine,
      input.city,
      input.latitude,
      input.longitude,
      input.phone,
      input.email ?? null,
      // Mirrors the column defaults in migrations/002_restaurants.sql — keep in sync.
      input.deliveryRadiusKm ?? 5,
      input.minOrderAmount ?? 0,
      input.deliveryFee ?? 0,
      input.estimatedDeliveryMinutes ?? 30,
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
    addressLine?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    phone?: string;
    email?: string;
    deliveryRadiusKm?: number;
    minOrderAmount?: number;
    deliveryFee?: number;
    estimatedDeliveryMinutes?: number;
  }
): Promise<Restaurant> {
  const columns: Record<string, unknown> = {
    name: patch.name,
    description: patch.description,
    address_line: patch.addressLine,
    city: patch.city,
    latitude: patch.latitude,
    longitude: patch.longitude,
    phone: patch.phone,
    email: patch.email,
    delivery_radius_km: patch.deliveryRadiusKm,
    min_order_amount: patch.minOrderAmount,
    delivery_fee: patch.deliveryFee,
    estimated_delivery_minutes: patch.estimatedDeliveryMinutes,
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

  const result = await pool.query<RestaurantRow>(
    `UPDATE restaurants SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  );
  if (!result.rows[0]) {
    throw new HttpError(404, 'Restaurant not found');
  }
  return mapRow(result.rows[0]);
}
