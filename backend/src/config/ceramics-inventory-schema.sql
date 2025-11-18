-- ============================================================
-- CERAMICS INVENTORY SYSTEM - 3 STAGE PRODUCTION TRACKING
-- ============================================================
-- This system tracks ceramics production through 3 stages:
-- Stage 1: Crudo (Raw) - Product + Size
-- Stage 2: Sancochado (Low heat oven) - Product + Size
-- Stage 3: Esmaltado (High heat oven) - Product + Size + Enamel Color
--
-- Transition logic: When items move between stages, the system:
-- 1. Adds to the destination stage
-- 2. Deducts from the source stage
-- 3. Calculates and records breakage/loss
-- ============================================================

-- ============================================================
-- MASTER DATA TABLES
-- ============================================================

-- Ceramic product types (vasos, platos, tazas, etc.)
CREATE TABLE IF NOT EXISTS ceramic_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, discontinued
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Size variants for each product
CREATE TABLE IF NOT EXISTS ceramic_sizes (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES ceramic_products(id) ON DELETE CASCADE,
    size_name VARCHAR(100) NOT NULL, -- pequeño, mediano, grande, etc.
    size_code VARCHAR(20), -- P, M, G, etc.
    size_order INTEGER DEFAULT 0, -- for sorting (1=smallest, 2=medium, 3=largest)
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, discontinued
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, size_name)
);

-- Enamel colors for stage 3
CREATE TABLE IF NOT EXISTS ceramic_enamel_colors (
    id SERIAL PRIMARY KEY,
    color_name VARCHAR(100) NOT NULL UNIQUE,
    color_code VARCHAR(20), -- BL, AZ, VE, RJ, etc.
    hex_code VARCHAR(7), -- #FFFFFF for UI display
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, discontinued
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- CURRENT INVENTORY TABLES (Current stock per stage)
-- ============================================================

-- Stage 1: Crudo (Raw) inventory
CREATE TABLE IF NOT EXISTS stage_1_inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES ceramic_products(id) ON DELETE CASCADE,
    size_id INTEGER NOT NULL REFERENCES ceramic_sizes(id) ON DELETE CASCADE,
    quantity DECIMAL(12, 2) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(product_id, size_id)
);

-- Stage 2: Sancochado inventory
CREATE TABLE IF NOT EXISTS stage_2_inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES ceramic_products(id) ON DELETE CASCADE,
    size_id INTEGER NOT NULL REFERENCES ceramic_sizes(id) ON DELETE CASCADE,
    quantity DECIMAL(12, 2) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(product_id, size_id)
);

-- Stage 3: Esmaltado inventory (includes enamel color)
CREATE TABLE IF NOT EXISTS stage_3_inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES ceramic_products(id) ON DELETE CASCADE,
    size_id INTEGER NOT NULL REFERENCES ceramic_sizes(id) ON DELETE CASCADE,
    enamel_color_id INTEGER NOT NULL REFERENCES ceramic_enamel_colors(id) ON DELETE CASCADE,
    quantity DECIMAL(12, 2) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(product_id, size_id, enamel_color_id)
);

-- ============================================================
-- TRANSACTION TABLE (Complete audit trail)
-- ============================================================

