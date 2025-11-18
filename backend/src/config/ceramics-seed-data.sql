-- ============================================================
-- CERAMICS INVENTORY - INITIAL SEED DATA
-- ============================================================

-- ============================================================
-- CERAMIC PRODUCTS
-- ============================================================

INSERT INTO ceramic_products (name, description, status) VALUES
('Vasos', 'Vasos de cerámica', 'active'),
('Platos', 'Platos de cerámica', 'active'),
('Tazas', 'Tazas de cerámica', 'active'),
('Bowls', 'Bowls de cerámica', 'active'),
('Jarras', 'Jarras de cerámica', 'active'),
('Platones', 'Platones grandes de cerámica', 'active'),
('Tazones', 'Tazones de cerámica', 'active')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- CERAMIC SIZES (for each product)
-- ============================================================

-- Vasos sizes
INSERT INTO ceramic_sizes (product_id, size_name, size_code, size_order, status)
SELECT id, 'Pequeño', 'P', 1, 'active' FROM ceramic_products WHERE name = 'Vasos'
ON CONFLICT (product_id, size_name) DO NOTHING;

INSERT INTO ceramic_sizes (product_id, size_name, size_code, size_order, status)
SELECT id, 'Mediano', 'M', 2, 'active' FROM ceramic_products WHERE name = 'Vasos'
ON CONFLICT (product_id, size_name) DO NOTHING;

INSERT INTO ceramic_sizes (product_id, size_name, size_code, size_order, status)
SELECT id, 'Grande', 'G', 3, 'active' FROM ceramic_products WHERE name = 'Vasos'
ON CONFLICT (product_id, size_name) DO NOTHING;

-- Platos sizes
INSERT INTO ceramic_sizes (product_id, size_name, size_code, size_order, status)
SELECT id, 'Pequeño', 'P', 1, 'active' FROM ceramic_products WHERE name = 'Platos'
ON CONFLICT (product_id, size_name) DO NOTHING;

INSERT INTO ceramic_sizes (product_id, size_name, size_code, size_order, status)
SELECT id, 'Mediano', 'M', 2, 'active' FROM ceramic_products WHERE name = 'Platos'
ON CONFLICT (product_id, size_name) DO NOTHING;

INSERT INTO ceramic_sizes (product_id, size_name, size_code, size_order, status)
SELECT id, 'Grande', 'G', 3, 'active' FROM ceramic_products WHERE name = 'Platos'
ON CONFLICT (product_id, size_name) DO NOTHING;

-- Tazas sizes
INSERT INTO ceramic_sizes (product_id, size_name, size_code, size_order, status)
SELECT id, 'Pequeño (6 oz)', 'P', 1, 'active' FROM ceramic_products WHERE name = 'Tazas'
ON CONFLICT (product_id, size_name) DO NOTHING;

INSERT INTO ceramic_sizes (product_id, size_name, size_code, size_order, status)
SELECT id, 'Mediano (10 oz)', 'M', 2, 'active' FROM ceramic_products WHERE name = 'Tazas'
ON CONFLICT (product_id, size_name) DO NOTHING;

INSERT INTO ceramic_sizes (product_id, size_name, size_code, size_order, status)
SELECT id, 'Grande (14 oz)', 'G', 3, 'active' FROM ceramic_products WHERE name = 'Tazas'
ON CONFLICT (product_id, size_name) DO NOTHING;

-- Bowls sizes
INSERT INTO ceramic_sizes (product_id, size_name, size_code, size_order, status)
SELECT id, 'Pequeño', 'P', 1, 'active' FROM ceramic_products WHERE name = 'Bowls'
ON CONFLICT (product_id, size_name) DO NOTHING;

INSERT INTO ceramic_sizes (product_id, size_name, size_code, size_order, status)
SELECT id, 'Mediano', 'M', 2, 'active' FROM ceramic_products WHERE name = 'Bowls'
ON CONFLICT (product_id, size_name) DO NOTHING;

