import { Request, Response } from 'express';
import pool from '../config/database';

// Get available inventory for a pedido's items
export const getPedidoInventoryAvailability = async (req: Request, res: Response) => {
  const { id } = req.params; // pedido_id
  const client = await pool.connect();

  try {
    // Get pedido items with their product info
    const pedidoItemsResult = await client.query(`
      SELECT
        pi.id as pedido_item_id,
        pi.product_id,
        pi.product_name,
        pi.tipo_name,
        pi.esmalte_color_id,
        pi.esmalte_color,
        pi.esmalte_hex_code,
        pi.quantity as quantity_needed,
        pi.unit_price,
        COALESCE(SUM(pa.quantity_allocated), 0) as quantity_allocated
      FROM ventas_pedido_items pi
      LEFT JOIN ventas_pedido_allocations pa ON pi.id = pa.pedido_item_id
      WHERE pi.pedido_id = $1
      GROUP BY pi.id
      ORDER BY pi.id
    `, [id]);

    // For each item, find matching inventory items (Etapa Esmaltado only)
    const itemsWithInventory = await Promise.all(
      pedidoItemsResult.rows.map(async (item) => {
        // Find matching inventory items
        const inventoryResult = await client.query(`
          SELECT
            inv.id as inventory_id,
            inv.product_id,
            inv.quantity as cant,
            inv.apartados,
            (inv.quantity - inv.apartados) as disponibles,
            inv.stage,
            p.name as product_name,
            t.name as tipo_name,
            ec.color as esmalte_color,
            ec.hex_code as esmalte_hex_code
          FROM produccion_inventory inv
          JOIN produccion_products p ON inv.product_id = p.id
          LEFT JOIN produccion_tipo t ON p.tipo_id = t.id
          LEFT JOIN produccion_esmalte_color ec ON inv.esmalte_color_id = ec.id
          WHERE inv.product_id = $1
            AND inv.stage = 'ESMALTADO'
            AND (
              ($2::INTEGER IS NULL AND inv.esmalte_color_id IS NULL) OR
              inv.esmalte_color_id = $2
            )
          ORDER BY inv.created_at ASC
        `, [item.product_id, item.esmalte_color_id || null]);

        // Calculate totals
        const totalCant = inventoryResult.rows.reduce((sum, inv) => sum + Number(inv.cant), 0);
        const totalApartados = inventoryResult.rows.reduce((sum, inv) => sum + Number(inv.apartados), 0);
        const totalDisponibles = totalCant - totalApartados;
        const stillNeeded = Math.max(0, Number(item.quantity_needed) - Number(item.quantity_allocated));
        const shortfall = Math.max(0, stillNeeded - totalDisponibles);

        return {
          ...item,
          quantity_needed: Number(item.quantity_needed),
          quantity_allocated: Number(item.quantity_allocated),
          inventory_items: inventoryResult.rows.map(inv => ({
            ...inv,
            cant: Number(inv.cant),
            apartados: Number(inv.apartados),
            disponibles: Number(inv.disponibles)
          })),
          total_cant: totalCant,
          total_apartados: totalApartados,
          total_disponibles: totalDisponibles,
          still_needed: stillNeeded,
          shortfall: shortfall
        };
      })
    );

    res.json(itemsWithInventory);
  } catch (error: any) {
    console.error('Error getting pedido inventory availability:', error);
    res.status(500).json({ error: 'Failed to get inventory availability', details: error.message });
  } finally {
    client.release();
  }
};

// Allocate inventory to a pedido item
export const allocateInventory = async (req: Request, res: Response) => {
  const { pedido_id, pedido_item_id, inventory_id, quantity } = req.body;
  const userId = (req as any).user?.id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify inventory has enough disponibles
    const inventoryCheck = await client.query(`
      SELECT quantity, apartados, (quantity - apartados) as disponibles
      FROM produccion_inventory
      WHERE id = $1
    `, [inventory_id]);

    if (inventoryCheck.rows.length === 0) {
      throw new Error('Inventory item not found');
    }

    const disponibles = Number(inventoryCheck.rows[0].disponibles);
    if (disponibles < quantity) {
      throw new Error(`Not enough disponibles. Available: ${disponibles}, Requested: ${quantity}`);
    }

    // Create allocation
    const result = await client.query(`
      INSERT INTO ventas_pedido_allocations (
        pedido_id, pedido_item_id, inventory_id, quantity_allocated, allocated_by
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [pedido_id, pedido_item_id, inventory_id, quantity, userId]);

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error allocating inventory:', error);
    res.status(400).json({ error: 'Failed to allocate inventory', details: error.message });
  } finally {
    client.release();
  }
};

// Get allocations for a pedido
export const getPedidoAllocations = async (req: Request, res: Response) => {
  const { id } = req.params; // pedido_id

  try {
    const result = await pool.query(`
      SELECT
        pa.*,
        pi.product_name,
        pi.tipo_name,
        pi.esmalte_color,
        inv.quantity as inventory_cant,
        inv.apartados as inventory_apartados,
        u.username as allocated_by_name
      FROM ventas_pedido_allocations pa
      JOIN ventas_pedido_items pi ON pa.pedido_item_id = pi.id
      JOIN produccion_inventory inv ON pa.inventory_id = inv.id
      LEFT JOIN users u ON pa.allocated_by = u.id
      WHERE pa.pedido_id = $1
      ORDER BY pa.created_at DESC
    `, [id]);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error getting pedido allocations:', error);
    res.status(500).json({ error: 'Failed to get allocations', details: error.message });
  }
};

// Deallocate inventory from a pedido (for cancellations or manual removal)
export const deallocateInventory = async (req: Request, res: Response) => {
  const { id } = req.params; // allocation_id
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Delete allocation (trigger will automatically update apartados)
    const result = await client.query(`
      DELETE FROM ventas_pedido_allocations
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      throw new Error('Allocation not found');
    }

    await client.query('COMMIT');
    res.json({ message: 'Allocation removed successfully', allocation: result.rows[0] });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error deallocating inventory:', error);
    res.status(400).json({ error: 'Failed to deallocate inventory', details: error.message });
  } finally {
    client.release();
  }
};

// Handle pedido delivery - subtract from both cant and apartados
export const handlePedidoDelivery = async (pedido_id: number, client: any) => {
  // Get all allocations for this pedido
  const allocations = await client.query(`
    SELECT inventory_id, SUM(quantity_allocated) as total_allocated
    FROM ventas_pedido_allocations
    WHERE pedido_id = $1
    GROUP BY inventory_id
  `, [pedido_id]);

  // For each inventory item, subtract the allocated quantity from cant
  for (const allocation of allocations.rows) {
    await client.query(`
      UPDATE produccion_inventory
      SET quantity = quantity - $1
      WHERE id = $2 AND quantity >= $1
    `, [allocation.total_allocated, allocation.inventory_id]);
  }

  // Delete allocations (trigger will automatically update apartados)
  await client.query(`
    DELETE FROM ventas_pedido_allocations
    WHERE pedido_id = $1
  `, [pedido_id]);
};

// Handle pedido cancellation - only remove apartados
export const handlePedidoCancellation = async (pedido_id: number, client: any) => {
  // Delete allocations (trigger will automatically update apartados)
  await client.query(`
    DELETE FROM ventas_pedido_allocations
    WHERE pedido_id = $1
  `, [pedido_id]);
};
