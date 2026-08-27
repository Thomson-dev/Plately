import { pool } from '../config/db';

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface RestaurantHours {
  id: string;
  restaurantId: string;
  dayOfWeek: DayOfWeek;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface RestaurantHoursRow {
  id: string;
  restaurant_id: string;
  day_of_week: DayOfWeek;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: RestaurantHoursRow): RestaurantHours {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    dayOfWeek: row.day_of_week,
    openTime: row.open_time,
    closeTime: row.close_time,
    isClosed: row.is_closed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findByRestaurantId(restaurantId: string): Promise<RestaurantHours[]> {
  const result = await pool.query<RestaurantHoursRow>(
    'SELECT * FROM restaurant_hours WHERE restaurant_id = $1 ORDER BY day_of_week',
    [restaurantId]
  );
  return result.rows.map(mapRow);
}

type UpsertDayInput =
  | { restaurantId: string; dayOfWeek: DayOfWeek; isClosed: true }
  | {
      restaurantId: string;
      dayOfWeek: DayOfWeek;
      isClosed: false;
      openTime: string;
      closeTime: string;
    };

export async function upsertDay(input: UpsertDayInput): Promise<RestaurantHours> {
  const openTime = input.isClosed ? null : input.openTime;
  const closeTime = input.isClosed ? null : input.closeTime;

  const result = await pool.query<RestaurantHoursRow>(
    `INSERT INTO restaurant_hours (restaurant_id, day_of_week, open_time, close_time, is_closed)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (restaurant_id, day_of_week)
     DO UPDATE SET
       open_time = EXCLUDED.open_time,
       close_time = EXCLUDED.close_time,
       is_closed = EXCLUDED.is_closed,
       updated_at = now()
     RETURNING *`,
    [input.restaurantId, input.dayOfWeek, openTime, closeTime, input.isClosed]
  );
  return mapRow(result.rows[0]);
}
