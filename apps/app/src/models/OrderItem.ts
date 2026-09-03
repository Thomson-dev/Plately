import { pool, type Queryable } from '../config/db';

export interface OrderItem {
  id: string;
  orderId: string;
  foodId: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface OrderItemRow {
  id: string;
  order_id: string;
  food_id: string;
  quantity: number;
  price: string;
  subtotal: string;
}

function mapRow(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    foodId: row.food_id,
    quantity: row.quantity,
    // NUMERIC columns come back from pg as strings to avoid float rounding.
    price: Number(row.price),
    subtotal: Number(row.subtotal),
  };
}

export async function findById(id: string): Promise<OrderItem | null> {
  const result = await pool.query<OrderItemRow>('SELECT * FROM order_items WHERE id = $1', [id]);
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function findByOrderId(orderId: string): Promise<OrderItem[]> {
  const result = await pool.query<OrderItemRow>(
    'SELECT * FROM order_items WHERE order_id = $1',
    [orderId]
  );
  return result.rows.map(mapRow);
}

export async function create(
  input: {
    orderId: string;
    foodId: string;
    quantity: number;
    price: number;
    subtotal: number;
  },
  db: Queryable = pool
): Promise<OrderItem> {
  const result = await db.query<OrderItemRow>(
    `INSERT INTO order_items (order_id, food_id, quantity, price, subtotal)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [input.orderId, input.foodId, input.quantity, input.price, input.subtotal]
  );
  return mapRow(result.rows[0]);
}
