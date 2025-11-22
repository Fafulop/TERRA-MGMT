-- ===============================================
-- Add ENTREGADO_Y_PAGADO status to ventas_pedidos
-- ===============================================
-- This migration adds a new status 'ENTREGADO_Y_PAGADO' (Delivered and Paid)
-- to the ventas_pedidos status column
-- ===============================================

-- Drop the existing CHECK constraint
ALTER TABLE ventas_pedidos
DROP CONSTRAINT IF EXISTS ventas_pedidos_status_check;

-- Add the new CHECK constraint with ENTREGADO_Y_PAGADO
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

-- Update comment
COMMENT ON COLUMN ventas_pedidos.status IS 'Order status: PENDING, CONFIRMED, IN_PRODUCTION, READY, DELIVERED, ENTREGADO_Y_PAGADO, CANCELLED';
