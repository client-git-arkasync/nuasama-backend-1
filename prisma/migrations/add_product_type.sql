-- Tambah kolom product_type ke menu_items
ALTER TABLE menu_items 
  ADD COLUMN product_type VARCHAR(20) NOT NULL DEFAULT 'fnb' 
  AFTER category;

-- Tambah index untuk product_type
ALTER TABLE menu_items 
  ADD INDEX idx_menu_items_product_type (product_type);

-- Set semua produk yang ada sekarang ke fnb
UPDATE menu_items SET product_type = 'fnb';
