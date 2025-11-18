-- Make size_id, capacity_id, and esmalte_color_id optional in produccion_products table

ALTER TABLE produccion_products
  ALTER COLUMN size_id DROP NOT NULL,
  ALTER COLUMN capacity_id DROP NOT NULL,
  ALTER COLUMN esmalte_color_id DROP NOT NULL;

COMMENT ON COLUMN produccion_products.size_id IS 'Product size (optional)';
COMMENT ON COLUMN produccion_products.capacity_id IS 'Product capacity (optional)';
COMMENT ON COLUMN produccion_products.esmalte_color_id IS 'Glaze color (optional)';
