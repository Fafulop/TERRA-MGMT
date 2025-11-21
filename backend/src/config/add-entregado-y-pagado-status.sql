-- ===============================================
-- Add ENTREGADO_Y_PAGADO status to ecommerce_pedidos
-- ===============================================
-- This migration adds a new status 'ENTREGADO_Y_PAGADO' (Delivered and Paid)
-- to the ecommerce_pedidos status column
-- ===============================================

-- Drop the existing CHECK constraint
ALTER TABLE ecommerce_pedidos
DROP CONSTRAINT IF EXISTS ecommerce_pedidos_status_check;

-- Add the new CHECK constraint with ENTREGADO_Y_PAGADO
ALTER TABLE ecommerce_pedidos
ADD CONSTRAINT ecommerce_pedidos_status_check
CHECK (status IN (
    'PENDING',              -- Pedido pendiente
    'CONFIRMED',            -- Pedido confirmado
    'PROCESSING',           -- En proceso / preparando
    'SHIPPED',              -- Enviado
    'DELIVERED',            -- Entregado
    'ENTREGADO_Y_PAGADO',   -- Entregado y Pagado
    'CANCELLED'             -- Cancelado
));

-- Update comment
COMMENT ON COLUMN ecommerce_pedidos.status IS 'Order status: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, ENTREGADO_Y_PAGADO, CANCELLED';
