-- Add documents management tables

-- Drop tables if they exist (for development purposes)
DROP TABLE IF EXISTS document_attachments CASCADE;
DROP TABLE IF EXISTS documents CASCADE;

-- Create documents table
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    internal_id VARCHAR(255) UNIQUE NOT NULL,
    
    -- Required document information
    document_name VARCHAR(255) NOT NULL,
    area VARCHAR(255) NOT NULL,
    subarea VARCHAR(255) NOT NULL,
    
    -- Optional document information
    description TEXT,
    document_type VARCHAR(100), -- pdf, doc, xlsx, etc.
    version VARCHAR(50) DEFAULT '1.0',
    status VARCHAR(50) DEFAULT 'active', -- active, archived, draft
    tags TEXT[], -- Array of tags for categorization
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create document_attachments table (at least one file is required)
CREATE TABLE document_attachments (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
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
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_internal_id ON documents(internal_id);
CREATE INDEX idx_documents_name ON documents(document_name);
CREATE INDEX idx_documents_area ON documents(area);
CREATE INDEX idx_documents_subarea ON documents(subarea);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_created_at ON documents(created_at);

CREATE INDEX idx_document_attachments_document_id ON document_attachments(document_id);
CREATE INDEX idx_document_attachments_uploaded_by ON document_attachments(uploaded_by);

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_documents_updated_at();

-- Add constraints to ensure required fields are not empty
ALTER TABLE documents 
ADD CONSTRAINT check_document_name_not_empty CHECK (document_name <> ''),
ADD CONSTRAINT check_area_not_empty CHECK (area <> ''),
ADD CONSTRAINT check_subarea_not_empty CHECK (subarea <> '');

-- Add comments for documentation
COMMENT ON TABLE documents IS 'Document management and organization system';
COMMENT ON COLUMN documents.internal_id IS 'System-generated unique identifier for documents';
COMMENT ON COLUMN documents.document_name IS 'Required name/title of the document';
COMMENT ON COLUMN documents.area IS 'Required area classification';
COMMENT ON COLUMN documents.subarea IS 'Required subarea classification';
COMMENT ON COLUMN documents.status IS 'Document status: active, archived, draft';
COMMENT ON COLUMN documents.tags IS 'Array of tags for categorization and filtering';

COMMENT ON TABLE document_attachments IS 'File attachments associated with documents (at least one required)';
COMMENT ON COLUMN document_attachments.attachment_type IS 'Type of attachment: file or url';