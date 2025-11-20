-- ========================================
-- Ventas Mayoreo - Sales Quotes Tables
-- Phase 1: Quote Management System
-- ========================================

-- ========================================
-- 1. Sales Quotes Table
-- ========================================
CREATE TABLE IF NOT EXISTS ventas_quotes (
  id SERIAL PRIMARY KEY,
  quote_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,

  -- Quote Details
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  -- Statuses: DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED, CONVERTED_TO_ORDER

  valid_until DATE,
  discount_percentage DECIMAL(5, 2) DEFAULT 0.00,
  discount_amount DECIMAL(10, 2) DEFAULT 0.00,

  -- Calculations (auto-calculated from line items)
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  discount_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  tax_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

  -- Additional Info
  currency VARCHAR(3) DEFAULT 'MXN',
  notes TEXT,
  terms_and_conditions TEXT,
  internal_notes TEXT,

  -- Metadata
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT check_discount_percentage CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  CONSTRAINT check_valid_status CHECK (status IN ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED_TO_ORDER')),
  CONSTRAINT check_valid_currency CHECK (currency IN ('MXN', 'USD'))
);

-- ========================================
-- 2. Quote Line Items Table
-- ========================================
CREATE TABLE IF NOT EXISTS ventas_quote_items (
  id SERIAL PRIMARY KEY,
  quote_id INTEGER NOT NULL REFERENCES ventas_quotes(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES produccion_products(id) ON DELETE RESTRICT,

  -- Line Item Details
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  discount_percentage DECIMAL(5, 2) DEFAULT 0.00 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),

  -- Auto-calculated fields
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  line_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

  -- Product snapshot (stored at time of quote creation)
  product_name VARCHAR(255) NOT NULL,
  product_tipo VARCHAR(100),
  product_size VARCHAR(50),
  product_capacity VARCHAR(50),
  product_color VARCHAR(100),

  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 3. Indexes for Performance
-- ========================================

-- Quotes indexes
CREATE INDEX IF NOT EXISTS idx_ventas_quotes_customer ON ventas_quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_ventas_quotes_status ON ventas_quotes(status);
CREATE INDEX IF NOT EXISTS idx_ventas_quotes_created_by ON ventas_quotes(created_by);
CREATE INDEX IF NOT EXISTS idx_ventas_quotes_quote_number ON ventas_quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_ventas_quotes_created_at ON ventas_quotes(created_at);
CREATE INDEX IF NOT EXISTS idx_ventas_quotes_valid_until ON ventas_quotes(valid_until);

-- Quote items indexes
CREATE INDEX IF NOT EXISTS idx_ventas_quote_items_quote ON ventas_quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_ventas_quote_items_product ON ventas_quote_items(product_id);

-- ========================================
-- 4. Triggers for Auto-updating Timestamps
-- ========================================

CREATE TRIGGER trigger_ventas_quotes_updated_at
  BEFORE UPDATE ON ventas_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_ventas_quote_items_updated_at
  BEFORE UPDATE ON ventas_quote_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 5. Function to Generate Quote Number
-- ========================================

CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS VARCHAR(50) AS $$
DECLARE
  year_str VARCHAR(4);
  next_number INTEGER;
  quote_number VARCHAR(50);
BEGIN
  -- Get current year
  year_str := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;

  -- Get the highest number for this year
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(quote_number FROM '[0-9]+$') AS INTEGER
      )
    ), 0
  ) + 1 INTO next_number
  FROM ventas_quotes
  WHERE quote_number LIKE 'Q-' || year_str || '-%';

  -- Format: Q-2024-0001
  quote_number := 'Q-' || year_str || '-' || LPAD(next_number::VARCHAR, 4, '0');

  RETURN quote_number;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 6. Function to Calculate Quote Totals
-- ========================================

CREATE OR REPLACE FUNCTION calculate_quote_totals(quote_id_param INTEGER)
RETURNS void AS $$
DECLARE
  items_subtotal DECIMAL(10, 2);
  quote_discount_pct DECIMAL(5, 2);
  quote_discount_amt DECIMAL(10, 2);
  final_discount DECIMAL(10, 2);
  tax_rate DECIMAL(5, 4);
  calculated_subtotal DECIMAL(10, 2);
  calculated_discount DECIMAL(10, 2);
  calculated_tax DECIMAL(10, 2);
  calculated_total DECIMAL(10, 2);
