-- Add apartados column to produccion_inventory
-- This will track total units reserved across all pedidos
ALTER TABLE produccion_inventory
ADD COLUMN IF NOT EXISTS apartados INTEGER DEFAULT 0 NOT NULL;

-- Create table to track which pedido has allocated which inventory items
CREATE TABLE IF NOT EXISTS ventas_pedido_allocations (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES ventas_pedidos(id) ON DELETE CASCADE,
    pedido_item_id INTEGER NOT NULL REFERENCES ventas_pedido_items(id) ON DELETE CASCADE,
    inventory_id INTEGER NOT NULL REFERENCES produccion_inventory(id) ON DELETE CASCADE,
    quantity_allocated INTEGER NOT NULL CHECK (quantity_allocated > 0),
    allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    allocated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ventas_allocations_pedido ON ventas_pedido_allocations(pedido_id);
CREATE INDEX IF NOT EXISTS idx_ventas_allocations_inventory ON ventas_pedido_allocations(inventory_id);
CREATE INDEX IF NOT EXISTS idx_ventas_allocations_pedido_item ON ventas_pedido_allocations(pedido_item_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_ventas_allocation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ventas_allocation_updated_at ON ventas_pedido_allocations;
CREATE TRIGGER trigger_ventas_allocation_updated_at
    BEFORE UPDATE ON ventas_pedido_allocations
    FOR EACH ROW
    EXECUTE FUNCTION update_ventas_allocation_updated_at();

-- Function to recalculate apartados for an inventory item
CREATE OR REPLACE FUNCTION recalculate_inventory_apartados(inv_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE produccion_inventory
    SET apartados = (
        SELECT COALESCE(SUM(quantity_allocated), 0)
        FROM ventas_pedido_allocations
        WHERE inventory_id = inv_id
    )
    WHERE id = inv_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update apartados when allocation is created/updated/deleted
CREATE OR REPLACE FUNCTION update_inventory_apartados()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM recalculate_inventory_apartados(OLD.inventory_id);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM recalculate_inventory_apartados(NEW.inventory_id);
        IF OLD.inventory_id != NEW.inventory_id THEN
            PERFORM recalculate_inventory_apartados(OLD.inventory_id);
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        PERFORM recalculate_inventory_apartados(NEW.inventory_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_inventory_apartados ON ventas_pedido_allocations;
CREATE TRIGGER trigger_update_inventory_apartados
    AFTER INSERT OR UPDATE OR DELETE ON ventas_pedido_allocations
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_apartados();
