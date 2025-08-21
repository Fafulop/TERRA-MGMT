-- Migration: Add ledger tables for cash flow management
-- Description: Create ledger_entries and ledger_attachments tables

-- Create ledger_entries table
CREATE TABLE IF NOT EXISTS ledger_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL, -- Positive for income, negative for expenses
    concept TEXT NOT NULL,
    bank_account VARCHAR(255) NOT NULL,
    internal_id VARCHAR(100) NOT NULL UNIQUE, -- Auto-generated unique ID
    bank_movement_id VARCHAR(255), -- Optional bank reference ID
    entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN ('income', 'expense')),
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create ledger_attachments table
CREATE TABLE IF NOT EXISTS ledger_attachments (
    id SERIAL PRIMARY KEY,
    ledger_entry_id INTEGER NOT NULL REFERENCES ledger_entries(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER, -- Size in bytes
    file_type VARCHAR(100), -- MIME type
    attachment_type VARCHAR(20) NOT NULL DEFAULT 'file' CHECK (attachment_type IN ('file')),
    uploaded_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ledger_entries_user_id ON ledger_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_entry_type ON ledger_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_transaction_date ON ledger_entries(transaction_date);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_internal_id ON ledger_entries(internal_id);
CREATE INDEX IF NOT EXISTS idx_ledger_attachments_ledger_entry_id ON ledger_attachments(ledger_entry_id);

-- Add updated_at trigger for ledger_entries
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_ledger_entries_updated_at ON ledger_entries;
CREATE TRIGGER update_ledger_entries_updated_at 
    BEFORE UPDATE ON ledger_entries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();