BEGIN
  -- Get sum of all line totals
  SELECT COALESCE(SUM(line_total), 0)
  INTO items_subtotal
  FROM ventas_quote_items
  WHERE quote_id = quote_id_param;

  -- Get quote-level discount settings
  SELECT discount_percentage, discount_amount
  INTO quote_discount_pct, quote_discount_amt
  FROM ventas_quotes
  WHERE id = quote_id_param;

  -- Calculate discount
  IF quote_discount_pct > 0 THEN
    final_discount := items_subtotal * (quote_discount_pct / 100);
  ELSIF quote_discount_amt > 0 THEN
    final_discount := quote_discount_amt;
  ELSE
    final_discount := 0;
  END IF;

  -- Tax rate (16% IVA for Mexico)
  tax_rate := 0.16;

  -- Calculate totals
  calculated_subtotal := items_subtotal;
  calculated_discount := final_discount;
  calculated_tax := (items_subtotal - final_discount) * tax_rate;
  calculated_total := items_subtotal - final_discount + calculated_tax;

  -- Update quote with calculated values
  UPDATE ventas_quotes
  SET
    subtotal = calculated_subtotal,
    discount_total = calculated_discount,
    tax_total = calculated_tax,
    total = calculated_total,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = quote_id_param;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. Trigger to Auto-calculate Line Item Totals
-- ========================================

CREATE OR REPLACE FUNCTION calculate_quote_item_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate subtotal
  NEW.subtotal := NEW.quantity * NEW.unit_price;

  -- Calculate discount amount
  NEW.discount_amount := NEW.subtotal * (NEW.discount_percentage / 100);

  -- Calculate line total
  NEW.line_total := NEW.subtotal - NEW.discount_amount;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_quote_item_totals
  BEFORE INSERT OR UPDATE ON ventas_quote_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_quote_item_totals();

-- ========================================
-- 8. Trigger to Recalculate Quote Totals When Items Change
-- ========================================

CREATE OR REPLACE FUNCTION recalculate_quote_totals_on_item_change()
RETURNS TRIGGER AS $$
BEGIN
  -- For INSERT or UPDATE, use NEW.quote_id
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    PERFORM calculate_quote_totals(NEW.quote_id);
  -- For DELETE, use OLD.quote_id
  ELSIF (TG_OP = 'DELETE') THEN
    PERFORM calculate_quote_totals(OLD.quote_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recalculate_quote_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON ventas_quote_items
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_quote_totals_on_item_change();

-- ========================================
-- 9. Comments for Documentation
-- ========================================

COMMENT ON TABLE ventas_quotes IS 'Sales quotes/cotizaciones for wholesale customers';
COMMENT ON COLUMN ventas_quotes.quote_number IS 'Auto-generated unique quote number (Q-YYYY-####)';
COMMENT ON COLUMN ventas_quotes.status IS 'Quote status: DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED, CONVERTED_TO_ORDER';
COMMENT ON COLUMN ventas_quotes.valid_until IS 'Quote expiration date';
COMMENT ON COLUMN ventas_quotes.discount_percentage IS 'Overall quote discount percentage (0-100)';
COMMENT ON COLUMN ventas_quotes.discount_amount IS 'Fixed discount amount in currency';
COMMENT ON COLUMN ventas_quotes.internal_notes IS 'Private notes visible only to staff';

COMMENT ON TABLE ventas_quote_items IS 'Line items for sales quotes';
COMMENT ON COLUMN ventas_quote_items.product_name IS 'Snapshot of product name at time of quote creation';
COMMENT ON COLUMN ventas_quote_items.discount_percentage IS 'Line item specific discount percentage';

COMMENT ON FUNCTION generate_quote_number() IS 'Generates next sequential quote number for current year';
COMMENT ON FUNCTION calculate_quote_totals(INTEGER) IS 'Recalculates all totals for a quote based on line items';
