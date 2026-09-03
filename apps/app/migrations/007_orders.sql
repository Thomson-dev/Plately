CREATE TYPE order_status AS ENUM (
  'pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'
);

CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed');

CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE RESTRICT,
  address_line    TEXT NOT NULL,
  city            TEXT NOT NULL,
  latitude        DOUBLE PRECISION NOT NULL,
  longitude       DOUBLE PRECISION NOT NULL,
  total           NUMERIC(10,2) NOT NULL,
  status          order_status NOT NULL DEFAULT 'pending',
  payment_status  payment_status NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_status ON orders(status);
