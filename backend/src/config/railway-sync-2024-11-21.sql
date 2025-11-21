-- ===============================================
-- RAILWAY SYNC: November 21, 2024
-- ===============================================
-- This script syncs local database changes to Railway:
-- 1. Ventas Pedidos (Firm Orders) system
-- 2. Inventory Allocations system
-- 3. Payment Tracking system
-- Safe to run multiple times (idempotent).
-- ===============================================

-- ===============================================
-- PART 1: Ventas Pedidos (Firm Orders)
-- ===============================================

-- Pedidos (Firm Orders) table
CREATE TABLE IF NOT EXISTS ventas_pedidos (
    id SERIAL PRIMARY KEY,
    pedido_number VARCHAR(50) UNIQUE NOT NULL,
    quotation_id INTEGER REFERENCES ventas_quotations(id) ON DELETE SET NULL,
    quotation_number VARCHAR(50),

    -- Customer information (denormalized from quotation)
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_address TEXT,

    -- Order details
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING',
        'CONFIRMED',
        'IN_PRODUCTION',
        'READY',
        'DELIVERED',
        'CANCELLED'
    )),

    -- Financial information
    subtotal DECIMAL(12, 2) DEFAULT 0,
    discount_total DECIMAL(12, 2) DEFAULT 0,
    tax_total DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) DEFAULT 0,

    -- Payment information
    payment_status VARCHAR(50) DEFAULT 'PENDING' CHECK (payment_status IN (
        'PENDING',
        'PARTIAL',
        'PAID'
    )),
    amount_paid DECIMAL(12, 2) DEFAULT 0,
    payment_method VARCHAR(50),

    -- Dates
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    actual_delivery_date DATE,

    -- Additional information
    notes TEXT,
    terms TEXT,

    -- Audit fields
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pedido items table
CREATE TABLE IF NOT EXISTS ventas_pedido_items (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES ventas_pedidos(id) ON DELETE CASCADE,

    -- Product information
    product_id INTEGER REFERENCES produccion_products(id),
    product_name VARCHAR(255) NOT NULL,
    tipo_name VARCHAR(100),
    size_cm DECIMAL(10, 2),
    capacity_ml INTEGER,
    esmalte_color_id INTEGER REFERENCES produccion_esmalte_color(id),
    esmalte_color VARCHAR(100),
    esmalte_hex_code VARCHAR(7),

    -- Pricing
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(12, 2) NOT NULL CHECK (unit_price >= 0),
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    tax_percentage DECIMAL(5, 2) DEFAULT 16,

    -- Calculated totals
    subtotal DECIMAL(12, 2) DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) DEFAULT 0,

    -- Production tracking
    quantity_produced INTEGER DEFAULT 0,
    quantity_delivered INTEGER DEFAULT 0,

    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Generate pedido number function
CREATE OR REPLACE FUNCTION generate_pedido_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    year_part VARCHAR(4);
    month_part VARCHAR(2);
    next_number INTEGER;
BEGIN
    year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
    month_part := TO_CHAR(CURRENT_DATE, 'MM');

    SELECT COALESCE(MAX(CAST(SUBSTRING(pedido_number FROM 12 FOR 6) AS INTEGER)), 0) + 1
    INTO next_number
    FROM ventas_pedidos
    WHERE pedido_number LIKE 'PED-' || year_part || month_part || '%';

    RETURN 'PED-' || year_part || month_part || '-' || LPAD(next_number::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Auto-calculate pedido item totals
CREATE OR REPLACE FUNCTION calculate_pedido_item_totals()
RETURNS TRIGGER AS $$
BEGIN
    NEW.subtotal := NEW.quantity * NEW.unit_price;
    NEW.discount_amount := NEW.subtotal * (NEW.discount_percentage / 100);
    NEW.tax_amount := (NEW.subtotal - NEW.discount_amount) * (NEW.tax_percentage / 100);
    NEW.total := NEW.subtotal - NEW.discount_amount + NEW.tax_amount;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pedido_item_calculate_totals ON ventas_pedido_items;
CREATE TRIGGER pedido_item_calculate_totals
BEFORE INSERT OR UPDATE ON ventas_pedido_items
FOR EACH ROW
EXECUTE FUNCTION calculate_pedido_item_totals();

-- Auto-update pedido totals
CREATE OR REPLACE FUNCTION recalculate_pedido_totals()
RETURNS TRIGGER AS $$
DECLARE
    pedido_id_val INTEGER;
BEGIN
    IF TG_OP = 'DELETE' THEN
        pedido_id_val := OLD.pedido_id;
    ELSE
        pedido_id_val := NEW.pedido_id;
    END IF;

    UPDATE ventas_pedidos
    SET
        subtotal = (SELECT COALESCE(SUM(subtotal), 0) FROM ventas_pedido_items WHERE pedido_id = pedido_id_val),
        discount_total = (SELECT COALESCE(SUM(discount_amount), 0) FROM ventas_pedido_items WHERE pedido_id = pedido_id_val),
        tax_total = (SELECT COALESCE(SUM(tax_amount), 0) FROM ventas_pedido_items WHERE pedido_id = pedido_id_val),
        total = (SELECT COALESCE(SUM(total), 0) FROM ventas_pedido_items WHERE pedido_id = pedido_id_val),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = pedido_id_val;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pedido_items_update_totals ON ventas_pedido_items;
CREATE TRIGGER pedido_items_update_totals
AFTER INSERT OR UPDATE OR DELETE ON ventas_pedido_items
FOR EACH ROW
EXECUTE FUNCTION recalculate_pedido_totals();

-- Pedidos indexes
CREATE INDEX IF NOT EXISTS idx_ventas_pedidos_quotation_id ON ventas_pedidos(quotation_id);
CREATE INDEX IF NOT EXISTS idx_ventas_pedidos_status ON ventas_pedidos(status);
CREATE INDEX IF NOT EXISTS idx_ventas_pedidos_payment_status ON ventas_pedidos(payment_status);
CREATE INDEX IF NOT EXISTS idx_ventas_pedidos_order_date ON ventas_pedidos(order_date);
CREATE INDEX IF NOT EXISTS idx_ventas_pedidos_created_at ON ventas_pedidos(created_at);
CREATE INDEX IF NOT EXISTS idx_ventas_pedido_items_pedido_id ON ventas_pedido_items(pedido_id);

-- ===============================================
-- PART 2: Inventory Allocations
-- ===============================================

-- Add apartados column to produccion_inventory (safely)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'produccion_inventory' AND column_name = 'apartados'
    ) THEN
        ALTER TABLE produccion_inventory ADD COLUMN apartados INTEGER DEFAULT 0 NOT NULL;
    END IF;
