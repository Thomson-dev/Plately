CREATE TYPE restaurant_image_type AS ENUM ('logo', 'cover', 'interior', 'food');

CREATE TABLE restaurant_images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  type          restaurant_image_type NOT NULL,
  image_url     TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_restaurant_images_restaurant_id ON restaurant_images(restaurant_id);

-- At most one logo and one cover photo per restaurant; interior/food photos
-- are an unrestricted gallery.
CREATE UNIQUE INDEX idx_restaurant_images_singleton_type
  ON restaurant_images (restaurant_id, type)
  WHERE type IN ('logo', 'cover');
