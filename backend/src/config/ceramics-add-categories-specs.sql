-- ============================================================
-- CERAMICS INVENTORY - ADD ITEM CATEGORIES & SPECIFICATIONS
-- ============================================================

-- ============================================================
-- TABLE: ITEM CATEGORIES (User-editable product types)
-- ============================================================
CREATE TABLE IF NOT EXISTS item_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, discontinued
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_item_categories_status ON item_categories(status);
CREATE INDEX IF NOT EXISTS idx_item_categories_name ON item_categories(name);

-- Create update trigger
CREATE TRIGGER trigger_item_categories_updated_at
    BEFORE UPDATE ON item_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_ceramic_timestamp();

-- Add comments
COMMENT ON TABLE item_categories IS 'User-editable product type categories (PLATO, TASA, VASO, etc.)';
COMMENT ON COLUMN item_categories.name IS 'Category name in uppercase (PLATO, TASA, VASO)';

-- ============================================================
-- SEED DATA: Default Item Categories
-- ============================================================
INSERT INTO item_categories (name, description) VALUES
('PLATO', 'Platos de diferentes tamaños'),
('TASA', 'Tazas para bebidas calientes'),
('VASO', 'Vasos de cerámica'),
('TARRO', 'Tarros y recipientes'),
('JARRA', 'Jarras para líquidos'),
('BOWL', 'Bowls y tazones'),
('PLATÓN', 'Platones grandes para servir'),
('CENICERO', 'Ceniceros decorativos'),
('MACETA', 'Macetas para plantas')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- UPDATE: CERAMIC PRODUCTS TABLE
-- ============================================================

-- Add item_category_id column (initially nullable)
ALTER TABLE ceramic_products
ADD COLUMN IF NOT EXISTS item_category_id INTEGER REFERENCES item_categories(id) ON DELETE RESTRICT;

-- Add concepto column (stages where this product can exist)
ALTER TABLE ceramic_products
ADD COLUMN IF NOT EXISTS concepto TEXT[] DEFAULT ARRAY['CRUDO', 'SANCOCHADO', 'ESMALTADO'];

-- Add physical specifications columns
ALTER TABLE ceramic_products
ADD COLUMN IF NOT EXISTS size_cm DECIMAL(10, 2);

ALTER TABLE ceramic_products
ADD COLUMN IF NOT EXISTS capacity_ml DECIMAL(10, 2);

ALTER TABLE ceramic_products
ADD COLUMN IF NOT EXISTS size_description VARCHAR(255);

-- ============================================================
-- UPDATE EXISTING PRODUCTS WITH DEFAULT VALUES
-- ============================================================

-- Map existing products to categories based on their names
UPDATE ceramic_products
SET item_category_id = (SELECT id FROM item_categories WHERE name = 'VASO' LIMIT 1)
WHERE name ILIKE '%vaso%' AND item_category_id IS NULL;

UPDATE ceramic_products
SET item_category_id = (SELECT id FROM item_categories WHERE name = 'PLATO' LIMIT 1)
WHERE name ILIKE '%plato%' AND item_category_id IS NULL;

UPDATE ceramic_products
SET item_category_id = (SELECT id FROM item_categories WHERE name = 'TASA' LIMIT 1)
WHERE name ILIKE '%taza%' AND item_category_id IS NULL;

UPDATE ceramic_products
SET item_category_id = (SELECT id FROM item_categories WHERE name = 'BOWL' LIMIT 1)
WHERE name ILIKE '%bowl%' AND item_category_id IS NULL;

UPDATE ceramic_products
SET item_category_id = (SELECT id FROM item_categories WHERE name = 'JARRA' LIMIT 1)
WHERE name ILIKE '%jarra%' AND item_category_id IS NULL;

UPDATE ceramic_products
SET item_category_id = (SELECT id FROM item_categories WHERE name = 'PLATÓN' LIMIT 1)
WHERE name ILIKE '%platon%' AND item_category_id IS NULL;

UPDATE ceramic_products
SET item_category_id = (SELECT id FROM item_categories WHERE name = 'TARRO' LIMIT 1)
WHERE name ILIKE '%tazon%' AND item_category_id IS NULL;

-- Set default category for any remaining products
UPDATE ceramic_products
SET item_category_id = (SELECT id FROM item_categories WHERE name = 'VASO' LIMIT 1)
WHERE item_category_id IS NULL;

-- Ensure all products have concepto array set
UPDATE ceramic_products
SET concepto = ARRAY['CRUDO', 'SANCOCHADO', 'ESMALTADO']
WHERE concepto IS NULL OR concepto = '{}';

-- ============================================================
-- MAKE COLUMNS NOT NULL AFTER SETTING DEFAULTS
-- ============================================================

-- Make item_category_id required
ALTER TABLE ceramic_products
ALTER COLUMN item_category_id SET NOT NULL;

-- Make concepto required
ALTER TABLE ceramic_products
ALTER COLUMN concepto SET NOT NULL;