CREATE TABLE IF NOT EXISTS stage_transactions (
    id SERIAL PRIMARY KEY,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Stage information
    from_stage INTEGER, -- NULL for initial input to stage 1, 1, 2
    to_stage INTEGER NOT NULL, -- 1, 2, 3

    -- Product information
    product_id INTEGER NOT NULL REFERENCES ceramic_products(id) ON DELETE CASCADE,
    size_id INTEGER NOT NULL REFERENCES ceramic_sizes(id) ON DELETE CASCADE,
    enamel_color_id INTEGER REFERENCES ceramic_enamel_colors(id) ON DELETE SET NULL, -- Only for stage 3

    -- Quantities (Option A: User enters both IN and OUT)
    quantity_input DECIMAL(12, 2) NOT NULL, -- What came OUT of the process
    quantity_deducted DECIMAL(12, 2) NOT NULL DEFAULT 0, -- What was consumed from previous stage
    quantity_lost DECIMAL(12, 2) NOT NULL DEFAULT 0, -- Calculated: deducted - input (breakage)
    loss_percentage DECIMAL(5, 2) DEFAULT 0, -- Calculated: (lost / deducted) * 100

    -- Metadata
    notes TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_stages CHECK (
        (from_stage IS NULL AND to_stage = 1) OR -- Initial input
        (from_stage = 1 AND to_stage = 2) OR     -- Stage 1 -> 2
        (from_stage = 2 AND to_stage = 3)        -- Stage 2 -> 3
    ),
    CONSTRAINT valid_quantities CHECK (
        quantity_input >= 0 AND
        quantity_deducted >= 0 AND
        quantity_input <= quantity_deducted
    ),
    CONSTRAINT valid_enamel_color CHECK (
        (to_stage = 3 AND enamel_color_id IS NOT NULL) OR
        (to_stage < 3 AND enamel_color_id IS NULL)
    )
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Master data indexes
CREATE INDEX IF NOT EXISTS idx_ceramic_products_status ON ceramic_products(status);
CREATE INDEX IF NOT EXISTS idx_ceramic_sizes_product_id ON ceramic_sizes(product_id);
CREATE INDEX IF NOT EXISTS idx_ceramic_sizes_status ON ceramic_sizes(status);
CREATE INDEX IF NOT EXISTS idx_ceramic_enamel_colors_status ON ceramic_enamel_colors(status);

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_stage_1_product_size ON stage_1_inventory(product_id, size_id);
CREATE INDEX IF NOT EXISTS idx_stage_2_product_size ON stage_2_inventory(product_id, size_id);
CREATE INDEX IF NOT EXISTS idx_stage_3_product_size_color ON stage_3_inventory(product_id, size_id, enamel_color_id);

-- Transaction indexes
CREATE INDEX IF NOT EXISTS idx_stage_transactions_date ON stage_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_stage_transactions_from_stage ON stage_transactions(from_stage);
CREATE INDEX IF NOT EXISTS idx_stage_transactions_to_stage ON stage_transactions(to_stage);
CREATE INDEX IF NOT EXISTS idx_stage_transactions_product ON stage_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_stage_transactions_created_by ON stage_transactions(created_by);

-- ============================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================

-- Update timestamp triggers for master data
CREATE OR REPLACE FUNCTION update_ceramic_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_ceramic_products_updated_at
    BEFORE UPDATE ON ceramic_products
    FOR EACH ROW
    EXECUTE FUNCTION update_ceramic_timestamp();

CREATE TRIGGER trigger_ceramic_sizes_updated_at
    BEFORE UPDATE ON ceramic_sizes
    FOR EACH ROW
    EXECUTE FUNCTION update_ceramic_timestamp();

CREATE TRIGGER trigger_ceramic_enamel_colors_updated_at
    BEFORE UPDATE ON ceramic_enamel_colors
    FOR EACH ROW
    EXECUTE FUNCTION update_ceramic_timestamp();

-- Auto-calculate loss and percentage on transaction insert
CREATE OR REPLACE FUNCTION calculate_transaction_loss()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate loss and percentage
    NEW.quantity_lost = NEW.quantity_deducted - NEW.quantity_input;

    IF NEW.quantity_deducted > 0 THEN
        NEW.loss_percentage = (NEW.quantity_lost / NEW.quantity_deducted) * 100;
    ELSE
        NEW.loss_percentage = 0;
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_calculate_transaction_loss
    BEFORE INSERT OR UPDATE ON stage_transactions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_transaction_loss();

-- ============================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================

-- Current inventory summary across all stages
CREATE OR REPLACE VIEW v_ceramics_inventory_summary AS
SELECT
    'Stage 1 - Crudo' as stage,
    1 as stage_number,
    p.name as product_name,
    s.size_name,
    NULL as enamel_color,
    i.quantity,
    i.last_updated,
    u.username as updated_by_username
FROM stage_1_inventory i
JOIN ceramic_products p ON i.product_id = p.id
JOIN ceramic_sizes s ON i.size_id = s.id
LEFT JOIN users u ON i.updated_by = u.id
WHERE p.status = 'active' AND s.status = 'active' AND i.quantity > 0

UNION ALL

SELECT
    'Stage 2 - Sancochado' as stage,
    2 as stage_number,
    p.name as product_name,
    s.size_name,
    NULL as enamel_color,
    i.quantity,
    i.last_updated,
    u.username as updated_by_username
FROM stage_2_inventory i
JOIN ceramic_products p ON i.product_id = p.id
JOIN ceramic_sizes s ON i.size_id = s.id
LEFT JOIN users u ON i.updated_by = u.id
WHERE p.status = 'active' AND s.status = 'active' AND i.quantity > 0

UNION ALL

SELECT
    'Stage 3 - Esmaltado' as stage,
    3 as stage_number,
    p.name as product_name,
    s.size_name,
    c.color_name as enamel_color,
    i.quantity,
    i.last_updated,
    u.username as updated_by_username
FROM stage_3_inventory i
JOIN ceramic_products p ON i.product_id = p.id
JOIN ceramic_sizes s ON i.size_id = s.id
JOIN ceramic_enamel_colors c ON i.enamel_color_id = c.id
LEFT JOIN users u ON i.updated_by = u.id
WHERE p.status = 'active' AND s.status = 'active' AND c.status = 'active' AND i.quantity > 0

ORDER BY stage_number, product_name, size_name, enamel_color;

-- Loss analysis view
CREATE OR REPLACE VIEW v_loss_analysis AS
SELECT
    CASE
        WHEN from_stage = 1 AND to_stage = 2 THEN 'Stage 1 → 2 (Sancochado)'
        WHEN from_stage = 2 AND to_stage = 3 THEN 'Stage 2 → 3 (Esmaltado)'
    END as transition,
    p.name as product_name,
    s.size_name,
    COUNT(*) as total_transactions,
    SUM(t.quantity_deducted) as total_input,
    SUM(t.quantity_input) as total_output,
    SUM(t.quantity_lost) as total_lost,
    AVG(t.loss_percentage) as avg_loss_percentage,
    MIN(t.loss_percentage) as min_loss_percentage,
    MAX(t.loss_percentage) as max_loss_percentage
FROM stage_transactions t
JOIN ceramic_products p ON t.product_id = p.id
JOIN ceramic_sizes s ON t.size_id = s.id
WHERE t.from_stage IS NOT NULL
GROUP BY transition, p.name, s.size_name
ORDER BY transition, p.name, s.size_name;

-- ============================================================
-- TABLE COMMENTS
-- ============================================================

COMMENT ON TABLE ceramic_products IS 'Master catalog of ceramic product types (vasos, platos, tazas, etc.)';
COMMENT ON TABLE ceramic_sizes IS 'Size variants for each product (pequeño, mediano, grande)';
COMMENT ON TABLE ceramic_enamel_colors IS 'Available enamel colors for stage 3';
COMMENT ON TABLE stage_1_inventory IS 'Current inventory of raw (crudo) ceramics';
COMMENT ON TABLE stage_2_inventory IS 'Current inventory of sancochado (low heat) ceramics';
COMMENT ON TABLE stage_3_inventory IS 'Current inventory of esmaltado (high heat, finished) ceramics';
COMMENT ON TABLE stage_transactions IS 'Complete audit trail of all stage transitions with automatic loss calculation';

COMMENT ON VIEW v_ceramics_inventory_summary IS 'Complete current inventory across all 3 stages';
COMMENT ON VIEW v_loss_analysis IS 'Loss/breakage analysis per transition and product';
