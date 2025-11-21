-- ===============================================
-- Ecommerce Pedido Payments - Payment Tracking System
-- ===============================================
-- Links cash flow movements (ledger_entries_mxn) to ecommerce pedidos
-- for tracking payments received for each order
-- Uses area: VENTAS, subarea: VENTAS ECOMMERCE
-- ===============================================

-- Add payment tracking columns to ecommerce_pedidos if not exist
ALTER TABLE ecommerce_pedidos
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(12, 2) DEFAULT 0;

ALTER TABLE ecommerce_pedidos
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'PENDING';

-- Update payment_status check constraint
ALTER TABLE ecommerce_pedidos
DROP CONSTRAINT IF EXISTS ecommerce_pedidos_payment_status_check;

ALTER TABLE ecommerce_pedidos
ADD CONSTRAINT ecommerce_pedidos_payment_status_check
CHECK (payment_status IN ('PENDING', 'PARTIAL', 'PAID', 'REFUNDED'));

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

-- Comments
COMMENT ON TABLE ecommerce_pedido_payments IS 'Links cash flow movements (VENTAS ECOMMERCE) to ecommerce pedidos for payment tracking';
COMMENT ON COLUMN ecommerce_pedido_payments.ledger_entry_id IS 'Reference to ledger_entries_mxn - each entry can only be attached to one pedido';
COMMENT ON COLUMN ecommerce_pedido_payments.pedido_id IS 'Reference to ecommerce_pedidos - one pedido can have multiple payments';
