-- Add peso_esmaltado and costo_pasta fields to produccion_products table

ALTER TABLE produccion_products
  ADD COLUMN peso_esmaltado DECIMAL(10, 2),
  ADD COLUMN costo_pasta DECIMAL(10, 2);

COMMENT ON COLUMN produccion_products.peso_esmaltado IS 'Glazed weight in grams (optional)';
COMMENT ON COLUMN produccion_products.costo_pasta IS 'Paste cost in MXN (optional)';
