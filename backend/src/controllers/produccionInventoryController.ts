import { Request, Response } from 'express';
import pool from '../config/database';

// Get inventory levels with product details
export const getInventory = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        i.*,
        p.name as product_name,
        p.tipo_id,
        t.name as tipo_name,
        p.costo_pasta,
        p.costo_mano_obra,
        p.costo_esmalte,
        p.costo_horneado,
        e.color as esmalte_color,
        e.hex_code as esmalte_hex_code
      FROM produccion_inventory i
      JOIN produccion_products p ON i.product_id = p.id
      LEFT JOIN produccion_tipo t ON p.tipo_id = t.id
      LEFT JOIN produccion_esmalte_color e ON i.esmalte_color_id = e.id
      WHERE i.quantity > 0
      ORDER BY p.name, i.stage, e.color
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
};

// Get inventory movements history
export const getMovements = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        m.*,
        p.name as product_name,
        t.name as tipo_name,
        fc.color as from_color,
        tc.color as to_color,
        u.username as created_by_name
      FROM produccion_inventory_movements m
      JOIN produccion_products p ON m.product_id = p.id
      LEFT JOIN produccion_tipo t ON p.tipo_id = t.id
      LEFT JOIN produccion_esmalte_color fc ON m.from_color_id = fc.id
      LEFT JOIN produccion_esmalte_color tc ON m.to_color_id = tc.id
      LEFT JOIN users u ON m.created_by = u.id
      ORDER BY m.created_at DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching movements:', error);
    res.status(500).json({ error: 'Failed to fetch movements' });
  }
};