END $$;

-- Allocations table
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

-- Allocations indexes
CREATE INDEX IF NOT EXISTS idx_ventas_allocations_pedido ON ventas_pedido_allocations(pedido_id);
CREATE INDEX IF NOT EXISTS idx_ventas_allocations_inventory ON ventas_pedido_allocations(inventory_id);
CREATE INDEX IF NOT EXISTS idx_ventas_allocations_pedido_item ON ventas_pedido_allocations(pedido_item_id);

-- Allocation updated_at trigger
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

-- Recalculate apartados function
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

-- Auto-update apartados trigger function
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

-- ===============================================
-- PART 3: Payment Tracking
-- ===============================================

-- Payment attachments table
CREATE TABLE IF NOT EXISTS ventas_pedido_payments (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES ventas_pedidos(id) ON DELETE CASCADE,
    ledger_entry_id INTEGER NOT NULL REFERENCES ledger_entries_mxn(id) ON DELETE CASCADE,

    -- Prevent duplicate attachments
    UNIQUE(ledger_entry_id),

    -- Audit fields
    attached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attached_by INTEGER REFERENCES users(id),
    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_ventas_pedido_payments_pedido_id ON ventas_pedido_payments(pedido_id);
CREATE INDEX IF NOT EXISTS idx_ventas_pedido_payments_ledger_entry_id ON ventas_pedido_payments(ledger_entry_id);

-- Payments updated_at trigger
CREATE OR REPLACE FUNCTION update_ventas_pedido_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ventas_pedido_payments_updated_at ON ventas_pedido_payments;
CREATE TRIGGER trigger_ventas_pedido_payments_updated_at
    BEFORE UPDATE ON ventas_pedido_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_ventas_pedido_payments_updated_at();

-- Recalculate pedido payment totals
CREATE OR REPLACE FUNCTION recalculate_pedido_payment_totals()
RETURNS TRIGGER AS $$
DECLARE
    pedido_id_val INTEGER;
    total_paid DECIMAL(12, 2);
    pedido_total DECIMAL(12, 2);
BEGIN
    IF TG_OP = 'DELETE' THEN
        pedido_id_val := OLD.pedido_id;
    ELSE
        pedido_id_val := NEW.pedido_id;
    END IF;

    -- Calculate total paid from attached ledger entries
    SELECT COALESCE(SUM(le.amount), 0)
    INTO total_paid
    FROM ventas_pedido_payments vpp
    JOIN ledger_entries_mxn le ON vpp.ledger_entry_id = le.id
    WHERE vpp.pedido_id = pedido_id_val;

    -- Get pedido total
    SELECT total INTO pedido_total
    FROM ventas_pedidos
    WHERE id = pedido_id_val;

    -- Update pedido payment info
    UPDATE ventas_pedidos
    SET
        amount_paid = total_paid,
        payment_status = CASE
            WHEN total_paid <= 0 THEN 'PENDING'
            WHEN total_paid >= pedido_total THEN 'PAID'
            ELSE 'PARTIAL'
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = pedido_id_val;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_recalculate_pedido_payment_totals ON ventas_pedido_payments;
CREATE TRIGGER trigger_recalculate_pedido_payment_totals
    AFTER INSERT OR UPDATE OR DELETE ON ventas_pedido_payments
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_pedido_payment_totals();

-- ===============================================
-- COMMENTS
-- ===============================================
COMMENT ON TABLE ventas_pedidos IS 'Firm orders (Pedidos en Firme) created from quotations';
COMMENT ON TABLE ventas_pedido_items IS 'Line items for firm orders';
COMMENT ON TABLE ventas_pedido_allocations IS 'Inventory allocations for pedido items';
COMMENT ON TABLE ventas_pedido_payments IS 'Links cash flow movements to pedidos for payment tracking';
