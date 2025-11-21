-- ===============================================
-- Ecommerce Kits System
-- ===============================================
-- Kits are bundles of products from produccion_products
-- that can be sold together with their own pricing.
-- Kit stock affects apartados in produccion_inventory.
-- ===============================================

-- KITS table
CREATE TABLE IF NOT EXISTS ecommerce_kits (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE,

    -- Pricing (own price, not calculated from products)
    price DECIMAL(12, 2) NOT NULL DEFAULT 0,

    -- Stock management
    min_stock INTEGER NOT NULL DEFAULT 0,
    max_stock INTEGER NOT NULL DEFAULT 100,
    current_stock INTEGER NOT NULL DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Audit fields
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- KIT ITEMS table (products that make up a kit)
CREATE TABLE IF NOT EXISTS ecommerce_kit_items (
    id SERIAL PRIMARY KEY,
    kit_id INTEGER NOT NULL REFERENCES ecommerce_kits(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES produccion_products(id) ON DELETE CASCADE,
    esmalte_color_id INTEGER REFERENCES produccion_esmalte_color(id),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),

    -- Ensure unique product+color combination per kit
    UNIQUE(kit_id, product_id, esmalte_color_id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- KIT ALLOCATIONS table (tracks which inventory is reserved for kits)
CREATE TABLE IF NOT EXISTS ecommerce_kit_allocations (
    id SERIAL PRIMARY KEY,
    kit_id INTEGER NOT NULL REFERENCES ecommerce_kits(id) ON DELETE CASCADE,
    inventory_id INTEGER NOT NULL REFERENCES produccion_inventory(id) ON DELETE CASCADE,
    quantity_allocated INTEGER NOT NULL CHECK (quantity_allocated > 0),

    -- Each inventory item can only be allocated once per kit
    UNIQUE(kit_id, inventory_id),

    allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    allocated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ecommerce_kits_is_active ON ecommerce_kits(is_active);
CREATE INDEX IF NOT EXISTS idx_ecommerce_kits_sku ON ecommerce_kits(sku);
CREATE INDEX IF NOT EXISTS idx_ecommerce_kit_items_kit_id ON ecommerce_kit_items(kit_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_kit_items_product_id ON ecommerce_kit_items(product_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_kit_allocations_kit_id ON ecommerce_kit_allocations(kit_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_kit_allocations_inventory_id ON ecommerce_kit_allocations(inventory_id);

-- Trigger to update updated_at on kits
CREATE OR REPLACE FUNCTION update_ecommerce_kits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ecommerce_kits_updated_at ON ecommerce_kits;
CREATE TRIGGER trigger_ecommerce_kits_updated_at
    BEFORE UPDATE ON ecommerce_kits
    FOR EACH ROW
    EXECUTE FUNCTION update_ecommerce_kits_updated_at();

-- Trigger to update updated_at on kit allocations
CREATE OR REPLACE FUNCTION update_ecommerce_kit_allocations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ecommerce_kit_allocations_updated_at ON ecommerce_kit_allocations;
CREATE TRIGGER trigger_ecommerce_kit_allocations_updated_at
    BEFORE UPDATE ON ecommerce_kit_allocations
    FOR EACH ROW
    EXECUTE FUNCTION update_ecommerce_kit_allocations_updated_at();

-- Function to recalculate apartados for an inventory item (including kit allocations)
-- This extends the existing recalculate_inventory_apartados function
CREATE OR REPLACE FUNCTION recalculate_inventory_apartados_with_kits(inv_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE produccion_inventory
    SET apartados = (
        -- Pedido allocations
        SELECT COALESCE(SUM(quantity_allocated), 0)
        FROM ventas_pedido_allocations
        WHERE inventory_id = inv_id
    ) + (
        -- Kit allocations
        SELECT COALESCE(SUM(quantity_allocated), 0)
        FROM ecommerce_kit_allocations
        WHERE inventory_id = inv_id
    )
    WHERE id = inv_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update apartados when kit allocation changes
CREATE OR REPLACE FUNCTION update_inventory_apartados_from_kit()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM recalculate_inventory_apartados_with_kits(OLD.inventory_id);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM recalculate_inventory_apartados_with_kits(NEW.inventory_id);
        IF OLD.inventory_id != NEW.inventory_id THEN
            PERFORM recalculate_inventory_apartados_with_kits(OLD.inventory_id);
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        PERFORM recalculate_inventory_apartados_with_kits(NEW.inventory_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_inventory_apartados_from_kit ON ecommerce_kit_allocations;
CREATE TRIGGER trigger_update_inventory_apartados_from_kit
    AFTER INSERT OR UPDATE OR DELETE ON ecommerce_kit_allocations
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_apartados_from_kit();

-- Update the existing pedido allocation trigger to use the new function
CREATE OR REPLACE FUNCTION update_inventory_apartados()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM recalculate_inventory_apartados_with_kits(OLD.inventory_id);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM recalculate_inventory_apartados_with_kits(NEW.inventory_id);
        IF OLD.inventory_id != NEW.inventory_id THEN
            PERFORM recalculate_inventory_apartados_with_kits(OLD.inventory_id);
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        PERFORM recalculate_inventory_apartados_with_kits(NEW.inventory_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE ecommerce_kits IS 'Product bundles/kits for ecommerce with own pricing and stock management';
COMMENT ON TABLE ecommerce_kit_items IS 'Products that make up each kit with quantities';
COMMENT ON TABLE ecommerce_kit_allocations IS 'Inventory allocations reserved for kit stock';
COMMENT ON COLUMN ecommerce_kits.min_stock IS 'Minimum stock level - alerts when below';
COMMENT ON COLUMN ecommerce_kits.max_stock IS 'Maximum stock level - limit for kit assembly';
COMMENT ON COLUMN ecommerce_kits.current_stock IS 'Current assembled kit stock';
COMMENT ON COLUMN ecommerce_kit_items.esmalte_color_id IS 'Specific color for this product in the kit (for ESMALTADO stage products)';
