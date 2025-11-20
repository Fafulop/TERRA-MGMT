-- Fix ambiguous quote_number reference in generate_quote_number function
-- Qualify column references with table name

CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS VARCHAR(50) AS $$
DECLARE
  year_str VARCHAR(4);
  next_number INTEGER;
  quote_number VARCHAR(50);
BEGIN
  -- Get current year
  year_str := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;

  -- Get the highest number for this year (qualify column with table name)
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(ventas_quotes.quote_number FROM '[0-9]+$') AS INTEGER
      )
    ), 0
  ) + 1 INTO next_number
  FROM ventas_quotes
  WHERE ventas_quotes.quote_number LIKE 'Q-' || year_str || '-%';

  -- Format: Q-2024-0001
  quote_number := 'Q-' || year_str || '-' || LPAD(next_number::VARCHAR, 4, '0');

  RETURN quote_number;
END;
$$ LANGUAGE plpgsql;
