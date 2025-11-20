-- Fix the generate_quotation_number function
-- The substring was extracting from position 10 instead of 12

CREATE OR REPLACE FUNCTION generate_quotation_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    year_part VARCHAR(4);
    month_part VARCHAR(2);
    next_number INTEGER;
BEGIN
    year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
    month_part := TO_CHAR(CURRENT_DATE, 'MM');

    -- COT-YYYYMM-NNNNNN (sequence starts at position 12)
    SELECT COALESCE(MAX(CAST(SUBSTRING(quotation_number FROM 12 FOR 6) AS INTEGER)), 0) + 1
    INTO next_number
    FROM ventas_quotations
    WHERE quotation_number LIKE 'COT-' || year_part || month_part || '%';

    RETURN 'COT-' || year_part || month_part || '-' || LPAD(next_number::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;
