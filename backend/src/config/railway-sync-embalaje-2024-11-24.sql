-- ============================================================================
-- RAILWAY SYNC: Embalaje Inventory System
-- Date: 2024-11-24
-- Purpose: Sync embalaje (packaging) inventory system to Railway production
-- ============================================================================
--
-- This script combines three migrations:
-- 1. add-product-category.sql - Product categorization (CERAMICA/EMBALAJE)
-- 2. add-embalaje-inventory.sql - Embalaje inventory tracking tables
-- 3. ventas-embalaje-allocations.sql - Ventas Mayoreo embalaje allocations
--
-- SAFE TO RUN MULTIPLE TIMES - Uses IF NOT EXISTS and exception handling
-- ============================================================================

-- ============================================================================
-- STEP 1: ADD PRODUCT_CATEGORY COLUMN TO produccion_products
-- ============================================================================

-- Add product_category column with check constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'produccion_products'
        AND column_name = 'product_category'
    ) THEN
        ALTER TABLE produccion_products
        ADD COLUMN product_category VARCHAR(50)
        CHECK (product_category IN ('CERAMICA', 'EMBALAJE'));

        RAISE NOTICE 'Added product_category column to produccion_products';
    ELSE
        RAISE NOTICE 'Column product_category already exists';
    END IF;
END $$;

-- Set default for existing products
UPDATE produccion_products
SET product_category = 'CERAMICA'
WHERE product_category IS NULL;

-- Make column required and set default
DO $$
BEGIN
    ALTER TABLE produccion_products
    ALTER COLUMN product_category SET NOT NULL;

    ALTER TABLE produccion_products
    ALTER COLUMN product_category SET DEFAULT 'CERAMICA';

    RAISE NOTICE 'Set product_category constraints';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Constraints already set on product_category';
END $$;

-- Create index
CREATE INDEX IF NOT EXISTS idx_produccion_products_category
ON produccion_products(product_category);

-- ============================================================================
-- STEP 2: CREATE EMBALAJE INVENTORY TABLES
-- ============================================================================

