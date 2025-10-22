-- Migration: Add ledger facturas table for Mexican fiscal invoices
-- Description: Create ledger_facturas_mxn table to store SAT facturas separately from general attachments

-- Create ledger_facturas_mxn table for fiscal invoices
CREATE TABLE IF NOT EXISTS ledger_facturas_mxn (
    id SERIAL PRIMARY KEY,
    ledger_entry_id INTEGER NOT NULL REFERENCES ledger_entries_mxn(id) ON DELETE CASCADE,

    -- File information
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER, -- Size in bytes
    file_type VARCHAR(100), -- Should be 'application/pdf' or 'text/xml'

    -- Factura fiscal metadata (optional for future enhancements)
    folio VARCHAR(100), -- Invoice number
    uuid VARCHAR(255), -- Fiscal UUID (SAT Mexico) - unique identifier
    rfc_emisor VARCHAR(20), -- RFC of issuer (emisor)
    rfc_receptor VARCHAR(20), -- RFC of receptor (cliente)
    total DECIMAL(12, 2), -- Invoice total amount
    subtotal DECIMAL(12, 2), -- Subtotal before taxes
    iva DECIMAL(12, 2), -- IVA (Value Added Tax - 16% typically)
    fecha_timbrado TIMESTAMP, -- Certification date from SAT

    -- Metadata
    uploaded_by INTEGER NOT NULL REFERENCES users(id),
    notes TEXT, -- Additional notes about this factura
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ledger_facturas_mxn_ledger_entry_id ON ledger_facturas_mxn(ledger_entry_id);
CREATE INDEX IF NOT EXISTS idx_ledger_facturas_mxn_uuid ON ledger_facturas_mxn(uuid);
CREATE INDEX IF NOT EXISTS idx_ledger_facturas_mxn_folio ON ledger_facturas_mxn(folio);
CREATE INDEX IF NOT EXISTS idx_ledger_facturas_mxn_rfc_emisor ON ledger_facturas_mxn(rfc_emisor);
CREATE INDEX IF NOT EXISTS idx_ledger_facturas_mxn_uploaded_by ON ledger_facturas_mxn(uploaded_by);

-- Add updated_at trigger for ledger_facturas_mxn
DROP TRIGGER IF EXISTS update_ledger_facturas_mxn_updated_at ON ledger_facturas_mxn;
CREATE TRIGGER update_ledger_facturas_mxn_updated_at
    BEFORE UPDATE ON ledger_facturas_mxn
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
