-- Create allocation system for embalaje products in Ventas Mayoreo
-- This mirrors the ceramic allocation system but for packaging/other products

-- Allocations table linking pedidos to embalaje inventory
CREATE TABLE IF NOT EXISTS ventas_pedido_embalaje_allocations (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES ventas_pedidos(id) ON DELETE CASCADE,
  pedido_item_id INTEGER NOT NULL REFERENCES ventas_pedido_items(id) ON DELETE CASCADE,
  inventory_id INTEGER NOT NULL REFERENCES embalaje_inventory(id) ON DELETE CASCADE,
  quantity_allocated INTEGER NOT NULL CHECK (quantity_allocated > 0),
  allocated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  allocated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ventas_embalaje_allocations_pedido ON ventas_pedido_embalaje_allocations(pedido_id);
CREATE INDEX IF NOT EXISTS idx_ventas_embalaje_allocations_item ON ventas_pedido_embalaje_allocations(pedido_item_id);
CREATE INDEX IF NOT EXISTS idx_ventas_embalaje_allocations_inventory ON ventas_pedido_embalaje_allocations(inventory_id);

-- Trigger function to auto-update apartados in embalaje_inventory when allocations change
CREATE OR REPLACE FUNCTION recalculate_embalaje_ventas_apartados()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the affected inventory_id (works for INSERT, UPDATE, DELETE)
  DECLARE
    inv_id INTEGER;
  BEGIN
    IF TG_OP = 'DELETE' THEN
      inv_id := OLD.inventory_id;
    ELSE
      inv_id := NEW.inventory_id;
    END IF;

    -- Recalculate total apartados for this inventory item
    -- Sum allocations from both ventas_pedido_embalaje_allocations AND embalaje_kit_allocations
    UPDATE embalaje_inventory
    SET apartados = (
      SELECT COALESCE(SUM(quantity_allocated), 0)
      FROM (
        -- Allocations from ventas pedidos
        SELECT quantity_allocated
        FROM ventas_pedido_embalaje_allocations
        WHERE inventory_id = inv_id

        UNION ALL

        -- Allocations from ecommerce kits
        SELECT quantity_allocated
        FROM embalaje_kit_allocations
        WHERE inventory_id = inv_id
      ) AS combined_allocations
    )
    WHERE id = inv_id;

    RETURN COALESCE(NEW, OLD);
  END;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update apartados when allocations change
DROP TRIGGER IF EXISTS trigger_recalculate_embalaje_ventas_apartados ON ventas_pedido_embalaje_allocations;
CREATE TRIGGER trigger_recalculate_embalaje_ventas_apartados
  AFTER INSERT OR UPDATE OR DELETE ON ventas_pedido_embalaje_allocations
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_embalaje_ventas_apartados();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ventas_embalaje_allocations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ventas_embalaje_allocations_updated_at ON ventas_pedido_embalaje_allocations;
CREATE TRIGGER trigger_ventas_embalaje_allocations_updated_at
  BEFORE UPDATE ON ventas_pedido_embalaje_allocations
  FOR EACH ROW
  EXECUTE FUNCTION update_ventas_embalaje_allocations_updated_at();

-- Add helpful comments
COMMENT ON TABLE ventas_pedido_embalaje_allocations IS 'Tracks allocation (apartado) of embalaje products to ventas mayoreo pedidos';
COMMENT ON COLUMN ventas_pedido_embalaje_allocations.quantity_allocated IS 'Units reserved from embalaje_inventory for this pedido item';
COMMENT ON FUNCTION recalculate_embalaje_ventas_apartados() IS 'Auto-updates apartados in embalaje_inventory by summing allocations from both ventas and ecommerce kits';
