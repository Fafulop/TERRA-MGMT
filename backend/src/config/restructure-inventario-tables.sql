-- Restructure inventario system: Items Catalog + Inventory Counts
-- This replaces the previous single-table structure

-- Drop old table if exists
DROP TABLE IF EXISTS inventario_items CASCADE;

-- ============================================================
-- TABLE 1: INVENTARIO_ITEMS (Item Catalog/Master Data)
-- Purpose: Defines WHAT items can be tracked (conceptos)
-- ============================================================
CREATE TABLE inventario_items (
    id SERIAL PRIMARY KEY,
    internal_id VARCHAR(255) UNIQUE NOT NULL,

    -- Basic item information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- electronics, furniture, office_supplies, etc.
    unit VARCHAR(50) NOT NULL DEFAULT 'units', -- units, boxes, kg, liters, etc.

    -- Cost tracking (MXN only)
    cost_per_unit DECIMAL(12, 2) DEFAULT 0,

    -- Organization (Areas/Subareas taxonomy)
    area VARCHAR(255),
    subarea VARCHAR(255),

    -- Additional information
    notes TEXT,
    tags TEXT[], -- Array of tags for categorization

    -- Item lifecycle status
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, discontinued, archived

    -- Metadata
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 2: INVENTARIO_COUNTS (Inventory Count Transactions)
-- Purpose: Records WHEN and HOW MUCH of each item exists
-- ============================================================
CREATE TABLE inventario_counts (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES inventario_items(id) ON DELETE CASCADE,

    -- Count information
    count_date DATE NOT NULL, -- When the count was performed
    quantity DECIMAL(12, 2) NOT NULL DEFAULT 0, -- Actual counted quantity

    -- Auto-calculated status based on quantity
    status VARCHAR(50) NOT NULL DEFAULT 'counted', -- counted, verified, adjusted

    -- Count metadata
    counted_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notes TEXT, -- Count-specific notes (e.g., "found damaged items", "partial count")

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 3: COUNT_SESSIONS (Batch Counting Sessions)
-- Purpose: Group multiple counts performed at the same time
-- ============================================================
CREATE TABLE count_sessions (
    id SERIAL PRIMARY KEY,
    session_name VARCHAR(255), -- e.g., "Monthly Inventory - January 2025"
    count_date DATE NOT NULL,

    -- Session metadata
    counted_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notes TEXT,

    -- Session status
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress', -- in_progress, completed, cancelled

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Link counts to sessions (optional - counts can exist without sessions)
ALTER TABLE inventario_counts ADD COLUMN session_id INTEGER REFERENCES count_sessions(id) ON DELETE SET NULL;

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Items table indexes
CREATE INDEX idx_inventario_items_internal_id ON inventario_items(internal_id);
CREATE INDEX idx_inventario_items_name ON inventario_items(name);
CREATE INDEX idx_inventario_items_category ON inventario_items(category);
CREATE INDEX idx_inventario_items_status ON inventario_items(status);
CREATE INDEX idx_inventario_items_area ON inventario_items(area);
CREATE INDEX idx_inventario_items_subarea ON inventario_items(subarea);
CREATE INDEX idx_inventario_items_created_by ON inventario_items(created_by);

-- Counts table indexes
CREATE INDEX idx_inventario_counts_item_id ON inventario_counts(item_id);
CREATE INDEX idx_inventario_counts_count_date ON inventario_counts(count_date);
CREATE INDEX idx_inventario_counts_counted_by ON inventario_counts(counted_by);
CREATE INDEX idx_inventario_counts_session_id ON inventario_counts(session_id);
CREATE INDEX idx_inventario_counts_created_at ON inventario_counts(created_at);

-- Composite index for getting latest count per item
CREATE INDEX idx_inventario_counts_item_date ON inventario_counts(item_id, count_date DESC);

-- Count sessions indexes
CREATE INDEX idx_count_sessions_count_date ON count_sessions(count_date);
CREATE INDEX idx_count_sessions_counted_by ON count_sessions(counted_by);
CREATE INDEX idx_count_sessions_status ON count_sessions(status);

-- ============================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================

-- Items table trigger
CREATE OR REPLACE FUNCTION update_inventario_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_inventario_items_updated_at
    BEFORE UPDATE ON inventario_items
    FOR EACH ROW
    EXECUTE FUNCTION update_inventario_items_updated_at();

-- Counts table trigger
CREATE OR REPLACE FUNCTION update_inventario_counts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_inventario_counts_updated_at
    BEFORE UPDATE ON inventario_counts
    FOR EACH ROW
    EXECUTE FUNCTION update_inventario_counts_updated_at();

-- Count sessions table trigger
CREATE OR REPLACE FUNCTION update_count_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_count_sessions_updated_at
    BEFORE UPDATE ON count_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_count_sessions_updated_at();

-- ============================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================

-- View: Latest count for each active item
CREATE OR REPLACE VIEW v_current_inventory AS
SELECT
    i.id as item_id,
    i.internal_id,
    i.name,
    i.description,
    i.category,
    i.unit,
    i.cost_per_unit,
    i.area,
    i.subarea,
    i.tags,
    i.status as item_status,
    c.id as count_id,
    c.quantity,
    c.count_date,
    c.counted_by,
    c.notes as count_notes,
    u.username as counted_by_username,
    (c.quantity * i.cost_per_unit) as total_value
FROM inventario_items i
LEFT JOIN LATERAL (
    SELECT * FROM inventario_counts
    WHERE item_id = i.id
    ORDER BY count_date DESC, created_at DESC
    LIMIT 1
) c ON true
LEFT JOIN users u ON c.counted_by = u.id
WHERE i.status = 'active';

-- ============================================================
-- TABLE COMMENTS FOR DOCUMENTATION
-- ============================================================

COMMENT ON TABLE inventario_items IS 'Item catalog/master data - defines WHAT items can be tracked';
COMMENT ON COLUMN inventario_items.internal_id IS 'System-generated unique identifier (INV-xxxxx)';
COMMENT ON COLUMN inventario_items.status IS 'Item lifecycle: active, discontinued, archived';
COMMENT ON COLUMN inventario_items.cost_per_unit IS 'Cost per unit in MXN for inventory valuation';

COMMENT ON TABLE inventario_counts IS 'Inventory count transactions - records WHEN and HOW MUCH';
COMMENT ON COLUMN inventario_counts.count_date IS 'Date when the physical count was performed';
COMMENT ON COLUMN inventario_counts.quantity IS 'Actual counted quantity';
COMMENT ON COLUMN inventario_counts.session_id IS 'Optional link to count session for batch counts';

COMMENT ON TABLE count_sessions IS 'Batch counting sessions - group multiple counts performed together';
COMMENT ON COLUMN count_sessions.status IS 'Session status: in_progress, completed, cancelled';

COMMENT ON VIEW v_current_inventory IS 'Current inventory view - shows latest count for each active item';
