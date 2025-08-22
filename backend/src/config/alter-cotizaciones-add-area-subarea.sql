-- Add area and subarea columns to existing cotizaciones_entries table
-- This script should be run manually to update the existing table

-- Add the new columns
ALTER TABLE cotizaciones_entries 
ADD COLUMN IF NOT EXISTS area VARCHAR(255),
ADD COLUMN IF NOT EXISTS subarea VARCHAR(255);

-- Update existing records to have default values (you may want to customize these)
UPDATE cotizaciones_entries 
SET area = 'General', subarea = 'Miscellaneous' 
WHERE area IS NULL OR subarea IS NULL;

-- Now make the columns NOT NULL
ALTER TABLE cotizaciones_entries 
ALTER COLUMN area SET NOT NULL,
ALTER COLUMN subarea SET NOT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cotizaciones_entries_area ON cotizaciones_entries(area);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_entries_subarea ON cotizaciones_entries(subarea);

-- Add comments for documentation
COMMENT ON COLUMN cotizaciones_entries.area IS 'Required area classification for cotizaciones entry';
COMMENT ON COLUMN cotizaciones_entries.subarea IS 'Required subarea classification for cotizaciones entry';