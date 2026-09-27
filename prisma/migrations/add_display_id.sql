-- Migration: add display_id to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS display_id VARCHAR(50) NULL AFTER id;
CREATE INDEX IF NOT EXISTS idx_orders_display_id ON orders(display_id);
