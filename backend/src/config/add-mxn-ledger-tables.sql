-- Migration: Add MXN ledger tables for Mexican Peso cash flow management
-- Description: Create ledger_entries_mxn and ledger_attachments_mxn tables

-- Create ledger_entries_mxn table (exact copy of USD ledger but for Mexican Pesos)
CREATE TABLE IF NOT EXISTS ledger_entries_mxn (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL, -- Positive for income, negative for expenses in MXN
    concept TEXT NOT NULL,
    bank_account VARCHAR(255) NOT NULL,
    internal_id VARCHAR(100) NOT NULL UNIQUE, -- Auto-generated unique ID
    bank_movement_id VARCHAR(255), -- Optional bank reference ID
    entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN ('income', 'expense')),
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create ledger_attachments_mxn table (exact copy for MXN ledger)
CREATE TABLE IF NOT EXISTS ledger_attachments_mxn (
    id SERIAL PRIMARY KEY,
    ledger_entry_id INTEGER NOT NULL REFERENCES ledger_entries_mxn(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER, -- Size in bytes
    file_type VARCHAR(100), -- MIME type
    attachment_type VARCHAR(20) NOT NULL DEFAULT 'file' CHECK (attachment_type IN ('file')),
    uploaded_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ledger_entries_mxn_user_id ON ledger_entries_mxn(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_mxn_entry_type ON ledger_entries_mxn(entry_type);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_mxn_transaction_date ON ledger_entries_mxn(transaction_date);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_mxn_internal_id ON ledger_entries_mxn(internal_id);
CREATE INDEX IF NOT EXISTS idx_ledger_attachments_mxn_ledger_entry_id ON ledger_attachments_mxn(ledger_entry_id);

-- Add updated_at trigger for ledger_entries_mxn
DROP TRIGGER IF EXISTS update_ledger_entries_mxn_updated_at ON ledger_entries_mxn;
CREATE TRIGGER update_ledger_entries_mxn_updated_at 
    BEFORE UPDATE ON ledger_entries_mxn 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();