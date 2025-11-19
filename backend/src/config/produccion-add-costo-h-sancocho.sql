-- Add costo_h_sancocho field to produccion_products table

ALTER TABLE produccion_products
  ADD COLUMN costo_h_sancocho DECIMAL(10, 2);

COMMENT ON COLUMN produccion_products.costo_h_sancocho IS 'Sancochado firing cost in MXN (optional)';
