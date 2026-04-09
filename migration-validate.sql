-- migration-validate.sql
-- Kör i Neon-konsolen efter schema.sql

CREATE TABLE IF NOT EXISTS shipments (
  id           SERIAL PRIMARY KEY,
  from_location TEXT NOT NULL,
  to_location   TEXT NOT NULL,
  weight_kg     NUMERIC,
  goods_type    TEXT,
  carrier       TEXT,
  price         INTEGER NOT NULL,
  delivery_days INTEGER,
  status        TEXT,   -- rimligt | lite_hogt | avvikande
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Index för korridorjämförelse (regelmotor-query)
CREATE INDEX IF NOT EXISTS idx_shipments_corridor
  ON shipments (from_location, to_location, goods_type);
