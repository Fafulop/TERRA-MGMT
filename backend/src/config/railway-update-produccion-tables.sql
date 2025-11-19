-- ========================================
-- Railway Database Update Script
-- Adds all produccion-related tables and modifications
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ========================================

-- ========================================
-- STEP 1: Create master data tables for product attributes
-- From: add-produccion-tables.sql
-- ========================================

-- Table for Tipo (Type)
CREATE TABLE IF NOT EXISTS produccion_tipo (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for Size in CM
CREATE TABLE IF NOT EXISTS produccion_size (
  id SERIAL PRIMARY KEY,
  size_cm DECIMAL(10, 2) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for Capacity in ML
CREATE TABLE IF NOT EXISTS produccion_capacity (
  id SERIAL PRIMARY KEY,
  capacity_ml INTEGER NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for Esmalte Color (Glaze Color)
CREATE TABLE IF NOT EXISTS produccion_esmalte_color (
  id SERIAL PRIMARY KEY,
  color VARCHAR(100) NOT NULL UNIQUE,
  hex_code VARCHAR(7),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for Products
CREATE TABLE IF NOT EXISTS produccion_products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  tipo_id INTEGER NOT NULL REFERENCES produccion_tipo(id) ON DELETE RESTRICT,
  size_id INTEGER NOT NULL REFERENCES produccion_size(id) ON DELETE RESTRICT,
  capacity_id INTEGER NOT NULL REFERENCES produccion_capacity(id) ON DELETE RESTRICT,
  esmalte_color_id INTEGER NOT NULL REFERENCES produccion_esmalte_color(id) ON DELETE RESTRICT,
  peso_crudo DECIMAL(10, 2), -- Peso en crudo (raw weight in grams)
  costo_mano_obra DECIMAL(10, 2), -- Costo mano de obra (labor cost in MXN)
  cantidad_esmalte DECIMAL(10, 2), -- Cantidad esmalte (glaze amount in grams or ml)
  costo_esmalte DECIMAL(10, 2), -- Costo esmalte (glaze cost in MXN)
  costo_horneado DECIMAL(10, 2), -- Costo horneado (firing/baking cost in MXN)
  notes TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_produccion_products_tipo ON produccion_products(tipo_id);
CREATE INDEX IF NOT EXISTS idx_produccion_products_size ON produccion_products(size_id);
CREATE INDEX IF NOT EXISTS idx_produccion_products_capacity ON produccion_products(capacity_id);
CREATE INDEX IF NOT EXISTS idx_produccion_products_esmalte ON produccion_products(esmalte_color_id);
CREATE INDEX IF NOT EXISTS idx_produccion_products_created_by ON produccion_products(created_by);
CREATE INDEX IF NOT EXISTS idx_produccion_products_name ON produccion_products(name);

-- Create triggers to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_produccion_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_produccion_tipo_updated_at
  BEFORE UPDATE ON produccion_tipo
  FOR EACH ROW
  EXECUTE FUNCTION update_produccion_updated_at();

CREATE TRIGGER trigger_produccion_size_updated_at
  BEFORE UPDATE ON produccion_size
  FOR EACH ROW
  EXECUTE FUNCTION update_produccion_updated_at();

CREATE TRIGGER trigger_produccion_capacity_updated_at
  BEFORE UPDATE ON produccion_capacity
  FOR EACH ROW
  EXECUTE FUNCTION update_produccion_updated_at();

CREATE TRIGGER trigger_produccion_esmalte_color_updated_at
  BEFORE UPDATE ON produccion_esmalte_color
  FOR EACH ROW
  EXECUTE FUNCTION update_produccion_updated_at();

CREATE TRIGGER trigger_produccion_products_updated_at
  BEFORE UPDATE ON produccion_products
  FOR EACH ROW
  EXECUTE FUNCTION update_produccion_updated_at();

-- Add comments
COMMENT ON TABLE produccion_tipo IS 'Product types for production';
COMMENT ON TABLE produccion_size IS 'Product sizes in centimeters';
COMMENT ON TABLE produccion_capacity IS 'Product capacities in milliliters';
COMMENT ON TABLE produccion_esmalte_color IS 'Glaze colors for products';
COMMENT ON TABLE produccion_products IS 'Production products catalog';
COMMENT ON COLUMN produccion_products.peso_crudo IS 'Raw weight in grams';
COMMENT ON COLUMN produccion_products.costo_mano_obra IS 'Labor cost in MXN';
COMMENT ON COLUMN produccion_products.cantidad_esmalte IS 'Glaze amount in grams or ml';
COMMENT ON COLUMN produccion_products.costo_esmalte IS 'Glaze cost in MXN';
COMMENT ON COLUMN produccion_products.costo_horneado IS 'Firing/baking cost in MXN';

-- ========================================
-- STEP 2: Make fields optional
-- From: produccion-make-fields-optional.sql
-- ========================================

-- Make size_id, capacity_id, and esmalte_color_id optional in produccion_products table
DO $$
BEGIN
  BEGIN
    ALTER TABLE produccion_products
      ALTER COLUMN size_id DROP NOT NULL;
  EXCEPTION
    WHEN others THEN NULL;
  END;

  BEGIN
    ALTER TABLE produccion_products
      ALTER COLUMN capacity_id DROP NOT NULL;
  EXCEPTION
    WHEN others THEN NULL;
  END;

  BEGIN
    ALTER TABLE produccion_products
      ALTER COLUMN esmalte_color_id DROP NOT NULL;
  EXCEPTION
    WHEN others THEN NULL;
  END;
END $$;

COMMENT ON COLUMN produccion_products.size_id IS 'Product size (optional)';
COMMENT ON COLUMN produccion_products.capacity_id IS 'Product capacity (optional)';
COMMENT ON COLUMN produccion_products.esmalte_color_id IS 'Glaze color (optional)';

-- ========================================
-- STEP 3: Add stage field
-- From: produccion-add-stage-field.sql
-- ========================================

-- Add stage field to produccion_products table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'produccion_products'
    AND column_name = 'stage'
  ) THEN
    ALTER TABLE produccion_products
      ADD COLUMN stage VARCHAR(50) NOT NULL DEFAULT 'CRUDO' CHECK (stage IN ('CRUDO', 'SANCOCHADO', 'ESMALTADO'));
  END IF;
END $$;

-- Add index for the stage column
CREATE INDEX IF NOT EXISTS idx_produccion_products_stage ON produccion_products(stage);

-- Add comment
COMMENT ON COLUMN produccion_products.stage IS 'Production stage: CRUDO, SANCOCHADO, or ESMALTADO (only ESMALTADO can have esmalte color)';

-- Make esmalte_color_id conditional - only ESMALTADO stage can have esmalte color
DO $$
BEGIN
  BEGIN
    ALTER TABLE produccion_products
      ADD CONSTRAINT check_esmalte_color_stage
      CHECK (stage = 'ESMALTADO' OR esmalte_color_id IS NULL);
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ========================================
-- STEP 4: Add peso and costo fields
-- From: produccion-add-peso-costo-fields.sql
-- ========================================

-- Add peso_esmaltado and costo_pasta fields to produccion_products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'produccion_products'
    AND column_name = 'peso_esmaltado'
  ) THEN
    ALTER TABLE produccion_products
      ADD COLUMN peso_esmaltado DECIMAL(10, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'produccion_products'
    AND column_name = 'costo_pasta'
  ) THEN
    ALTER TABLE produccion_products
      ADD COLUMN costo_pasta DECIMAL(10, 2);
  END IF;
END $$;

COMMENT ON COLUMN produccion_products.peso_esmaltado IS 'Glazed weight in grams (optional)';
COMMENT ON COLUMN produccion_products.costo_pasta IS 'Paste cost in MXN (optional)';

-- ========================================
-- STEP 5: Create inventory tracking tables
-- From: produccion-add-inventory-tables.sql
-- ========================================

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
  UNIQUE(product_id, stage, esmalte_color_id)
);

-- Only add constraint if it doesn't exist
DO $$
BEGIN
  BEGIN
    ALTER TABLE produccion_inventory
      ADD CONSTRAINT check_inventory_esmalte_color_stage
      CHECK (stage = 'ESMALTADO' OR esmalte_color_id IS NULL);
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

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

-- ========================================
-- MIGRATION COMPLETE
-- ========================================
