-- Add esmalte color fields to ventas_quotation_items

ALTER TABLE ventas_quotation_items
ADD COLUMN IF NOT EXISTS esmalte_color_id INTEGER REFERENCES produccion_esmalte_color(id),
ADD COLUMN IF NOT EXISTS esmalte_color VARCHAR(100),
ADD COLUMN IF NOT EXISTS esmalte_hex_code VARCHAR(7);

-- Update existing records with esmalte color from products (if they have one)
UPDATE ventas_quotation_items qi
SET
    esmalte_color_id = (
        SELECT p.esmalte_color_id
        FROM produccion_products p
        WHERE p.id = qi.product_id
    ),
    esmalte_color = (
        SELECT ec.color
        FROM produccion_products p
        LEFT JOIN produccion_esmalte_color ec ON p.esmalte_color_id = ec.id
        WHERE p.id = qi.product_id
    ),
    esmalte_hex_code = (
        SELECT ec.hex_code
        FROM produccion_products p
        LEFT JOIN produccion_esmalte_color ec ON p.esmalte_color_id = ec.id
        WHERE p.id = qi.product_id
    )
WHERE product_id IS NOT NULL;
