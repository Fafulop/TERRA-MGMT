-- Add stage field to produccion_products table

ALTER TABLE produccion_products
  ADD COLUMN stage VARCHAR(50) NOT NULL DEFAULT 'CRUDO' CHECK (stage IN ('CRUDO', 'SANCOCHADO', 'ESMALTADO'));

-- Add index for the stage column
CREATE INDEX IF NOT EXISTS idx_produccion_products_stage ON produccion_products(stage);

-- Add comment
COMMENT ON COLUMN produccion_products.stage IS 'Production stage: CRUDO, SANCOCHADO, or ESMALTADO (only ESMALTADO can have esmalte color)';

-- Make esmalte_color_id conditional - only ESMALTADO stage can have esmalte color
-- If stage is CRUDO or SANCOCHADO, esmalte_color_id MUST be NULL
ALTER TABLE produccion_products
  ADD CONSTRAINT check_esmalte_color_stage
  CHECK (
    stage = 'ESMALTADO' OR esmalte_color_id IS NULL
  );
