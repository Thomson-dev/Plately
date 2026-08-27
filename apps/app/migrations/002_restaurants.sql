CREATE TYPE restaurant_status AS ENUM ('pending', 'active', 'suspended', 'closed');

CREATE TABLE restaurants (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id                   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  name                        TEXT NOT NULL,
  description                 TEXT,
  address_line                TEXT NOT NULL,
  city                        TEXT NOT NULL,
  latitude                    DOUBLE PRECISION NOT NULL,
  longitude                   DOUBLE PRECISION NOT NULL,
  phone                       TEXT NOT NULL,
  email                       TEXT,
  status                      restaurant_status NOT NULL DEFAULT 'pending',
  delivery_radius_km          DOUBLE PRECISION NOT NULL DEFAULT 5,
  min_order_amount            NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee                NUMERIC(10,2) NOT NULL DEFAULT 0,
  estimated_delivery_minutes  INTEGER NOT NULL DEFAULT 30,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_restaurants_seller_id ON restaurants(seller_id);


CREATE INDEX idx_restaurants_status ON restaurants(status);
