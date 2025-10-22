-- Add inventario (inventory) management tables

-- Drop tables if they exist (for development purposes)
DROP TABLE IF EXISTS inventario_items CASCADE;

-- Create inventario_items table
CREATE TABLE inventario_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    internal_id VARCHAR(255) UNIQUE NOT NULL,

    -- Basic item information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- electronics, furniture, office_supplies, tools, etc.

    -- Quantity and stock information
    quantity DECIMAL(12, 2) NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL DEFAULT 'units', -- units, boxes, kg, liters, etc.
    min_stock DECIMAL(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'in-stock', -- in-stock, low-stock, out-of-stock

    -- Location
    location VARCHAR(255), -- warehouse name, storage location, etc.

    -- Cost tracking (MXN only)
    cost_per_unit DECIMAL(12, 2) DEFAULT 0,

    -- Organization (Areas/Subareas taxonomy)
    area VARCHAR(255),
    subarea VARCHAR(255),

    -- Additional information
    notes TEXT,
    tags TEXT[], -- Array of tags for categorization

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_inventario_user_id ON inventario_items(user_id);
CREATE INDEX idx_inventario_internal_id ON inventario_items(internal_id);
CREATE INDEX idx_inventario_name ON inventario_items(name);
CREATE INDEX idx_inventario_category ON inventario_items(category);
CREATE INDEX idx_inventario_status ON inventario_items(status);
CREATE INDEX idx_inventario_location ON inventario_items(location);
CREATE INDEX idx_inventario_area ON inventario_items(area);
CREATE INDEX idx_inventario_subarea ON inventario_items(subarea);
CREATE INDEX idx_inventario_created_at ON inventario_items(created_at);

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_inventario_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_inventario_updated_at
    BEFORE UPDATE ON inventario_items
    FOR EACH ROW
    EXECUTE FUNCTION update_inventario_updated_at();

-- Create function to auto-update status based on quantity
CREATE OR REPLACE FUNCTION update_inventario_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quantity = 0 THEN
        NEW.status = 'out-of-stock';
    ELSIF NEW.quantity <= NEW.min_stock THEN
        NEW.status = 'low-stock';
    ELSE
        NEW.status = 'in-stock';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_inventario_status
    BEFORE INSERT OR UPDATE OF quantity, min_stock ON inventario_items
    FOR EACH ROW
    EXECUTE FUNCTION update_inventario_status();

-- Add comments for documentation
COMMENT ON TABLE inventario_items IS 'Inventory management for tracking stock levels and costs';
COMMENT ON COLUMN inventario_items.internal_id IS 'System-generated unique identifier for inventory items';
COMMENT ON COLUMN inventario_items.quantity IS 'Current quantity in stock';
COMMENT ON COLUMN inventario_items.unit IS 'Unit of measurement (units, boxes, kg, liters, etc.)';
COMMENT ON COLUMN inventario_items.min_stock IS 'Minimum stock threshold for low-stock alerts';
COMMENT ON COLUMN inventario_items.status IS 'Stock status: in-stock, low-stock, out-of-stock (auto-calculated)';
COMMENT ON COLUMN inventario_items.cost_per_unit IS 'Cost per unit in MXN for inventory valuation';
COMMENT ON COLUMN inventario_items.area IS 'Organizational area (linked to areas taxonomy)';
COMMENT ON COLUMN inventario_items.subarea IS 'Organizational subarea (linked to subareas taxonomy)';
COMMENT ON COLUMN inventario_items.tags IS 'Array of tags for categorization and filtering';