// Helper function to get or create inventory record
async function getOrCreateInventory(
  productId: number,
  stage: string,
  colorId: number | null,
  client: any
) {
  const existing = await client.query(
    `SELECT * FROM produccion_inventory
     WHERE product_id = $1 AND stage = $2 AND esmalte_color_id IS NOT DISTINCT FROM $3`,
    [productId, stage, colorId]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const newRecord = await client.query(
    `INSERT INTO produccion_inventory (product_id, stage, esmalte_color_id, quantity)
     VALUES ($1, $2, $3, 0)
     RETURNING *`,
    [productId, stage, colorId]
  );

  return newRecord.rows[0];
}

// Process CRUDO input (add to CRUDO inventory)
export const processCrudoInput = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { product_id, quantity, notes } = req.body;
    const userId = (req as any).user?.id || 1;

    if (!product_id || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Product and positive quantity required' });
    }

    await client.query('BEGIN');

    // Get or create CRUDO inventory record
    const inventory = await getOrCreateInventory(product_id, 'CRUDO', null, client);

    // Update inventory
    await client.query(
      `UPDATE produccion_inventory
       SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [quantity, inventory.id]
    );

    // Record movement
    await client.query(
      `INSERT INTO produccion_inventory_movements
       (product_id, movement_type, to_stage, quantity, notes, created_by)
       VALUES ($1, 'CRUDO_INPUT', 'CRUDO', $2, $3, $4)`,
      [product_id, quantity, notes, userId]
    );

    await client.query('COMMIT');
    res.status(200).json({ message: 'CRUDO inventory added successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing CRUDO input:', error);
    res.status(500).json({ error: 'Failed to process CRUDO input' });
  } finally {
    client.release();
  }
};

// Process SANCOCHADO (CRUDO -> SANCOCHADO)
export const processSancochado = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { product_id, quantity, notes } = req.body;
    const userId = (req as any).user?.id || 1;

    if (!product_id || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Product and positive quantity required' });
    }

    await client.query('BEGIN');

    // Get CRUDO inventory
    const crudoInventory = await getOrCreateInventory(product_id, 'CRUDO', null, client);

    if (crudoInventory.quantity < quantity) {
      const missing = quantity - crudoInventory.quantity;

      // Get product name for better error message (before rollback)
      const productInfo = await client.query(
        'SELECT name FROM produccion_products WHERE id = $1',
        [product_id]
      );

      await client.query('ROLLBACK');

      return res.status(400).json({
        error: `Inventario CRUDO insuficiente`,
        details: {
          product_name: productInfo.rows[0]?.name || 'Producto',
          stage: 'CRUDO',
          available: crudoInventory.quantity,
          requested: quantity,
          missing: missing
        }
      });
    }

    // Subtract from CRUDO
    await client.query(
      `UPDATE produccion_inventory
       SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [quantity, crudoInventory.id]
    );

    // Add to SANCOCHADO
    const sanchoInventory = await getOrCreateInventory(product_id, 'SANCOCHADO', null, client);
    await client.query(
      `UPDATE produccion_inventory
       SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [quantity, sanchoInventory.id]
    );

    // Record movement
    await client.query(
      `INSERT INTO produccion_inventory_movements
       (product_id, movement_type, from_stage, to_stage, quantity, notes, created_by)
       VALUES ($1, 'SANCOCHADO_PROCESS', 'CRUDO', 'SANCOCHADO', $2, $3, $4)`,
      [product_id, quantity, notes, userId]
    );

    await client.query('COMMIT');
    res.status(200).json({ message: 'SANCOCHADO process completed successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing SANCOCHADO:', error);
    res.status(500).json({ error: 'Failed to process SANCOCHADO' });
  } finally {
    client.release();
  }
};

// Process ESMALTADO (SANCOCHADO -> ESMALTADO with color)
export const processEsmaltado = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { product_id, quantity, esmalte_color_id, notes } = req.body;
    const userId = (req as any).user?.id || 1;

    if (!product_id || !quantity || quantity <= 0 || !esmalte_color_id) {
      return res.status(400).json({ error: 'Product, positive quantity, and esmalte color required' });
    }

    await client.query('BEGIN');

    // Get SANCOCHADO inventory
    const sanchoInventory = await getOrCreateInventory(product_id, 'SANCOCHADO', null, client);

    if (sanchoInventory.quantity < quantity) {
      const missing = quantity - sanchoInventory.quantity;

      // Get product name for better error message (before rollback)
      const productInfo = await client.query(
        'SELECT name FROM produccion_products WHERE id = $1',
        [product_id]
      );

      await client.query('ROLLBACK');

      return res.status(400).json({
        error: `Inventario SANCOCHADO insuficiente`,
        details: {
          product_name: productInfo.rows[0]?.name || 'Producto',
          stage: 'SANCOCHADO',
          available: sanchoInventory.quantity,
          requested: quantity,
          missing: missing
        }
      });
    }

    // Subtract from SANCOCHADO
    await client.query(
      `UPDATE produccion_inventory
       SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [quantity, sanchoInventory.id]
    );

    // Add to ESMALTADO with color
    const esmaltadoInventory = await getOrCreateInventory(product_id, 'ESMALTADO', esmalte_color_id, client);
    await client.query(
      `UPDATE produccion_inventory
       SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [quantity, esmaltadoInventory.id]
    );

    // Record movement
    await client.query(
      `INSERT INTO produccion_inventory_movements
       (product_id, movement_type, from_stage, to_stage, to_color_id, quantity, notes, created_by)
       VALUES ($1, 'ESMALTADO_PROCESS', 'SANCOCHADO', 'ESMALTADO', $2, $3, $4, $5)`,
      [product_id, esmalte_color_id, quantity, notes, userId]
    );

    await client.query('COMMIT');
    res.status(200).json({ message: 'ESMALTADO process completed successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing ESMALTADO:', error);
    res.status(500).json({ error: 'Failed to process ESMALTADO' });
  } finally {
    client.release();
  }
};

// Process inventory adjustment
export const processAdjustment = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { product_id, stage, esmalte_color_id, quantity, notes } = req.body;
    const userId = (req as any).user?.id || 1;

    if (!product_id || !stage || quantity === undefined || quantity < 0) {
      return res.status(400).json({ error: 'Product, stage, and non-negative quantity required' });
    }

    // Validate esmalte_color_id is only for ESMALTADO
    if (stage !== 'ESMALTADO' && esmalte_color_id) {
      return res.status(400).json({ error: 'Esmalte color only allowed for ESMALTADO stage' });
    }

    await client.query('BEGIN');

    // Get or create inventory record
    const colorId = stage === 'ESMALTADO' ? esmalte_color_id : null;
    const inventory = await getOrCreateInventory(product_id, stage, colorId, client);

    // Calculate the adjustment needed to reach the target quantity
    const adjustmentAmount = quantity - inventory.quantity;
    const oldQuantity = inventory.quantity;

    // Update inventory to the exact quantity specified
    await client.query(
      `UPDATE produccion_inventory
       SET quantity = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [quantity, inventory.id]
    );

    // Record movement with the adjustment amount
    await client.query(
      `INSERT INTO produccion_inventory_movements
       (product_id, movement_type, to_stage, to_color_id, quantity, notes, created_by)
       VALUES ($1, 'ADJUSTMENT', $2, $3, $4, $5, $6)`,
      [product_id, stage, colorId, adjustmentAmount, notes, userId]
    );

    await client.query('COMMIT');
    res.status(200).json({
      message: 'Inventory adjustment completed successfully',
      old_quantity: oldQuantity,
      new_quantity: quantity,
      adjustment: adjustmentAmount
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing adjustment:', error);
    res.status(500).json({ error: 'Failed to process adjustment' });
  } finally {
    client.release();
  }
};

// Process MERMA (discount defective/broken products from inventory)
export const processMerma = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { product_id, stage, esmalte_color_id, quantity, notes } = req.body;
    const userId = (req as any).user?.id || 1;

    // Validation
    if (!product_id || !stage || !quantity || quantity <= 0) {
      return res.status(400).json({
        error: 'Product, stage, and positive quantity required'
      });
    }

    // Validate color is only for ESMALTADO
    if (stage !== 'ESMALTADO' && esmalte_color_id) {
      return res.status(400).json({
        error: 'Esmalte color only allowed for ESMALTADO stage'
      });
    }

    await client.query('BEGIN');

    // Get inventory record
    const colorId = stage === 'ESMALTADO' ? esmalte_color_id : null;
    const inventory = await getOrCreateInventory(product_id, stage, colorId, client);

    // Check if sufficient inventory exists
    if (inventory.quantity < quantity) {
      const missing = quantity - inventory.quantity;

      // Get product name for error message
      const productInfo = await client.query(
        'SELECT name FROM produccion_products WHERE id = $1',
        [product_id]
      );

      await client.query('ROLLBACK');

      return res.status(400).json({
        error: `Inventario ${stage} insuficiente`,
        details: {
          product_name: productInfo.rows[0]?.name || 'Producto',
          stage: stage,
          available: inventory.quantity,
          requested: quantity,
          missing: missing
        }
      });
    }

    // Subtract from inventory
    await client.query(
      `UPDATE produccion_inventory
       SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [quantity, inventory.id]
    );

    // Record movement (negative quantity to indicate removal)
    await client.query(
      `INSERT INTO produccion_inventory_movements
       (product_id, movement_type, from_stage, from_color_id, quantity, notes, created_by)
       VALUES ($1, 'MERMA', $2, $3, $4, $5, $6)`,
      [product_id, stage, colorId, -quantity, notes, userId]
    );

    await client.query('COMMIT');
    res.status(200).json({ message: 'MERMA registrada exitosamente' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing MERMA:', error);
    res.status(500).json({ error: 'Failed to process MERMA' });
  } finally {
    client.release();
  }
};
