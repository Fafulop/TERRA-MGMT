-- Create embalaje (packaging) inventory system
-- Simple inventory tracking for packaging and other non-ceramic products

-- Main inventory table for embalaje products
CREATE TABLE IF NOT EXISTS embalaje_inventory (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES produccion_products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  apartados INTEGER NOT NULL DEFAULT 0,  -- Reserved for kits
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Ensure one inventory record per product
  UNIQUE(product_id),

  -- Ensure valid quantities
  CHECK (quantity >= 0),
  CHECK (apartados >= 0),
  CHECK (apartados <= quantity)
);

-- Inventory movements/transactions log
CREATE TABLE IF NOT EXISTS embalaje_inventory_movements (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES produccion_products(id) ON DELETE CASCADE,
  movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('INPUT', 'OUTPUT', 'ADJUSTMENT')),
  quantity INTEGER NOT NULL,  -- Positive for INPUT, negative for OUTPUT
  notes TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Allocations for ecommerce kits (linking embalaje to kits)
CREATE TABLE IF NOT EXISTS embalaje_kit_allocations (
  id SERIAL PRIMARY KEY,
  kit_id INTEGER NOT NULL REFERENCES ecommerce_kits(id) ON DELETE CASCADE,
  inventory_id INTEGER NOT NULL REFERENCES embalaje_inventory(id) ON DELETE CASCADE,
  quantity_allocated INTEGER NOT NULL CHECK (quantity_allocated >= 1),
  allocated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  allocated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Prevent duplicate allocations
  UNIQUE(kit_id, inventory_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_embalaje_inventory_product_id ON embalaje_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_embalaje_movements_product_id ON embalaje_inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_embalaje_movements_type ON embalaje_inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_embalaje_movements_created_by ON embalaje_inventory_movements(created_by);
CREATE INDEX IF NOT EXISTS idx_embalaje_kit_allocations_kit_id ON embalaje_kit_allocations(kit_id);
CREATE INDEX IF NOT EXISTS idx_embalaje_kit_allocations_inventory_id ON embalaje_kit_allocations(inventory_id);

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_embalaje_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to embalaje_inventory
DROP TRIGGER IF EXISTS trigger_embalaje_inventory_updated_at ON embalaje_inventory;
CREATE TRIGGER trigger_embalaje_inventory_updated_at
  BEFORE UPDATE ON embalaje_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_embalaje_inventory_updated_at();

-- Apply trigger to embalaje_kit_allocations
DROP TRIGGER IF EXISTS trigger_embalaje_kit_allocations_updated_at ON embalaje_kit_allocations;
CREATE TRIGGER trigger_embalaje_kit_allocations_updated_at
  BEFORE UPDATE ON embalaje_kit_allocations
  FOR EACH ROW
  EXECUTE FUNCTION update_embalaje_inventory_updated_at();

-- Function to recalculate apartados when allocations change
CREATE OR REPLACE FUNCTION recalculate_embalaje_apartados()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate apartados for the affected inventory record
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

-- Trigger to auto-update apartados when allocations change
DROP TRIGGER IF EXISTS trigger_recalculate_embalaje_apartados ON embalaje_kit_allocations;
CREATE TRIGGER trigger_recalculate_embalaje_apartados
  AFTER INSERT OR UPDATE OR DELETE ON embalaje_kit_allocations
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_embalaje_apartados();

-- Add helpful comments
COMMENT ON TABLE embalaje_inventory IS 'Inventory tracking for packaging and other non-ceramic products';
COMMENT ON TABLE embalaje_inventory_movements IS 'Transaction log for embalaje inventory changes';
COMMENT ON TABLE embalaje_kit_allocations IS 'Links embalaje products to ecommerce kits';
COMMENT ON COLUMN embalaje_inventory.apartados IS 'Units reserved for ecommerce kits (auto-calculated)';
COMMENT ON COLUMN embalaje_inventory_movements.quantity IS 'Quantity change: positive for INPUT, negative for OUTPUT';
