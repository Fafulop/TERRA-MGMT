-- ============================================================
-- CERAMICS INVENTORY - SIMPLIFY STRUCTURE
-- ============================================================
-- Change concepto from array to single value
-- Add enamel_color_id to products
-- Remove unused tables
-- ============================================================

-- STEP 1: Drop all views and tables that depend on columns we're changing
-- ============================================================

-- Drop views that are no longer needed (FIRST!)
DROP VIEW IF EXISTS v_ceramics_inventory_summary CASCADE;
DROP VIEW IF EXISTS v_loss_analysis CASCADE;

-- Drop unused tables (these reference ceramic_products)
DROP TABLE IF EXISTS stage_3_inventory CASCADE;
DROP TABLE IF EXISTS stage_2_inventory CASCADE;
DROP TABLE IF EXISTS stage_1_inventory CASCADE;
DROP TABLE IF EXISTS stage_transactions CASCADE;
DROP TABLE IF EXISTS ceramic_sizes CASCADE;

-- STEP 2: Modify ceramic_products table structure
-- ============================================================

-- Drop constraints that reference concepto as array
ALTER TABLE ceramic_products DROP CONSTRAINT IF EXISTS check_concepto_not_empty;
ALTER TABLE ceramic_products DROP CONSTRAINT IF EXISTS check_concepto_valid_values;

-- Drop the concepto column (array type)
ALTER TABLE ceramic_products DROP COLUMN IF EXISTS concepto;

-- Add new concepto column (single value)
ALTER TABLE ceramic_products
ADD COLUMN concepto VARCHAR(20);

-- Add enamel_color_id to products (nullable, required only for ESMALTADO)
ALTER TABLE ceramic_products
ADD COLUMN IF NOT EXISTS enamel_color_id INTEGER REFERENCES ceramic_enamel_colors(id) ON DELETE SET NULL;

-- STEP 3: Set default values
-- ============================================================

-- Update existing products with default concepto
UPDATE ceramic_products
SET concepto = 'CRUDO'
WHERE concepto IS NULL;

-- Make concepto NOT NULL after setting defaults
ALTER TABLE ceramic_products
ALTER COLUMN concepto SET NOT NULL;

-- STEP 4: Add constraints
-- ============================================================

-- Add constraint: concepto must be valid value
ALTER TABLE ceramic_products
ADD CONSTRAINT check_concepto_valid
CHECK (concepto IN ('CRUDO', 'SANCOCHADO', 'ESMALTADO'));

-- Add constraint: if ESMALTADO, must have color
ALTER TABLE ceramic_products
ADD CONSTRAINT check_esmaltado_requires_color
CHECK (
  (concepto = 'ESMALTADO' AND enamel_color_id IS NOT NULL) OR
  (concepto != 'ESMALTADO')
);

-- STEP 5: Add indexes
-- ============================================================

-- Add index for enamel_color_id
CREATE INDEX IF NOT EXISTS idx_ceramic_products_enamel_color ON ceramic_products(enamel_color_id);

-- Update table comments
COMMENT ON COLUMN ceramic_products.concepto IS 'Single stage value: CRUDO, SANCOCHADO, or ESMALTADO';
COMMENT ON COLUMN ceramic_products.enamel_color_id IS 'Required if concepto is ESMALTADO, NULL otherwise';
COMMENT ON COLUMN ceramic_products.item_category_id IS 'Product type: PLATO, VASO, TAZA, etc.';
COMMENT ON COLUMN ceramic_products.size_cm IS 'Physical size in centimeters';
COMMENT ON COLUMN ceramic_products.capacity_ml IS 'Capacity in milliliters';

-- Create simple view for products with all info
CREATE OR REPLACE VIEW v_products_full AS
SELECT
  p.id,
  p.name,
  p.description,
  p.concepto,
  p.size_cm,
  p.capacity_ml,
  p.size_description,
  p.status,
  ic.name as product_type,
  ec.color_name as enamel_color,
  ec.hex_code as color_hex,
  p.created_at,
  p.updated_at
FROM ceramic_products p
JOIN item_categories ic ON p.item_category_id = ic.id
LEFT JOIN ceramic_enamel_colors ec ON p.enamel_color_id = ec.id
WHERE p.status = 'active'
ORDER BY p.created_at DESC;

COMMENT ON VIEW v_products_full IS 'Complete product information with joined category and color names';
