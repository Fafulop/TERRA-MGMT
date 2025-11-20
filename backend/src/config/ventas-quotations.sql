-- Simple Ventas Mayoreo Quotations

-- Quotations table
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
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quotation items table
CREATE TABLE IF NOT EXISTS ventas_quotation_items (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER REFERENCES ventas_quotations(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES produccion_products(id),
    product_name VARCHAR(255) NOT NULL,
    tipo_name VARCHAR(100),
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

-- Generate quotation number
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

-- Auto-calculate item totals
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

CREATE TRIGGER quotation_item_calculate_totals
BEFORE INSERT OR UPDATE ON ventas_quotation_items
FOR EACH ROW
EXECUTE FUNCTION calculate_quotation_item_totals();

-- Auto-update quotation totals
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

CREATE TRIGGER quotation_items_update_totals
AFTER INSERT OR UPDATE OR DELETE ON ventas_quotation_items
FOR EACH ROW
EXECUTE FUNCTION recalculate_quotation_totals();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ventas_quotations_created_at ON ventas_quotations(created_at);
CREATE INDEX IF NOT EXISTS idx_ventas_quotation_items_quotation_id ON ventas_quotation_items(quotation_id);
