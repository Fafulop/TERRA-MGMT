import { Request, Response } from 'express';
import pool from '../config/database';

// Get all kits with item counts
export const getKits = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        k.*,
        u.username as created_by_name,
        COUNT(ki.id) as items_count,
        COALESCE(SUM(ki.quantity), 0) as total_products
      FROM ecommerce_kits k
      LEFT JOIN users u ON k.created_by = u.id
      LEFT JOIN ecommerce_kit_items ki ON k.id = ki.kit_id
      GROUP BY k.id, u.username
      ORDER BY k.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching kits:', error);
    res.status(500).json({ error: 'Failed to fetch kits' });
  }
};

// Get single kit with items
export const getKit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const kitResult = await pool.query(`
      SELECT
        k.*,
        u.username as created_by_name
      FROM ecommerce_kits k
      LEFT JOIN users u ON k.created_by = u.id
      WHERE k.id = $1
    `, [id]);

    if (kitResult.rows.length === 0) {
      return res.status(404).json({ error: 'Kit not found' });
    }

    const itemsResult = await pool.query(`
      SELECT
        ki.*,
        p.name as product_name,
        t.name as tipo_name,
        s.size_cm,
        c.capacity_ml,
        ec.color as esmalte_color,
        ec.hex_code as esmalte_hex_code
      FROM ecommerce_kit_items ki
      JOIN produccion_products p ON ki.product_id = p.id
      LEFT JOIN produccion_tipo t ON p.tipo_id = t.id
      LEFT JOIN produccion_size s ON p.size_id = s.id
      LEFT JOIN produccion_capacity c ON p.capacity_id = c.id
      LEFT JOIN produccion_esmalte_color ec ON ki.esmalte_color_id = ec.id
      WHERE ki.kit_id = $1
      ORDER BY ki.id ASC
    `, [id]);

    // Get allocations
    const allocationsResult = await pool.query(`
      SELECT
        ka.*,
        pi.product_id,
        p.name as product_name,
        pi.stage,
        ec.color as esmalte_color
      FROM ecommerce_kit_allocations ka
      JOIN produccion_inventory pi ON ka.inventory_id = pi.id
      JOIN produccion_products p ON pi.product_id = p.id
      LEFT JOIN produccion_esmalte_color ec ON pi.esmalte_color_id = ec.id
      WHERE ka.kit_id = $1
    `, [id]);

    res.json({
      ...kitResult.rows[0],
      items: itemsResult.rows,
      allocations: allocationsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching kit:', error);
    res.status(500).json({ error: 'Failed to fetch kit' });
  }
};

