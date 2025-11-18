-- Create master data tables for product attributes

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
