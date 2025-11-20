-- Add terms field to ventas_quotations table

ALTER TABLE ventas_quotations
ADD COLUMN IF NOT EXISTS terms TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN ventas_quotations.terms IS 'Terms and conditions or rules for the quotation - can be customized per quotation';