-- ============================================================
-- ADD INDEXES FOR NEW COLUMNS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_ceramic_products_item_category ON ceramic_products(item_category_id);
CREATE INDEX IF NOT EXISTS idx_ceramic_products_concepto ON ceramic_products USING GIN(concepto);

-- ============================================================
-- ADD CONSTRAINTS
-- ============================================================

-- Constraint: concepto must have at least one valid value
ALTER TABLE ceramic_products
ADD CONSTRAINT check_concepto_not_empty
CHECK (concepto IS NOT NULL AND array_length(concepto, 1) > 0);

-- Constraint: concepto values must be valid
ALTER TABLE ceramic_products
ADD CONSTRAINT check_concepto_valid_values
CHECK (concepto <@ ARRAY['CRUDO', 'SANCOCHADO', 'ESMALTADO']::TEXT[]);

-- Constraint: size_cm must be positive if provided
ALTER TABLE ceramic_products
ADD CONSTRAINT check_size_cm_positive
CHECK (size_cm IS NULL OR size_cm > 0);

-- Constraint: capacity_ml must be positive if provided
ALTER TABLE ceramic_products
ADD CONSTRAINT check_capacity_ml_positive
CHECK (capacity_ml IS NULL OR capacity_ml > 0);

-- ============================================================
-- UPDATE VIEW TO INCLUDE NEW FIELDS
-- ============================================================

-- Drop the old view first
DROP VIEW IF EXISTS v_ceramics_inventory_summary;

-- Recreate with new columns
CREATE VIEW v_ceramics_inventory_summary AS
SELECT
    'Stage 1 - Crudo' as stage,
    1 as stage_number,
    p.name as product_name,
    p.item_category_id,
    ic.name as item_category_name,
    p.concepto,
    p.size_cm,
    p.capacity_ml,
    p.size_description,
    s.size_name,
    NULL as enamel_color,
    i.quantity,
    i.last_updated,
    u.username as updated_by_username
FROM stage_1_inventory i
JOIN ceramic_products p ON i.product_id = p.id
JOIN item_categories ic ON p.item_category_id = ic.id
JOIN ceramic_sizes s ON i.size_id = s.id
LEFT JOIN users u ON i.updated_by = u.id
WHERE p.status = 'active' AND s.status = 'active' AND i.quantity > 0 AND 'CRUDO' = ANY(p.concepto)

UNION ALL

SELECT
    'Stage 2 - Sancochado' as stage,
    2 as stage_number,
    p.name as product_name,
    p.item_category_id,
    ic.name as item_category_name,
    p.concepto,
    p.size_cm,
    p.capacity_ml,
    p.size_description,
    s.size_name,
    NULL as enamel_color,
    i.quantity,
    i.last_updated,
    u.username as updated_by_username
FROM stage_2_inventory i
JOIN ceramic_products p ON i.product_id = p.id
JOIN item_categories ic ON p.item_category_id = ic.id
JOIN ceramic_sizes s ON i.size_id = s.id
LEFT JOIN users u ON i.updated_by = u.id
WHERE p.status = 'active' AND s.status = 'active' AND i.quantity > 0 AND 'SANCOCHADO' = ANY(p.concepto)

UNION ALL

SELECT
    'Stage 3 - Esmaltado' as stage,
    3 as stage_number,
    p.name as product_name,
    p.item_category_id,
    ic.name as item_category_name,
    p.concepto,
    p.size_cm,
    p.capacity_ml,
    p.size_description,
    s.size_name,
    c.color_name as enamel_color,
    i.quantity,
    i.last_updated,
    u.username as updated_by_username
FROM stage_3_inventory i
JOIN ceramic_products p ON i.product_id = p.id
JOIN item_categories ic ON p.item_category_id = ic.id
JOIN ceramic_sizes s ON i.size_id = s.id
JOIN ceramic_enamel_colors c ON i.enamel_color_id = c.id
LEFT JOIN users u ON i.updated_by = u.id
WHERE p.status = 'active' AND s.status = 'active' AND c.status = 'active' AND i.quantity > 0 AND 'ESMALTADO' = ANY(p.concepto)

ORDER BY stage_number, product_name, size_name, enamel_color;

-- ============================================================
-- ADD TABLE COMMENTS
-- ============================================================

COMMENT ON COLUMN ceramic_products.item_category_id IS 'Required: Category type (PLATO, TASA, VASO, etc.)';
COMMENT ON COLUMN ceramic_products.concepto IS 'Required array: Stages where this product can exist [CRUDO, SANCOCHADO, ESMALTADO]';
COMMENT ON COLUMN ceramic_products.size_cm IS 'Optional: Physical size in centimeters (diameter, length, etc.)';
COMMENT ON COLUMN ceramic_products.capacity_ml IS 'Optional: Capacity in milliliters (for cups, jars, etc.)';
COMMENT ON COLUMN ceramic_products.size_description IS 'Optional: Human-readable size description';
