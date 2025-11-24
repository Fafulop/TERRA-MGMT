-- Add product category to produccion_products
-- This allows distinguishing between ceramic products and packaging/other items

-- Add category column
ALTER TABLE produccion_products
ADD COLUMN IF NOT EXISTS product_category VARCHAR(50)
CHECK (product_category IN ('CERAMICA', 'EMBALAJE'));

-- Set default category for existing products (all are ceramic)
UPDATE produccion_products
SET product_category = 'CERAMICA'
WHERE product_category IS NULL;

-- Make category required
ALTER TABLE produccion_products
ALTER COLUMN product_category SET NOT NULL;

-- Set default for new products
ALTER TABLE produccion_products
ALTER COLUMN product_category SET DEFAULT 'CERAMICA';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_produccion_products_category ON produccion_products(product_category);

-- Add helpful column comment
COMMENT ON COLUMN produccion_products.product_category IS 'Product category: CERAMICA for ceramic products, EMBALAJE for packaging/other items';
