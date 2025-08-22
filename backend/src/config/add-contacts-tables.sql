-- Add contacts management tables

-- Drop tables if they exist (for development purposes)
DROP TABLE IF EXISTS contact_attachments CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;

-- Create contacts table
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    internal_id VARCHAR(255) UNIQUE NOT NULL,
    
    -- Basic contact information
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    position VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(100),
    mobile VARCHAR(100),
    
    -- Address information
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    
    -- Business information
    contact_type VARCHAR(50) DEFAULT 'business', -- business, client, supplier, partner, etc.
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, archived
    industry VARCHAR(100),
    website VARCHAR(255),
    
    -- Additional information
    notes TEXT,
    tags TEXT[], -- Array of tags for categorization
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create contact_attachments table
CREATE TABLE contact_attachments (
    id SERIAL PRIMARY KEY,
    contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(100),
    attachment_type VARCHAR(50) DEFAULT 'file', -- 'file' or 'url'
    url_title VARCHAR(255), -- For URL attachments
    uploaded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_internal_id ON contacts(internal_id);
CREATE INDEX idx_contacts_name ON contacts(name);
CREATE INDEX idx_contacts_company ON contacts(company);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_contact_type ON contacts(contact_type);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_created_at ON contacts(created_at);

CREATE INDEX idx_contact_attachments_contact_id ON contact_attachments(contact_id);
CREATE INDEX idx_contact_attachments_uploaded_by ON contact_attachments(uploaded_by);

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_contacts_updated_at();

-- Add comments for documentation
COMMENT ON TABLE contacts IS 'Business contacts and relationships management';
COMMENT ON COLUMN contacts.internal_id IS 'System-generated unique identifier for contacts';
COMMENT ON COLUMN contacts.contact_type IS 'Type of contact: business, client, supplier, partner, etc.';
COMMENT ON COLUMN contacts.status IS 'Contact status: active, inactive, archived';
COMMENT ON COLUMN contacts.tags IS 'Array of tags for categorization and filtering';

COMMENT ON TABLE contact_attachments IS 'File attachments associated with contacts';
COMMENT ON COLUMN contact_attachments.attachment_type IS 'Type of attachment: file or url';