import { pool, type Queryable } from '../config/db';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface Order {
  id: string;
  customerId: string;
  restaurantId: string;
  addressLine: string;
  city: string;
  latitude: number;
  longitude: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderRow {
  id: string;
  customer_id: string;
  restaurant_id: string;
  address_line: string;
  city: string;
  latitude: number;
  longitude: number;
  total: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: OrderRow): Order {
  return {
    id: row.id,
    customerId: row.customer_id,
    restaurantId: row.restaurant_id,
    addressLine: row.address_line,
    city: row.city,
    latitude: row.latitude,
    longitude: row.longitude,
    // NUMERIC columns come back from pg as strings to avoid float rounding.
    total: Number(row.total),
    status: row.status,
    paymentStatus: row.payment_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findById(id: string): Promise<Order | null> {
  const result = await pool.query<OrderRow>('SELECT * FROM orders WHERE id = $1', [id]);
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function findByCustomerId(customerId: string): Promise<Order[]> {
  const result = await pool.query<OrderRow>(
    'SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC',
    [customerId]
  );
  return result.rows.map(mapRow);
}

export async function findByRestaurantId(restaurantId: string): Promise<Order[]> {
  const result = await pool.query<OrderRow>(
    'SELECT * FROM orders WHERE restaurant_id = $1 ORDER BY created_at DESC',
    [restaurantId]
  );
  return result.rows.map(mapRow);
}

export async function create(
  input: {
    customerId: string;
    restaurantId: string;
    addressLine: string;
    city: string;
    latitude: number;
    longitude: number;
    total: number;
  },
  db: Queryable = pool
): Promise<Order> {
  const result = await db.query<OrderRow>(
    `INSERT INTO orders (customer_id, restaurant_id, address_line, city, latitude, longitude, total)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      input.customerId,
      input.restaurantId,
      input.addressLine,
      input.city,
      input.latitude,
      input.longitude,
      input.total,
    ]
  );
  return mapRow(result.rows[0]);
}
