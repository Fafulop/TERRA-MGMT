import { Request, Response } from 'express';
import pool from '../config/database';

// Get all embalaje inventory
export const getEmbalajeInventory = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        ei.*,
        p.name as product_name,
        t.name as tipo_name,
        (ei.quantity - ei.apartados) as disponible
      FROM embalaje_inventory ei
      INNER JOIN produccion_products p ON ei.product_id = p.id
      LEFT JOIN produccion_tipo t ON p.tipo_id = t.id
      WHERE p.product_category = 'EMBALAJE'
      ORDER BY p.name ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching embalaje inventory:', error);
    res.status(500).json({ error: 'Failed to fetch embalaje inventory' });
  }
};

// Get embalaje inventory movements
export const getEmbalajeMovements = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        em.*,
        p.name as product_name,
        t.name as tipo_name,
        u.username as created_by_name
      FROM embalaje_inventory_movements em
      INNER JOIN produccion_products p ON em.product_id = p.id
      LEFT JOIN produccion_tipo t ON p.tipo_id = t.id
      LEFT JOIN users u ON em.created_by = u.id
      ORDER BY em.created_at DESC
      LIMIT 100
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching embalaje movements:', error);
    res.status(500).json({ error: 'Failed to fetch embalaje movements' });
  }
};

// Helper function to get or create inventory record
const getOrCreateInventory = async (productId: number): Promise<number> => {
  // Check if inventory record exists
  const existingInventory = await pool.query(
    'SELECT id FROM embalaje_inventory WHERE product_id = $1',
    [productId]
  );

  if (existingInventory.rows.length > 0) {
    return existingInventory.rows[0].id;
  }

  // Create new inventory record
  const newInventory = await pool.query(
    `INSERT INTO embalaje_inventory (product_id, quantity, apartados)
     VALUES ($1, 0, 0)
     RETURNING id`,
    [productId]
  );

  return newInventory.rows[0].id;
};

// Add inventory (INPUT)
export const addEmbalajeInventory = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    const { items } = req.body; // Array of { product_id, quantity, notes? }
    const userId = (req as any).user?.id || 1;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    await client.query('BEGIN');

    for (const item of items) {
      const { product_id, quantity, notes } = item;

      if (!product_id || !quantity || quantity <= 0) {
        throw new Error('Each item must have product_id and positive quantity');
      }

      // Verify product is embalaje category
      const productCheck = await client.query(
        'SELECT product_category FROM produccion_products WHERE id = $1',
        [product_id]
      );

      if (productCheck.rows.length === 0) {
        throw new Error(`Product ${product_id} not found`);
      }

      if (productCheck.rows[0].product_category !== 'EMBALAJE') {
        throw new Error(`Product ${product_id} is not an embalaje product`);
      }

      // Ensure inventory record exists
      await getOrCreateInventory(product_id);

      // Update quantity
      await client.query(
        `UPDATE embalaje_inventory
         SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP
         WHERE product_id = $2`,
        [quantity, product_id]
      );

      // Record movement
      await client.query(
        `INSERT INTO embalaje_inventory_movements
         (product_id, movement_type, quantity, notes, created_by)
         VALUES ($1, 'INPUT', $2, $3, $4)`,
        [product_id, quantity, notes || null, userId]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Inventory added successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding embalaje inventory:', error);
    res.status(500).json({
      error: 'Failed to add inventory',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    client.release();
  }
};

// Remove inventory (OUTPUT)
export const removeEmbalajeInventory = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    const { items } = req.body; // Array of { product_id, quantity, notes? }
    const userId = (req as any).user?.id || 1;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    await client.query('BEGIN');

    for (const item of items) {
      const { product_id, quantity, notes } = item;

      if (!product_id || !quantity || quantity <= 0) {
        throw new Error('Each item must have product_id and positive quantity');
      }

      // Check available inventory
      const inventoryCheck = await client.query(
        `SELECT ei.quantity, ei.apartados, p.name
         FROM embalaje_inventory ei
         INNER JOIN produccion_products p ON ei.product_id = p.id
         WHERE ei.product_id = $1`,
        [product_id]
      );

      if (inventoryCheck.rows.length === 0) {
        throw new Error(`No inventory found for product ${product_id}`);
      }

      const { quantity: currentQty, apartados, name } = inventoryCheck.rows[0];
      const available = currentQty - apartados;

      if (available < quantity) {
        throw new Error(
          `Insufficient inventory for ${name}. Available: ${available}, Requested: ${quantity}`
        );
      }

      // Update quantity
      await client.query(
        `UPDATE embalaje_inventory
         SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP
         WHERE product_id = $2`,
        [quantity, product_id]
      );

      // Record movement (negative quantity)
      await client.query(
        `INSERT INTO embalaje_inventory_movements
         (product_id, movement_type, quantity, notes, created_by)
         VALUES ($1, 'OUTPUT', $2, $3, $4)`,
        [product_id, -quantity, notes || null, userId]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Inventory removed successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error removing embalaje inventory:', error);
    res.status(500).json({
      error: 'Failed to remove inventory',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    client.release();
  }
};

// Adjust inventory (set exact quantity)
export const adjustEmbalajeInventory = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    const { items } = req.body; // Array of { product_id, quantity, notes? }
    const userId = (req as any).user?.id || 1;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    await client.query('BEGIN');

    for (const item of items) {
      const { product_id, quantity, notes } = item;

      if (!product_id || quantity === undefined || quantity < 0) {
        throw new Error('Each item must have product_id and non-negative quantity');
      }

      // Ensure inventory record exists
      await getOrCreateInventory(product_id);

      // Get current quantity
      const currentInventory = await client.query(
        'SELECT quantity FROM embalaje_inventory WHERE product_id = $1',
        [product_id]
      );

      const currentQty = currentInventory.rows[0].quantity;
      const delta = quantity - currentQty;

      // Update to exact quantity
      await client.query(
        `UPDATE embalaje_inventory
         SET quantity = $1, updated_at = CURRENT_TIMESTAMP
         WHERE product_id = $2`,
        [quantity, product_id]
      );

      // Record adjustment movement
      await client.query(
        `INSERT INTO embalaje_inventory_movements
         (product_id, movement_type, quantity, notes, created_by)
         VALUES ($1, 'ADJUSTMENT', $2, $3, $4)`,
        [product_id, delta, notes || null, userId]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Inventory adjusted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adjusting embalaje inventory:', error);
    res.status(500).json({
      error: 'Failed to adjust inventory',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    client.release();
  }
};