// Create kit
export const createKit = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      name,
      description,
      sku,
      price,
      min_stock,
      max_stock,
      is_active,
      items,
    } = req.body;

    const userId = (req as any).userId;

    if (!name) {
      return res.status(400).json({ error: 'Kit name is required' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    // Handle SKU - convert empty string to null
    const cleanSku = sku && sku.trim() !== '' ? sku.trim() : null;

    // Insert kit
    const kitResult = await client.query(`
      INSERT INTO ecommerce_kits (
        name,
        description,
        sku,
        price,
        min_stock,
        max_stock,
        is_active,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      name,
      description || null,
      cleanSku,
      price || 0,
      min_stock || 0,
      max_stock || 100,
      is_active !== false,
      userId,
    ]);

    const kit = kitResult.rows[0];

    // Insert items
    for (const item of items) {
      await client.query(`
        INSERT INTO ecommerce_kit_items (
          kit_id,
          product_id,
          esmalte_color_id,
          quantity
        )
        VALUES ($1, $2, $3, $4)
      `, [
        kit.id,
        item.product_id,
        item.esmalte_color_id || null,
        item.quantity || 1,
      ]);
    }

    await client.query('COMMIT');
    res.status(201).json(kit);
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error creating kit:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'SKU already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create kit', details: error.message });
    }
  } finally {
    client.release();
  }
};

// Update kit
export const updateKit = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const {
      name,
      description,
      sku,
      price,
      min_stock,
      max_stock,
      is_active,
      items,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Kit name is required' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    // Check if kit has stock (can't modify items if stock exists)
    const stockCheck = await client.query(
      'SELECT current_stock FROM ecommerce_kits WHERE id = $1',
      [id]
    );

    if (stockCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Kit not found' });
    }

    // Handle SKU - convert empty string to null
    const cleanSku = sku && sku.trim() !== '' ? sku.trim() : null;

    // Update kit
    await client.query(`
      UPDATE ecommerce_kits
      SET
        name = $1,
        description = $2,
        sku = $3,
        price = $4,
        min_stock = $5,
        max_stock = $6,
        is_active = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
    `, [
      name,
      description || null,
      cleanSku,
      price || 0,
      min_stock || 0,
      max_stock || 100,
      is_active !== false,
      id,
    ]);

    // Only update items if kit has no current stock
    if (stockCheck.rows[0].current_stock === 0) {
      // Delete existing items
      await client.query('DELETE FROM ecommerce_kit_items WHERE kit_id = $1', [id]);

      // Insert new items
      for (const item of items) {
        await client.query(`
          INSERT INTO ecommerce_kit_items (
            kit_id,
            product_id,
            esmalte_color_id,
            quantity
          )
          VALUES ($1, $2, $3, $4)
        `, [
          id,
          item.product_id,
          item.esmalte_color_id || null,
          item.quantity || 1,
        ]);
      }
    }

    await client.query('COMMIT');

    // Fetch updated kit
    const updatedResult = await pool.query(`
      SELECT k.*, u.username as created_by_name
      FROM ecommerce_kits k
      LEFT JOIN users u ON k.created_by = u.id
      WHERE k.id = $1
    `, [id]);

    res.json(updatedResult.rows[0]);
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error updating kit:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'SKU already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update kit', details: error.message });
    }
  } finally {
    client.release();
  }
};

// Delete kit
export const deleteKit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if kit has stock
    const stockCheck = await pool.query(
      'SELECT current_stock FROM ecommerce_kits WHERE id = $1',
      [id]
    );

    if (stockCheck.rows.length > 0 && stockCheck.rows[0].current_stock > 0) {
      return res.status(400).json({
        error: 'Cannot delete kit with existing stock. Please reduce stock to 0 first.'
      });
    }

    await pool.query('DELETE FROM ecommerce_kits WHERE id = $1', [id]);
    res.json({ message: 'Kit deleted successfully' });
  } catch (error) {
    console.error('Error deleting kit:', error);
    res.status(500).json({ error: 'Failed to delete kit' });
  }
};

// Adjust kit stock (add or remove assembled kits)
export const adjustKitStock = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { adjustment, notes } = req.body;
    const userId = (req as any).userId;

    if (adjustment === undefined || adjustment === 0) {
      return res.status(400).json({ error: 'Adjustment quantity is required' });
    }

    // Get kit with items
    const kitResult = await client.query(`
      SELECT k.*,
        json_agg(json_build_object(
          'product_id', ki.product_id,
          'esmalte_color_id', ki.esmalte_color_id,
          'quantity', ki.quantity
        )) as items
      FROM ecommerce_kits k
      JOIN ecommerce_kit_items ki ON k.id = ki.kit_id
      WHERE k.id = $1
      GROUP BY k.id
    `, [id]);

    if (kitResult.rows.length === 0) {
      return res.status(404).json({ error: 'Kit not found' });
    }

    const kit = kitResult.rows[0];
    const newStock = kit.current_stock + adjustment;

    if (newStock < 0) {
      return res.status(400).json({ error: 'Cannot reduce stock below 0' });
    }

    if (newStock > kit.max_stock) {
      return res.status(400).json({
        error: `Cannot exceed max stock of ${kit.max_stock}`
      });
    }

    // If increasing stock, we need to allocate inventory
    if (adjustment > 0) {
      for (const item of kit.items) {
        // Find matching inventory (ESMALTADO stage)
        const inventoryResult = await client.query(`
          SELECT id, quantity, apartados
          FROM produccion_inventory
          WHERE product_id = $1
            AND stage = 'ESMALTADO'
            AND ($2::INTEGER IS NULL OR esmalte_color_id = $2)
          ORDER BY (quantity - apartados) DESC
          LIMIT 1
        `, [item.product_id, item.esmalte_color_id]);

        if (inventoryResult.rows.length === 0) {
          throw new Error(`No ESMALTADO inventory found for product ${item.product_id}`);
        }

        const inventory = inventoryResult.rows[0];
        const requiredQty = item.quantity * adjustment;
        const available = inventory.quantity - inventory.apartados;

        if (available < requiredQty) {
          // Get product name for error message
          const productResult = await client.query(
            'SELECT name FROM produccion_products WHERE id = $1',
            [item.product_id]
          );
          throw new Error(
            `Insufficient inventory for ${productResult.rows[0]?.name || 'product'}. ` +
            `Available: ${available}, Required: ${requiredQty}`
          );
        }

        // Create or update allocation
        await client.query(`
          INSERT INTO ecommerce_kit_allocations (kit_id, inventory_id, quantity_allocated, allocated_by)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (kit_id, inventory_id)
          DO UPDATE SET
            quantity_allocated = ecommerce_kit_allocations.quantity_allocated + $3,
            updated_at = CURRENT_TIMESTAMP
        `, [id, inventory.id, requiredQty, userId]);
      }
    }

    // If decreasing stock, we need to release inventory allocations
    if (adjustment < 0) {
      const releaseQty = Math.abs(adjustment);

      for (const item of kit.items) {
        const requiredRelease = item.quantity * releaseQty;

        // Get current allocation
        const allocationResult = await client.query(`
          SELECT ka.id, ka.inventory_id, ka.quantity_allocated
          FROM ecommerce_kit_allocations ka
          JOIN produccion_inventory pi ON ka.inventory_id = pi.id
          WHERE ka.kit_id = $1
            AND pi.product_id = $2
            AND ($3::INTEGER IS NULL OR pi.esmalte_color_id = $3)
        `, [id, item.product_id, item.esmalte_color_id]);

        if (allocationResult.rows.length > 0) {
          const allocation = allocationResult.rows[0];
          const newAllocation = allocation.quantity_allocated - requiredRelease;

          if (newAllocation <= 0) {
            await client.query(
              'DELETE FROM ecommerce_kit_allocations WHERE id = $1',
              [allocation.id]
            );
          } else {
            await client.query(`
              UPDATE ecommerce_kit_allocations
              SET quantity_allocated = $1, updated_at = CURRENT_TIMESTAMP
              WHERE id = $2
            `, [newAllocation, allocation.id]);
          }
        }
      }
    }

    // Update kit stock
    await client.query(`
      UPDATE ecommerce_kits
      SET current_stock = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [newStock, id]);

    await client.query('COMMIT');

    res.json({
      message: 'Stock adjusted successfully',
      previous_stock: kit.current_stock,
      adjustment,
      new_stock: newStock,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error adjusting kit stock:', error);
    res.status(500).json({ error: 'Failed to adjust kit stock', details: error.message });
  } finally {
    client.release();
  }
};

// Get available inventory for kit items (ESMALTADO stage only)
export const getAvailableInventoryForKits = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        pi.id,
        pi.product_id,
        p.name as product_name,
        t.name as tipo_name,
        s.size_cm,
        c.capacity_ml,
        pi.esmalte_color_id,
        ec.color as esmalte_color,
        ec.hex_code as esmalte_hex_code,
        pi.quantity,
        pi.apartados,
        (pi.quantity - pi.apartados) as disponibles
      FROM produccion_inventory pi
      JOIN produccion_products p ON pi.product_id = p.id
      LEFT JOIN produccion_tipo t ON p.tipo_id = t.id
      LEFT JOIN produccion_size s ON p.size_id = s.id
      LEFT JOIN produccion_capacity c ON p.capacity_id = c.id
      LEFT JOIN produccion_esmalte_color ec ON pi.esmalte_color_id = ec.id
      WHERE pi.stage = 'ESMALTADO'
        AND (pi.quantity - pi.apartados) > 0
      ORDER BY p.name, ec.color
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching available inventory:', error);
    res.status(500).json({ error: 'Failed to fetch available inventory' });
  }
};
