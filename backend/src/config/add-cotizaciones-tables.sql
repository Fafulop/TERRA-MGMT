-- Migration: Add cotizaciones tables for quote/quotation management
-- Description: Create cotizaciones_entries and cotizaciones_attachments tables
-- Key difference: Each entry has a currency field (USD or MXN) instead of separate tables

-- Create cotizaciones_entries table (similar to ledger but with currency field)
CREATE TABLE IF NOT EXISTS cotizaciones_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    internal_id VARCHAR(50) UNIQUE NOT NULL, -- Auto-generated unique identifier
    amount DECIMAL(12, 2) NOT NULL, -- Positive for income, negative for expenses
    currency VARCHAR(3) NOT NULL CHECK (currency IN ('USD', 'MXN')), -- Currency selection per entry
    concept TEXT NOT NULL,
    bank_account VARCHAR(255) NOT NULL,
    entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN ('income', 'expense')),
    transaction_date DATE NOT NULL,
    area VARCHAR(255) NOT NULL, -- Required area field
    subarea VARCHAR(255) NOT NULL, -- Required subarea field
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create cotizaciones_attachments table
CREATE TABLE IF NOT EXISTS cotizaciones_attachments (
    id SERIAL PRIMARY KEY,
    cotizacion_entry_id INTEGER NOT NULL REFERENCES cotizaciones_entries(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(100),
    attachment_type VARCHAR(20) NOT NULL CHECK (attachment_type IN ('file', 'url')),
    url_title VARCHAR(255), -- For URL attachments
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cotizaciones_entries_user_id ON cotizaciones_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_entries_currency ON cotizaciones_entries(currency);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_entries_entry_type ON cotizaciones_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_entries_transaction_date ON cotizaciones_entries(transaction_date);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_entries_internal_id ON cotizaciones_entries(internal_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_entries_area ON cotizaciones_entries(area);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_entries_subarea ON cotizaciones_entries(subarea);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_attachments_cotizacion_entry_id ON cotizaciones_attachments(cotizacion_entry_id);

-- Create trigger for updated_at column
DROP TRIGGER IF EXISTS update_cotizaciones_entries_updated_at ON cotizaciones_entries;
CREATE TRIGGER update_cotizaciones_entries_updated_at
    BEFORE UPDATE ON cotizaciones_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();