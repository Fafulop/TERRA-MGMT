-- ===============================================
-- RAILWAY MIGRATION: Complete Ventas System
-- ===============================================
-- This script creates all ventas (wholesale sales) tables
-- with all fields including recent additions.
-- Safe to run multiple times (idempotent).
-- ===============================================

-- STEP 1: Create base quotations table
-- ===============================================
CREATE TABLE IF NOT EXISTS ventas_quotations (
    id SERIAL PRIMARY KEY,
    quotation_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_address TEXT,
    subtotal DECIMAL(12, 2) DEFAULT 0,
    discount_total DECIMAL(12, 2) DEFAULT 0,
    tax_total DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) DEFAULT 0,
    valid_until DATE,
    notes TEXT,
    terms TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- STEP 2: Create quotation items table with all fields
-- ===============================================
CREATE TABLE IF NOT EXISTS ventas_quotation_items (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER REFERENCES ventas_quotations(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES produccion_products(id),
    product_name VARCHAR(255) NOT NULL,
    tipo_name VARCHAR(100),
    size_cm DECIMAL(10, 2),
    capacity_ml INTEGER,
    esmalte_color_id INTEGER REFERENCES produccion_esmalte_color(id),
    esmalte_color VARCHAR(100),
    esmalte_hex_code VARCHAR(7),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(12, 2) NOT NULL CHECK (unit_price >= 0),
    discount_percentage DECIMAL(5, 2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    tax_percentage DECIMAL(5, 2) DEFAULT 16 CHECK (tax_percentage >= 0 AND tax_percentage <= 100),
    subtotal DECIMAL(12, 2) DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- STEP 3: Add missing columns to existing tables (if they exist)
-- ===============================================
DO $$
BEGIN
    -- Add terms to ventas_quotations if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ventas_quotations' AND column_name = 'terms'
    ) THEN
        ALTER TABLE ventas_quotations ADD COLUMN terms TEXT;
    END IF;

    -- Add size_cm to ventas_quotation_items if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ventas_quotation_items' AND column_name = 'size_cm'
    ) THEN
        ALTER TABLE ventas_quotation_items ADD COLUMN size_cm DECIMAL(10, 2);
    END IF;

    -- Add capacity_ml to ventas_quotation_items if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ventas_quotation_items' AND column_name = 'capacity_ml'
    ) THEN
        ALTER TABLE ventas_quotation_items ADD COLUMN capacity_ml INTEGER;
    END IF;

    -- Add esmalte_color_id to ventas_quotation_items if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ventas_quotation_items' AND column_name = 'esmalte_color_id'
    ) THEN
        ALTER TABLE ventas_quotation_items ADD COLUMN esmalte_color_id INTEGER REFERENCES produccion_esmalte_color(id);
    END IF;

    -- Add esmalte_color to ventas_quotation_items if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ventas_quotation_items' AND column_name = 'esmalte_color'
    ) THEN
        ALTER TABLE ventas_quotation_items ADD COLUMN esmalte_color VARCHAR(100);
    END IF;

    -- Add esmalte_hex_code to ventas_quotation_items if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ventas_quotation_items' AND column_name = 'esmalte_hex_code'
    ) THEN
        ALTER TABLE ventas_quotation_items ADD COLUMN esmalte_hex_code VARCHAR(7);
    END IF;
END $$;

-- STEP 4: Create/Replace Functions
-- ===============================================

-- Generate quotation number function
CREATE OR REPLACE FUNCTION generate_quotation_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    year_part VARCHAR(4);
    month_part VARCHAR(2);
    next_number INTEGER;
