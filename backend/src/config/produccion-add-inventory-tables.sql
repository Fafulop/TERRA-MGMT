-- Create produccion inventory tracking tables

-- Table to store current inventory levels
CREATE TABLE IF NOT EXISTS produccion_inventory (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES produccion_products(id) ON DELETE CASCADE,
  stage VARCHAR(50) NOT NULL CHECK (stage IN ('CRUDO', 'SANCOCHADO', 'ESMALTADO')),
  esmalte_color_id INTEGER REFERENCES produccion_esmalte_color(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- Ensure unique inventory record per product/stage/color combination
  UNIQUE(product_id, stage, esmalte_color_id),
  -- Only ESMALTADO stage can have esmalte_color_id
  CONSTRAINT check_inventory_esmalte_color_stage
    CHECK (stage = 'ESMALTADO' OR esmalte_color_id IS NULL)
);

-- Table to store inventory movement history
CREATE TABLE IF NOT EXISTS produccion_inventory_movements (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES produccion_products(id) ON DELETE CASCADE,
  movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('CRUDO_INPUT', 'SANCOCHADO_PROCESS', 'ESMALTADO_PROCESS', 'ADJUSTMENT')),
  from_stage VARCHAR(50) CHECK (from_stage IN ('CRUDO', 'SANCOCHADO', 'ESMALTADO')),
  to_stage VARCHAR(50) CHECK (to_stage IN ('CRUDO', 'SANCOCHADO', 'ESMALTADO')),
  from_color_id INTEGER REFERENCES produccion_esmalte_color(id) ON DELETE SET NULL,
  to_color_id INTEGER REFERENCES produccion_esmalte_color(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  notes TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_produccion_inventory_product ON produccion_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_produccion_inventory_stage ON produccion_inventory(stage);
CREATE INDEX IF NOT EXISTS idx_produccion_inventory_movements_product ON produccion_inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_produccion_inventory_movements_type ON produccion_inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_produccion_inventory_movements_created_at ON produccion_inventory_movements(created_at);

-- Create trigger for updated_at on inventory
DROP TRIGGER IF EXISTS update_produccion_inventory_updated_at ON produccion_inventory;
CREATE TRIGGER update_produccion_inventory_updated_at
    BEFORE UPDATE ON produccion_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE produccion_inventory IS 'Current inventory levels for produccion products by stage and color';
COMMENT ON TABLE produccion_inventory_movements IS 'Historical record of all inventory movements';
COMMENT ON COLUMN produccion_inventory.esmalte_color_id IS 'Color for ESMALTADO stage only, NULL for CRUDO and SANCOCHADO';
COMMENT ON COLUMN produccion_inventory_movements.movement_type IS 'Type of movement: CRUDO_INPUT, SANCOCHADO_PROCESS, ESMALTADO_PROCESS, ADJUSTMENT';
