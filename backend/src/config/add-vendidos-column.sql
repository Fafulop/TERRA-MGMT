-- ===============================================
-- Add VENDIDOS column to produccion_inventory
-- ===============================================
-- This column tracks sold products (from ecommerce pedidos with ENTREGADO_Y_PAGADO status)
-- ===============================================

-- Add vendidos column
ALTER TABLE produccion_inventory
ADD COLUMN IF NOT EXISTS vendidos INTEGER DEFAULT 0 NOT NULL;

-- Add check constraint to ensure vendidos is never negative
ALTER TABLE produccion_inventory
ADD CONSTRAINT produccion_inventory_vendidos_non_negative
CHECK (vendidos >= 0);

-- Update comment
COMMENT ON COLUMN produccion_inventory.vendidos IS 'Total units sold (from delivered and paid ecommerce orders)';
