-- Add MERMA movement type to produccion_inventory_movements table

-- Update the CHECK constraint to include MERMA
ALTER TABLE produccion_inventory_movements
  DROP CONSTRAINT IF EXISTS produccion_inventory_movements_movement_type_check;

ALTER TABLE produccion_inventory_movements
  ADD CONSTRAINT produccion_inventory_movements_movement_type_check
  CHECK (movement_type IN ('CRUDO_INPUT', 'SANCOCHADO_PROCESS', 'ESMALTADO_PROCESS', 'ADJUSTMENT', 'MERMA'));

COMMENT ON COLUMN produccion_inventory_movements.movement_type IS 'Type of movement: CRUDO_INPUT, SANCOCHADO_PROCESS, ESMALTADO_PROCESS, ADJUSTMENT, MERMA';
