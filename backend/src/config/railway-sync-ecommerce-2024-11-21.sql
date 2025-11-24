-- ===============================================
-- RAILWAY SYNC - Ecommerce System
-- Date: 2024-11-21
-- ===============================================
-- This consolidates all ecommerce-related migrations:
-- 1. Ecommerce Kits System
-- 2. Ecommerce Pedidos (Orders) System
-- 3. ENTREGADO_Y_PAGADO status for both ecommerce and ventas
-- 4. Payment tracking for ecommerce pedidos
-- 5. VENDIDOS column for inventory tracking
-- ===============================================

-- ===============================================
-- STEP 1: Ecommerce Kits System
-- ===============================================

-- KITS table
CREATE TABLE IF NOT EXISTS ecommerce_kits (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE,

    -- Pricing (own price, not calculated from products)
    price DECIMAL(12, 2) NOT NULL DEFAULT 0,

    -- Stock management
    min_stock INTEGER NOT NULL DEFAULT 0,
    max_stock INTEGER NOT NULL DEFAULT 100,
    current_stock INTEGER NOT NULL DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Audit fields
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- KIT ITEMS table (products that make up a kit)
CREATE TABLE IF NOT EXISTS ecommerce_kit_items (
    id SERIAL PRIMARY KEY,
    kit_id INTEGER NOT NULL REFERENCES ecommerce_kits(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES produccion_products(id) ON DELETE CASCADE,
    esmalte_color_id INTEGER REFERENCES produccion_esmalte_color(id),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),

    -- Ensure unique product+color combination per kit
    UNIQUE(kit_id, product_id, esmalte_color_id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- KIT ALLOCATIONS table (tracks which inventory is reserved for kits)
CREATE TABLE IF NOT EXISTS ecommerce_kit_allocations (
    id SERIAL PRIMARY KEY,
    kit_id INTEGER NOT NULL REFERENCES ecommerce_kits(id) ON DELETE CASCADE,
    inventory_id INTEGER NOT NULL REFERENCES produccion_inventory(id) ON DELETE CASCADE,
    quantity_allocated INTEGER NOT NULL CHECK (quantity_allocated > 0),

    -- Each inventory item can only be allocated once per kit
    UNIQUE(kit_id, inventory_id),

    allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    allocated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ecommerce_kits_is_active ON ecommerce_kits(is_active);
CREATE INDEX IF NOT EXISTS idx_ecommerce_kits_sku ON ecommerce_kits(sku);
CREATE INDEX IF NOT EXISTS idx_ecommerce_kit_items_kit_id ON ecommerce_kit_items(kit_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_kit_items_product_id ON ecommerce_kit_items(product_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_kit_allocations_kit_id ON ecommerce_kit_allocations(kit_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_kit_allocations_inventory_id ON ecommerce_kit_allocations(inventory_id);

-- Trigger to update updated_at on kits
CREATE OR REPLACE FUNCTION update_ecommerce_kits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ecommerce_kits_updated_at ON ecommerce_kits;
CREATE TRIGGER trigger_ecommerce_kits_updated_at
    BEFORE UPDATE ON ecommerce_kits
    FOR EACH ROW
    EXECUTE FUNCTION update_ecommerce_kits_updated_at();

-- Trigger to update updated_at on kit allocations
CREATE OR REPLACE FUNCTION update_ecommerce_kit_allocations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ecommerce_kit_allocations_updated_at ON ecommerce_kit_allocations;
CREATE TRIGGER trigger_ecommerce_kit_allocations_updated_at
    BEFORE UPDATE ON ecommerce_kit_allocations
    FOR EACH ROW
    EXECUTE FUNCTION update_ecommerce_kit_allocations_updated_at();

-- Function to recalculate apartados for an inventory item (including kit allocations)
CREATE OR REPLACE FUNCTION recalculate_inventory_apartados_with_kits(inv_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE produccion_inventory
    SET apartados = (
        -- Pedido allocations
        SELECT COALESCE(SUM(quantity_allocated), 0)
        FROM ventas_pedido_allocations
        WHERE inventory_id = inv_id
    ) + (
        -- Kit allocations
        SELECT COALESCE(SUM(quantity_allocated), 0)
        FROM ecommerce_kit_allocations
        WHERE inventory_id = inv_id
    )
    WHERE id = inv_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update apartados when kit allocation changes
CREATE OR REPLACE FUNCTION update_inventory_apartados_from_kit()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM recalculate_inventory_apartados_with_kits(OLD.inventory_id);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM recalculate_inventory_apartados_with_kits(NEW.inventory_id);
        IF OLD.inventory_id != NEW.inventory_id THEN
            PERFORM recalculate_inventory_apartados_with_kits(OLD.inventory_id);
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        PERFORM recalculate_inventory_apartados_with_kits(NEW.inventory_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_inventory_apartados_from_kit ON ecommerce_kit_allocations;
CREATE TRIGGER trigger_update_inventory_apartados_from_kit
    AFTER INSERT OR UPDATE OR DELETE ON ecommerce_kit_allocations
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_apartados_from_kit();

-- Update the existing pedido allocation trigger to use the new function
CREATE OR REPLACE FUNCTION update_inventory_apartados()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM recalculate_inventory_apartados_with_kits(OLD.inventory_id);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM recalculate_inventory_apartados_with_kits(NEW.inventory_id);
        IF OLD.inventory_id != NEW.inventory_id THEN
            PERFORM recalculate_inventory_apartados_with_kits(OLD.inventory_id);
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        PERFORM recalculate_inventory_apartados_with_kits(NEW.inventory_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- STEP 2: Ecommerce Pedidos (Orders) System
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
        'PENDING',              -- Pedido pendiente
        'CONFIRMED',            -- Pedido confirmado
        'PROCESSING',           -- En proceso / preparando
        'SHIPPED',              -- Enviado
        'DELIVERED',            -- Entregado
        'ENTREGADO_Y_PAGADO',   -- Entregado y Pagado
        'CANCELLED'             -- Cancelado
    )),

    -- Financial
    subtotal DECIMAL(12, 2) DEFAULT 0,
    shipping_cost DECIMAL(12, 2) DEFAULT 0,
    discount DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) DEFAULT 0,

    -- Payment
    payment_status VARCHAR(50) DEFAULT 'PENDING' CHECK (payment_status IN (
        'PENDING',
        'PARTIAL',
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

-- ===============================================
-- STEP 3: Payment Tracking for Ecommerce Pedidos
-- ===============================================

-- Add payment tracking columns to ecommerce_pedidos if not exist
ALTER TABLE ecommerce_pedidos
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(12, 2) DEFAULT 0;

-- Update payment_status check constraint
DO $$
BEGIN
    ALTER TABLE ecommerce_pedidos
    DROP CONSTRAINT IF EXISTS ecommerce_pedidos_payment_status_check;

    ALTER TABLE ecommerce_pedidos
    ADD CONSTRAINT ecommerce_pedidos_payment_status_check
    CHECK (payment_status IN ('PENDING', 'PARTIAL', 'PAID', 'REFUNDED'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Table to link ledger entries to ecommerce pedidos
CREATE TABLE IF NOT EXISTS ecommerce_pedido_payments (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES ecommerce_pedidos(id) ON DELETE CASCADE,
    ledger_entry_id INTEGER NOT NULL REFERENCES ledger_entries_mxn(id) ON DELETE CASCADE,

    -- Prevent duplicate attachments (one ledger entry = one pedido)
    UNIQUE(ledger_entry_id),

    -- Audit fields
    attached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attached_by INTEGER REFERENCES users(id),
    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ecommerce_pedido_payments_pedido_id ON ecommerce_pedido_payments(pedido_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_pedido_payments_ledger_entry_id ON ecommerce_pedido_payments(ledger_entry_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_ecommerce_pedido_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ecommerce_pedido_payments_updated_at ON ecommerce_pedido_payments;
CREATE TRIGGER trigger_ecommerce_pedido_payments_updated_at
    BEFORE UPDATE ON ecommerce_pedido_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_ecommerce_pedido_payments_updated_at();

-- Function to recalculate ecommerce pedido payment totals
CREATE OR REPLACE FUNCTION recalculate_ecommerce_pedido_payment_totals()
RETURNS TRIGGER AS $$
DECLARE
    pedido_id_val INTEGER;
    total_paid DECIMAL(12, 2);
    pedido_total DECIMAL(12, 2);
BEGIN
    -- Get the pedido_id from the operation
    IF TG_OP = 'DELETE' THEN
        pedido_id_val := OLD.pedido_id;
    ELSE
        pedido_id_val := NEW.pedido_id;
    END IF;

    -- Calculate total paid from attached ledger entries
    SELECT COALESCE(SUM(le.amount), 0)
    INTO total_paid
    FROM ecommerce_pedido_payments epp
    JOIN ledger_entries_mxn le ON epp.ledger_entry_id = le.id
    WHERE epp.pedido_id = pedido_id_val;

    -- Get pedido total
    SELECT total INTO pedido_total
    FROM ecommerce_pedidos
    WHERE id = pedido_id_val;

    -- Update pedido payment info
    UPDATE ecommerce_pedidos
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

DROP TRIGGER IF EXISTS trigger_recalculate_ecommerce_pedido_payment_totals ON ecommerce_pedido_payments;
CREATE TRIGGER trigger_recalculate_ecommerce_pedido_payment_totals
    AFTER INSERT OR UPDATE OR DELETE ON ecommerce_pedido_payments
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_ecommerce_pedido_payment_totals();

-- ===============================================
-- STEP 4: Add VENDIDOS column to produccion_inventory
-- ===============================================

-- Add vendidos column
DO $$
BEGIN
    ALTER TABLE produccion_inventory
    ADD COLUMN IF NOT EXISTS vendidos INTEGER DEFAULT 0 NOT NULL;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- Add check constraint to ensure vendidos is never negative
DO $$
BEGIN
    ALTER TABLE produccion_inventory
    ADD CONSTRAINT produccion_inventory_vendidos_non_negative
    CHECK (vendidos >= 0);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ===============================================
-- STEP 5: Update ENTREGADO_Y_PAGADO status for ventas_pedidos
-- ===============================================

-- Drop and recreate the CHECK constraint for ventas_pedidos
DO $$
BEGIN
    ALTER TABLE ventas_pedidos
    DROP CONSTRAINT IF EXISTS ventas_pedidos_status_check;

    ALTER TABLE ventas_pedidos
    ADD CONSTRAINT ventas_pedidos_status_check
    CHECK (status IN (
        'PENDING',              -- Pedido pendiente de confirmación
        'CONFIRMED',            -- Pedido confirmado
        'IN_PRODUCTION',        -- En producción
        'READY',                -- Listo para entrega
        'DELIVERED',            -- Entregado
        'ENTREGADO_Y_PAGADO',   -- Entregado y Pagado
        'CANCELLED'             -- Cancelado
    ));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ===============================================
-- Comments
-- ===============================================

COMMENT ON TABLE ecommerce_kits IS 'Product bundles/kits for ecommerce with own pricing and stock management';
COMMENT ON TABLE ecommerce_kit_items IS 'Products that make up each kit with quantities';
COMMENT ON TABLE ecommerce_kit_allocations IS 'Inventory allocations reserved for kit stock';
COMMENT ON COLUMN ecommerce_kits.min_stock IS 'Minimum stock level - alerts when below';
COMMENT ON COLUMN ecommerce_kits.max_stock IS 'Maximum stock level - limit for kit assembly';
COMMENT ON COLUMN ecommerce_kits.current_stock IS 'Current assembled kit stock';
COMMENT ON COLUMN ecommerce_kit_items.esmalte_color_id IS 'Specific color for this product in the kit (for ESMALTADO stage products)';

COMMENT ON TABLE ecommerce_pedidos IS 'Ecommerce orders that consume kit stock';
COMMENT ON TABLE ecommerce_pedido_items IS 'Kits included in each order';
COMMENT ON COLUMN ecommerce_pedidos.status IS 'Order status: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, ENTREGADO_Y_PAGADO, CANCELLED';
COMMENT ON COLUMN ecommerce_pedido_items.kit_name IS 'Kit name at time of order (denormalized for history)';

COMMENT ON TABLE ecommerce_pedido_payments IS 'Links cash flow movements (VENTAS ECOMMERCE) to ecommerce pedidos for payment tracking';
COMMENT ON COLUMN ecommerce_pedido_payments.ledger_entry_id IS 'Reference to ledger_entries_mxn - each entry can only be attached to one pedido';
COMMENT ON COLUMN ecommerce_pedido_payments.pedido_id IS 'Reference to ecommerce_pedidos - one pedido can have multiple payments';

COMMENT ON COLUMN produccion_inventory.vendidos IS 'Total units sold (from delivered and paid ecommerce orders)';
COMMENT ON COLUMN ventas_pedidos.status IS 'Order status: PENDING, CONFIRMED, IN_PRODUCTION, READY, DELIVERED, ENTREGADO_Y_PAGADO, CANCELLED';
COMMENT ON COLUMN ecommerce_pedidos.status IS 'Order status: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, ENTREGADO_Y_PAGADO, CANCELLED';
