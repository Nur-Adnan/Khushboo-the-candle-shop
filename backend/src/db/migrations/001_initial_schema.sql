CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_bn VARCHAR(100),
  image_public_id VARCHAR(255),
  product_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  name_bn VARCHAR(200),
  description TEXT,
  description_bn TEXT,
  price INTEGER NOT NULL CHECK (price >= 0),
  category_id VARCHAR(50) REFERENCES categories(id),
  scent_notes TEXT,
  burn_time VARCHAR(50),
  size VARCHAR(50),
  image_public_ids TEXT[] NOT NULL DEFAULT '{}',
  in_stock BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(200) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS token_blacklist (
  token_hash VARCHAR(255) PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL CHECK (
    event_type IN ('product_view', 'wishlist_add', 'wishlist_remove', 'order_intent', 'product_share')
  ),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  session_id VARCHAR(100),
  event_hash VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_product ON analytics_events(product_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_hash ON analytics_events(event_hash);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);

CREATE INDEX IF NOT EXISTS idx_products_search ON products
  USING GIN(to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(scent_notes, '')));

INSERT INTO categories (id, name, name_bn)
VALUES
  ('floral', 'Floral', 'ফুলের সুবাস'),
  ('fruity', 'Fruity', 'ফলের সুবাস'),
  ('woody', 'Woody', 'কাঠের সুবাস'),
  ('fresh', 'Fresh', 'তাজা সুবাস'),
  ('spicy', 'Spicy', 'মসলাদার সুবাস'),
  ('seasonal', 'Seasonal', 'মৌসুমি'),
  ('luxury', 'Luxury', 'লাক্সারি'),
  ('eco-friendly', 'Eco-Friendly', 'পরিবেশবান্ধব')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_bn = EXCLUDED.name_bn;
