-- ===============================================
-- Ventas Mayoreo - Pedidos en Firme (Firm Orders)
-- ===============================================
-- Orders created from accepted quotations
-- ===============================================

-- Pedidos (Firm Orders) table
CREATE TABLE IF NOT EXISTS ventas_pedidos (
    id SERIAL PRIMARY KEY,
    pedido_number VARCHAR(50) UNIQUE NOT NULL,
    quotation_id INTEGER REFERENCES ventas_quotations(id) ON DELETE SET NULL,
    quotation_number VARCHAR(50), -- Denormalized for history

    -- Customer information (denormalized from quotation)
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_address TEXT,

    -- Order details
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING',      -- Pedido pendiente de confirmación
        'CONFIRMED',    -- Pedido confirmado
        'IN_PRODUCTION',-- En producción
        'READY',        -- Listo para entrega
        'DELIVERED',    -- Entregado
        'CANCELLED'     -- Cancelado
    )),

    -- Financial information
    subtotal DECIMAL(12, 2) DEFAULT 0,
    discount_total DECIMAL(12, 2) DEFAULT 0,
    tax_total DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) DEFAULT 0,

    -- Payment information
    payment_status VARCHAR(50) DEFAULT 'PENDING' CHECK (payment_status IN (
        'PENDING',      -- Pago pendiente
        'PARTIAL',      -- Pago parcial
        'PAID'          -- Pagado completamente
    )),
    amount_paid DECIMAL(12, 2) DEFAULT 0,
    payment_method VARCHAR(50), -- CASH, TRANSFER, CARD, etc.

    -- Dates
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    actual_delivery_date DATE,

    -- Additional information
    notes TEXT,
    terms TEXT, -- Copied from quotation

    -- Audit fields
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pedido items table
CREATE TABLE IF NOT EXISTS ventas_pedido_items (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES ventas_pedidos(id) ON DELETE CASCADE,

    -- Product information (denormalized from quotation items)
    product_id INTEGER REFERENCES produccion_products(id),
    product_name VARCHAR(255) NOT NULL,
    tipo_name VARCHAR(100),
    size_cm DECIMAL(10, 2),
    capacity_ml INTEGER,
    esmalte_color_id INTEGER REFERENCES produccion_esmalte_color(id),
    esmalte_color VARCHAR(100),
    esmalte_hex_code VARCHAR(7),

    -- Pricing (copied from quotation)
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

    -- PED-YYYYMM-NNNNNN (sequence starts at position 12)
    SELECT COALESCE(MAX(CAST(SUBSTRING(pedido_number FROM 12 FOR 6) AS INTEGER)), 0) + 1
    INTO next_number
    FROM ventas_pedidos
    WHERE pedido_number LIKE 'PED-' || year_part || month_part || '%';

    RETURN 'PED-' || year_part || month_part || '-' || LPAD(next_number::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Auto-calculate pedido item totals (same as quotations)
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ventas_pedidos_quotation_id ON ventas_pedidos(quotation_id);
CREATE INDEX IF NOT EXISTS idx_ventas_pedidos_status ON ventas_pedidos(status);
CREATE INDEX IF NOT EXISTS idx_ventas_pedidos_payment_status ON ventas_pedidos(payment_status);
CREATE INDEX IF NOT EXISTS idx_ventas_pedidos_order_date ON ventas_pedidos(order_date);
CREATE INDEX IF NOT EXISTS idx_ventas_pedidos_created_at ON ventas_pedidos(created_at);
CREATE INDEX IF NOT EXISTS idx_ventas_pedido_items_pedido_id ON ventas_pedido_items(pedido_id);

-- Comments
COMMENT ON TABLE ventas_pedidos IS 'Firm orders (Pedidos en Firme) created from quotations';
COMMENT ON TABLE ventas_pedido_items IS 'Line items for firm orders';
COMMENT ON COLUMN ventas_pedidos.status IS 'Order status: PENDING, CONFIRMED, IN_PRODUCTION, READY, DELIVERED, CANCELLED';
COMMENT ON COLUMN ventas_pedidos.payment_status IS 'Payment status: PENDING, PARTIAL, PAID';
COMMENT ON COLUMN ventas_pedido_items.quantity_produced IS 'Number of units produced';
COMMENT ON COLUMN ventas_pedido_items.quantity_delivered IS 'Number of units delivered';