BEGIN
    year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
    month_part := TO_CHAR(CURRENT_DATE, 'MM');

    -- COT-YYYYMM-NNNNNN (sequence starts at position 12)
    SELECT COALESCE(MAX(CAST(SUBSTRING(quotation_number FROM 12 FOR 6) AS INTEGER)), 0) + 1
    INTO next_number
    FROM ventas_quotations
    WHERE quotation_number LIKE 'COT-' || year_part || month_part || '%';

    RETURN 'COT-' || year_part || month_part || '-' || LPAD(next_number::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Auto-calculate item totals function
CREATE OR REPLACE FUNCTION calculate_quotation_item_totals()
RETURNS TRIGGER AS $$
BEGIN
    NEW.subtotal := NEW.quantity * NEW.unit_price;
    NEW.discount_amount := NEW.subtotal * (NEW.discount_percentage / 100);
    NEW.tax_amount := (NEW.subtotal - NEW.discount_amount) * (NEW.tax_percentage / 100);
    NEW.total := NEW.subtotal - NEW.discount_amount + NEW.tax_amount;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update quotation totals function
CREATE OR REPLACE FUNCTION recalculate_quotation_totals()
RETURNS TRIGGER AS $$
DECLARE
    quote_id INTEGER;
BEGIN
    IF TG_OP = 'DELETE' THEN
        quote_id := OLD.quotation_id;
    ELSE
        quote_id := NEW.quotation_id;
    END IF;

    UPDATE ventas_quotations
    SET
        subtotal = (SELECT COALESCE(SUM(subtotal), 0) FROM ventas_quotation_items WHERE quotation_id = quote_id),
        discount_total = (SELECT COALESCE(SUM(discount_amount), 0) FROM ventas_quotation_items WHERE quotation_id = quote_id),
        tax_total = (SELECT COALESCE(SUM(tax_amount), 0) FROM ventas_quotation_items WHERE quotation_id = quote_id),
        total = (SELECT COALESCE(SUM(total), 0) FROM ventas_quotation_items WHERE quotation_id = quote_id),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = quote_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- STEP 5: Create Triggers
-- ===============================================

-- Drop triggers if they exist (to avoid duplicates)
DROP TRIGGER IF EXISTS quotation_item_calculate_totals ON ventas_quotation_items;
DROP TRIGGER IF EXISTS quotation_items_update_totals ON ventas_quotation_items;

-- Create triggers
CREATE TRIGGER quotation_item_calculate_totals
BEFORE INSERT OR UPDATE ON ventas_quotation_items
FOR EACH ROW
EXECUTE FUNCTION calculate_quotation_item_totals();

CREATE TRIGGER quotation_items_update_totals
AFTER INSERT OR UPDATE OR DELETE ON ventas_quotation_items
FOR EACH ROW
EXECUTE FUNCTION recalculate_quotation_totals();

-- STEP 6: Create Indexes
-- ===============================================
CREATE INDEX IF NOT EXISTS idx_ventas_quotations_created_at ON ventas_quotations(created_at);
CREATE INDEX IF NOT EXISTS idx_ventas_quotation_items_quotation_id ON ventas_quotation_items(quotation_id);

-- STEP 7: Add Comments
-- ===============================================
COMMENT ON TABLE ventas_quotations IS 'Wholesale sales quotations (Ventas Mayoreo)';
COMMENT ON TABLE ventas_quotation_items IS 'Line items for wholesale sales quotations';
COMMENT ON COLUMN ventas_quotations.terms IS 'Terms and conditions or rules for the quotation - can be customized per quotation';
COMMENT ON COLUMN ventas_quotation_items.size_cm IS 'Product size in centimeters (from produccion_products)';
COMMENT ON COLUMN ventas_quotation_items.capacity_ml IS 'Product capacity in milliliters (from produccion_products)';
COMMENT ON COLUMN ventas_quotation_items.esmalte_color_id IS 'Reference to esmalte color selected for this item';
COMMENT ON COLUMN ventas_quotation_items.esmalte_color IS 'Esmalte color name (denormalized for history)';
COMMENT ON COLUMN ventas_quotation_items.esmalte_hex_code IS 'Esmalte color hex code for visual display';