-- Create embalaje_inventory table
CREATE TABLE IF NOT EXISTS embalaje_inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES produccion_products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    apartados INTEGER NOT NULL DEFAULT 0 CHECK (apartados >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_embalaje_inventory_product
ON embalaje_inventory(product_id);

CREATE INDEX IF NOT EXISTS idx_embalaje_inventory_created_at
ON embalaje_inventory(created_at);

-- Create embalaje_inventory_movements table
CREATE TABLE IF NOT EXISTS embalaje_inventory_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES produccion_products(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('INPUT', 'OUTPUT', 'ADJUSTMENT')),
    quantity INTEGER NOT NULL CHECK (quantity != 0),
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_embalaje_movements_product
ON embalaje_inventory_movements(product_id);

CREATE INDEX IF NOT EXISTS idx_embalaje_movements_type
ON embalaje_inventory_movements(movement_type);

CREATE INDEX IF NOT EXISTS idx_embalaje_movements_created_at
ON embalaje_inventory_movements(created_at);

-- Create embalaje_kit_allocations table
CREATE TABLE IF NOT EXISTS embalaje_kit_allocations (
    id SERIAL PRIMARY KEY,
    kit_id INTEGER NOT NULL REFERENCES ecommerce_kits(id) ON DELETE CASCADE,
    inventory_id INTEGER NOT NULL REFERENCES embalaje_inventory(id) ON DELETE CASCADE,
    quantity_allocated INTEGER NOT NULL CHECK (quantity_allocated > 0),
    allocated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(kit_id, inventory_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_embalaje_kit_allocations_kit
ON embalaje_kit_allocations(kit_id);

CREATE INDEX IF NOT EXISTS idx_embalaje_kit_allocations_inventory
ON embalaje_kit_allocations(inventory_id);

-- Create trigger for updated_at on embalaje_inventory
DROP TRIGGER IF EXISTS update_embalaje_inventory_updated_at ON embalaje_inventory;
CREATE TRIGGER update_embalaje_inventory_updated_at
    BEFORE UPDATE ON embalaje_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to recalculate apartados based on kit allocations
CREATE OR REPLACE FUNCTION recalculate_embalaje_apartados()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate apartados for affected inventory item
    UPDATE embalaje_inventory
    SET apartados = (
        SELECT COALESCE(SUM(quantity_allocated), 0)
        FROM embalaje_kit_allocations
        WHERE inventory_id = COALESCE(NEW.inventory_id, OLD.inventory_id)
    )
    WHERE id = COALESCE(NEW.inventory_id, OLD.inventory_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-recalculate apartados when kit allocations change
DROP TRIGGER IF EXISTS trigger_recalculate_embalaje_apartados ON embalaje_kit_allocations;
CREATE TRIGGER trigger_recalculate_embalaje_apartados
    AFTER INSERT OR UPDATE OR DELETE ON embalaje_kit_allocations
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_embalaje_apartados();

-- ============================================================================
-- STEP 3: CREATE VENTAS EMBALAJE ALLOCATIONS TABLE
-- ============================================================================

-- Create ventas_pedido_embalaje_allocations table
CREATE TABLE IF NOT EXISTS ventas_pedido_embalaje_allocations (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES ventas_pedidos(id) ON DELETE CASCADE,
    pedido_item_id INTEGER NOT NULL REFERENCES ventas_pedido_items(id) ON DELETE CASCADE,
    inventory_id INTEGER NOT NULL REFERENCES embalaje_inventory(id) ON DELETE CASCADE,
    quantity_allocated INTEGER NOT NULL CHECK (quantity_allocated > 0),
    allocated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ventas_embalaje_allocations_pedido
ON ventas_pedido_embalaje_allocations(pedido_id);

CREATE INDEX IF NOT EXISTS idx_ventas_embalaje_allocations_item
ON ventas_pedido_embalaje_allocations(pedido_item_id);

CREATE INDEX IF NOT EXISTS idx_ventas_embalaje_allocations_inventory
ON ventas_pedido_embalaje_allocations(inventory_id);

-- Create updated_at trigger
DROP TRIGGER IF EXISTS trigger_ventas_embalaje_allocations_updated_at ON ventas_pedido_embalaje_allocations;
CREATE TRIGGER trigger_ventas_embalaje_allocations_updated_at
    BEFORE UPDATE ON ventas_pedido_embalaje_allocations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create enhanced function to recalculate apartados from BOTH ventas and ecommerce allocations
CREATE OR REPLACE FUNCTION recalculate_embalaje_ventas_apartados()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate apartados combining both ventas pedido allocations AND ecommerce kit allocations
    UPDATE embalaje_inventory
    SET apartados = (
        SELECT COALESCE(SUM(quantity_allocated), 0)
        FROM (
            -- From ventas pedidos
            SELECT quantity_allocated
            FROM ventas_pedido_embalaje_allocations
            WHERE inventory_id = COALESCE(NEW.inventory_id, OLD.inventory_id)

            UNION ALL

            -- From ecommerce kits
            SELECT quantity_allocated
            FROM embalaje_kit_allocations
            WHERE inventory_id = COALESCE(NEW.inventory_id, OLD.inventory_id)
        ) AS combined_allocations
    )
    WHERE id = COALESCE(NEW.inventory_id, OLD.inventory_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Replace the trigger to use the enhanced function
DROP TRIGGER IF EXISTS trigger_recalculate_embalaje_apartados ON embalaje_kit_allocations;
CREATE TRIGGER trigger_recalculate_embalaje_apartados
    AFTER INSERT OR UPDATE OR DELETE ON embalaje_kit_allocations
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_embalaje_ventas_apartados();

-- Create trigger for ventas allocations
DROP TRIGGER IF EXISTS trigger_recalculate_embalaje_ventas_apartados ON ventas_pedido_embalaje_allocations;
CREATE TRIGGER trigger_recalculate_embalaje_ventas_apartados
    AFTER INSERT OR UPDATE OR DELETE ON ventas_pedido_embalaje_allocations
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_embalaje_ventas_apartados();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify product_category column
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'produccion_products'
        AND column_name = 'product_category'
    ) INTO column_exists;

    IF column_exists THEN
        RAISE NOTICE '✓ product_category column exists in produccion_products';
    ELSE
        RAISE WARNING '✗ product_category column NOT found';
    END IF;
END $$;

-- Verify embalaje tables
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_name IN (
        'embalaje_inventory',
        'embalaje_inventory_movements',
        'embalaje_kit_allocations',
        'ventas_pedido_embalaje_allocations'
    );

    RAISE NOTICE '✓ Created % embalaje tables', table_count;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

SELECT 'Embalaje inventory system migration completed successfully!' AS status;
