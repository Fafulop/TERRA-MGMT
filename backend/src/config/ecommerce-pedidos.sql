-- ===============================================
-- Ecommerce Pedidos (Orders) System
-- ===============================================
-- Orders that consume kit stock.
-- When a pedido is created, it deducts from ecommerce_kits.current_stock
-- WITHOUT touching apartados (already reserved when kit stock was created)
-- ===============================================

-- PEDIDOS table
CREATE TABLE IF NOT EXISTS ecommerce_pedidos (
    id SERIAL PRIMARY KEY,
    pedido_number VARCHAR(50) UNIQUE NOT NULL,

    -- Customer information
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_address TEXT,

    -- Order status
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING',      -- Pedido pendiente
        'CONFIRMED',    -- Pedido confirmado
        'PROCESSING',   -- En proceso / preparando
        'SHIPPED',      -- Enviado
        'DELIVERED',    -- Entregado
        'CANCELLED'     -- Cancelado
    )),

    -- Financial
    subtotal DECIMAL(12, 2) DEFAULT 0,
    shipping_cost DECIMAL(12, 2) DEFAULT 0,
    discount DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) DEFAULT 0,

    -- Payment
    payment_status VARCHAR(50) DEFAULT 'PENDING' CHECK (payment_status IN (
        'PENDING',
        'PAID',
        'REFUNDED'
    )),
    payment_method VARCHAR(50),

    -- Dates
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    shipped_date DATE,
    delivered_date DATE,

    -- Additional info
    notes TEXT,
    tracking_number VARCHAR(255),

    -- Audit
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PEDIDO ITEMS table (kits in the order)
CREATE TABLE IF NOT EXISTS ecommerce_pedido_items (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES ecommerce_pedidos(id) ON DELETE CASCADE,
    kit_id INTEGER NOT NULL REFERENCES ecommerce_kits(id),

    -- Kit info at time of order (denormalized)
    kit_name VARCHAR(255) NOT NULL,
    kit_sku VARCHAR(100),

    -- Quantity and pricing
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(12, 2) NOT NULL,
    subtotal DECIMAL(12, 2) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Generate pedido number function
CREATE OR REPLACE FUNCTION generate_ecommerce_pedido_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    year_part VARCHAR(4);
    month_part VARCHAR(2);
    next_number INTEGER;
BEGIN
    year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
    month_part := TO_CHAR(CURRENT_DATE, 'MM');

    -- ECO-YYYYMM-NNNNNN
    SELECT COALESCE(MAX(CAST(SUBSTRING(pedido_number FROM 12 FOR 6) AS INTEGER)), 0) + 1
    INTO next_number
    FROM ecommerce_pedidos
    WHERE pedido_number LIKE 'ECO-' || year_part || month_part || '%';

    RETURN 'ECO-' || year_part || month_part || '-' || LPAD(next_number::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_ecommerce_pedidos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ecommerce_pedidos_updated_at ON ecommerce_pedidos;
CREATE TRIGGER trigger_ecommerce_pedidos_updated_at
    BEFORE UPDATE ON ecommerce_pedidos
    FOR EACH ROW
    EXECUTE FUNCTION update_ecommerce_pedidos_updated_at();

-- Auto-calculate item subtotal
CREATE OR REPLACE FUNCTION calculate_ecommerce_pedido_item_subtotal()
RETURNS TRIGGER AS $$
BEGIN
    NEW.subtotal := NEW.quantity * NEW.unit_price;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ecommerce_pedido_item_subtotal ON ecommerce_pedido_items;
CREATE TRIGGER trigger_ecommerce_pedido_item_subtotal
    BEFORE INSERT OR UPDATE ON ecommerce_pedido_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_ecommerce_pedido_item_subtotal();

-- Auto-recalculate pedido totals
CREATE OR REPLACE FUNCTION recalculate_ecommerce_pedido_totals()
RETURNS TRIGGER AS $$
DECLARE
    pedido_id_val INTEGER;
BEGIN
    IF TG_OP = 'DELETE' THEN
        pedido_id_val := OLD.pedido_id;
    ELSE
        pedido_id_val := NEW.pedido_id;
    END IF;

    UPDATE ecommerce_pedidos
    SET
        subtotal = (SELECT COALESCE(SUM(subtotal), 0) FROM ecommerce_pedido_items WHERE pedido_id = pedido_id_val),
        total = (SELECT COALESCE(SUM(subtotal), 0) FROM ecommerce_pedido_items WHERE pedido_id = pedido_id_val)
                + COALESCE(shipping_cost, 0) - COALESCE(discount, 0),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = pedido_id_val;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_recalculate_ecommerce_pedido_totals ON ecommerce_pedido_items;
CREATE TRIGGER trigger_recalculate_ecommerce_pedido_totals
    AFTER INSERT OR UPDATE OR DELETE ON ecommerce_pedido_items
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_ecommerce_pedido_totals();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ecommerce_pedidos_status ON ecommerce_pedidos(status);
CREATE INDEX IF NOT EXISTS idx_ecommerce_pedidos_payment_status ON ecommerce_pedidos(payment_status);
CREATE INDEX IF NOT EXISTS idx_ecommerce_pedidos_order_date ON ecommerce_pedidos(order_date);
CREATE INDEX IF NOT EXISTS idx_ecommerce_pedidos_created_at ON ecommerce_pedidos(created_at);
CREATE INDEX IF NOT EXISTS idx_ecommerce_pedido_items_pedido_id ON ecommerce_pedido_items(pedido_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_pedido_items_kit_id ON ecommerce_pedido_items(kit_id);

-- Comments
COMMENT ON TABLE ecommerce_pedidos IS 'Ecommerce orders that consume kit stock';
COMMENT ON TABLE ecommerce_pedido_items IS 'Kits included in each order';
COMMENT ON COLUMN ecommerce_pedidos.status IS 'Order status: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED';
COMMENT ON COLUMN ecommerce_pedido_items.kit_name IS 'Kit name at time of order (denormalized for history)';
