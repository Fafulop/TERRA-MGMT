-- Add size_cm and capacity_ml to ventas_quotation_items

ALTER TABLE ventas_quotation_items
ADD COLUMN IF NOT EXISTS size_cm DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS capacity_ml INTEGER;

-- Update existing records with size and capacity from products
UPDATE ventas_quotation_items qi
SET
    size_cm = (
        SELECT s.size_cm
        FROM produccion_products p
        LEFT JOIN produccion_size s ON p.size_id = s.id
        WHERE p.id = qi.product_id
    ),
    capacity_ml = (
        SELECT c.capacity_ml
        FROM produccion_products p
        LEFT JOIN produccion_capacity c ON p.capacity_id = c.id
        WHERE p.id = qi.product_id
    )
WHERE product_id IS NOT NULL;