INSERT INTO ceramic_sizes (product_id, size_name, size_code, size_order, status)
SELECT id, 'Grande', 'G', 3, 'active' FROM ceramic_products WHERE name = 'Bowls'
ON CONFLICT (product_id, size_name) DO NOTHING;

-- Jarras sizes
INSERT INTO ceramic_sizes (product_id, size_name, size_code, size_order, status)
SELECT id, 'Mediano (1L)', 'M', 2, 'active' FROM ceramic_products WHERE name = 'Jarras'
ON CONFLICT (product_id, size_name) DO NOTHING;

INSERT INTO ceramic_sizes (product_id, size_name, size_code, size_order, status)
SELECT id, 'Grande (2L)', 'G', 3, 'active' FROM ceramic_products WHERE name = 'Jarras'
ON CONFLICT (product_id, size_name) DO NOTHING;

-- Platones sizes
INSERT INTO ceramic_sizes (product_id, size_name, size_code, size_order, status)
SELECT id, 'Mediano', 'M', 2, 'active' FROM ceramic_products WHERE name = 'Platones'
ON CONFLICT (product_id, size_name) DO NOTHING;

INSERT INTO ceramic_sizes (product_id, size_name, size_code, size_order, status)
SELECT id, 'Grande', 'G', 3, 'active' FROM ceramic_products WHERE name = 'Platones'
ON CONFLICT (product_id, size_name) DO NOTHING;

-- Tazones sizes
INSERT INTO ceramic_sizes (product_id, size_name, size_code, size_order, status)
SELECT id, 'Pequeño', 'P', 1, 'active' FROM ceramic_products WHERE name = 'Tazones'
ON CONFLICT (product_id, size_name) DO NOTHING;

INSERT INTO ceramic_sizes (product_id, size_name, size_code, size_order, status)
SELECT id, 'Mediano', 'M', 2, 'active' FROM ceramic_products WHERE name = 'Tazones'
ON CONFLICT (product_id, size_name) DO NOTHING;

INSERT INTO ceramic_sizes (product_id, size_name, size_code, size_order, status)
SELECT id, 'Grande', 'G', 3, 'active' FROM ceramic_products WHERE name = 'Tazones'
ON CONFLICT (product_id, size_name) DO NOTHING;

-- ============================================================
-- ENAMEL COLORS
-- ============================================================

INSERT INTO ceramic_enamel_colors (color_name, color_code, hex_code, status) VALUES
('Blanco', 'BL', '#FFFFFF', 'active'),
('Azul', 'AZ', '#0066CC', 'active'),
('Verde', 'VE', '#00AA00', 'active'),
('Rojo', 'RJ', '#DD0000', 'active'),
('Amarillo', 'AM', '#FFD700', 'active'),
('Negro', 'NG', '#000000', 'active'),
('Café', 'CF', '#8B4513', 'active'),
('Gris', 'GR', '#808080', 'active'),
('Rosa', 'RS', '#FF69B4', 'active'),
('Naranja', 'NR', '#FF8C00', 'active'),
('Morado', 'MR', '#8B00FF', 'active'),
('Turquesa', 'TQ', '#40E0D0', 'active'),
('Beige', 'BG', '#F5F5DC', 'active'),
('Crema', 'CR', '#FFFDD0', 'active')
ON CONFLICT (color_name) DO NOTHING;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Count products
-- SELECT COUNT(*) as total_products FROM ceramic_products WHERE status = 'active';

-- Count sizes
-- SELECT p.name, COUNT(s.id) as size_count
-- FROM ceramic_products p
-- LEFT JOIN ceramic_sizes s ON p.id = s.product_id AND s.status = 'active'
-- WHERE p.status = 'active'
-- GROUP BY p.name;

-- Count colors
-- SELECT COUNT(*) as total_colors FROM ceramic_enamel_colors WHERE status = 'active';
