CREATE TYPE day_of_week AS ENUM (
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
);

CREATE TABLE restaurant_hours (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  day_of_week   day_of_week NOT NULL,
  open_time     TIME,
  close_time    TIME,
  is_closed     BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (restaurant_id, day_of_week),
  CHECK (
    (is_closed = true  AND open_time IS NULL     AND close_time IS NULL)
    OR
    (is_closed = false AND open_time IS NOT NULL AND close_time IS NOT NULL)
  )
);
