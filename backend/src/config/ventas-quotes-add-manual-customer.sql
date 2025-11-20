-- ========================================
-- Ventas Quotes - Add Manual Customer Entry Support
-- ========================================

-- Make customer_id optional
ALTER TABLE ventas_quotes
  ALTER COLUMN customer_id DROP NOT NULL;

-- Add manual customer fields
ALTER TABLE ventas_quotes
  ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS customer_company VARCHAR(255),
  ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(100),
  ADD COLUMN IF NOT EXISTS customer_address TEXT;

-- Add constraint to ensure either customer_id or customer_name is provided
ALTER TABLE ventas_quotes
  ADD CONSTRAINT check_customer_info CHECK (
    customer_id IS NOT NULL OR customer_name IS NOT NULL
  );

-- Add indexes for manual customer fields
CREATE INDEX IF NOT EXISTS idx_ventas_quotes_customer_name ON ventas_quotes(customer_name);
CREATE INDEX IF NOT EXISTS idx_ventas_quotes_customer_company ON ventas_quotes(customer_company);

-- Remove currency options - always MXN
UPDATE ventas_quotes SET currency = 'MXN' WHERE currency != 'MXN';

-- Add comment
COMMENT ON COLUMN ventas_quotes.customer_name IS 'Manual customer name (used when customer_id is null)';
COMMENT ON COLUMN ventas_quotes.customer_company IS 'Manual customer company (used when customer_id is null)';
COMMENT ON COLUMN ventas_quotes.customer_email IS 'Manual customer email (used when customer_id is null)';
COMMENT ON COLUMN ventas_quotes.customer_phone IS 'Manual customer phone (used when customer_id is null)';
COMMENT ON COLUMN ventas_quotes.customer_address IS 'Manual customer address (used when customer_id is null)';
