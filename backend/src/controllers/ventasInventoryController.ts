import { Request, Response } from 'express';
import pool from '../config/database';

// Get available inventory for a pedido's items
export const getPedidoInventoryAvailability = async (req: Request, res: Response) => {
  const { id } = req.params; // pedido_id
  const client = await pool.connect();

  try {
    // Get pedido items with their product info
    // Sum allocations from BOTH ceramic and embalaje allocation tables
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
        (
          COALESCE(SUM(pa.quantity_allocated), 0) +
          COALESCE(SUM(pea.quantity_allocated), 0)
        ) as quantity_allocated
      FROM ventas_pedido_items pi
      LEFT JOIN ventas_pedido_allocations pa ON pi.id = pa.pedido_item_id
      LEFT JOIN ventas_pedido_embalaje_allocations pea ON pi.id = pea.pedido_item_id
      WHERE pi.pedido_id = $1
      GROUP BY pi.id
      ORDER BY pi.id
    `, [id]);

    // For each item, find matching inventory items
    const itemsWithInventory = await Promise.all(
      pedidoItemsResult.rows.map(async (item) => {
        // First, check the product category
        const productCategoryResult = await client.query(`
          SELECT product_category FROM produccion_products WHERE id = $1
        `, [item.product_id]);

        if (productCategoryResult.rows.length === 0) {
          // Product not found, return empty inventory
          return {
            ...item,
            quantity_needed: Number(item.quantity_needed),
            quantity_allocated: Number(item.quantity_allocated),
            inventory_items: [],
            total_cant: 0,
            total_apartados: 0,
            total_disponibles: 0,
            still_needed: Number(item.quantity_needed) - Number(item.quantity_allocated),
            shortfall: Number(item.quantity_needed) - Number(item.quantity_allocated)
          };
        }

        const productCategory = productCategoryResult.rows[0].product_category;
        let inventoryResult;

        if (productCategory === 'CERAMICA') {
          // Query produccion_inventory for ceramic products (Etapa Esmaltado only)
          inventoryResult = await client.query(`
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
        } else if (productCategory === 'EMBALAJE') {
          // Query embalaje_inventory for packaging products
          inventoryResult = await client.query(`
            SELECT
              inv.id as inventory_id,
              inv.product_id,
              inv.quantity as cant,
              inv.apartados,
              (inv.quantity - inv.apartados) as disponibles,
              NULL as stage,
              p.name as product_name,
              t.name as tipo_name,
              NULL as esmalte_color,
              NULL as esmalte_hex_code
            FROM embalaje_inventory inv
            JOIN produccion_products p ON inv.product_id = p.id
            LEFT JOIN produccion_tipo t ON p.tipo_id = t.id
            WHERE inv.product_id = $1
            ORDER BY inv.created_at ASC
          `, [item.product_id]);
        } else {
          // Unknown category, return empty inventory
          inventoryResult = { rows: [] };
        }

        // Calculate totals
        const totalCant = inventoryResult.rows.reduce((sum, inv) => sum + Number(inv.cant), 0);
        const totalApartados = inventoryResult.rows.reduce((sum, inv) => sum + Number(inv.apartados), 0);
        const totalDisponibles = totalCant - totalApartados;
        const stillNeeded = Math.max(0, Number(item.quantity_needed) - Number(item.quantity_allocated));
        const shortfall = Math.max(0, stillNeeded - totalDisponibles);

        return {
          ...item,
          product_category: productCategory, // Add product category to response
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
export const handlePedidoDelivery = async (pedido_id: number, client: any, status?: string) => {
  // Get all allocations for this pedido
  const allocations = await client.query(`
    SELECT inventory_id, SUM(quantity_allocated) as total_allocated
    FROM ventas_pedido_allocations
    WHERE pedido_id = $1
    GROUP BY inventory_id
  `, [pedido_id]);

  // For each inventory item, subtract from quantity
  // If ENTREGADO_Y_PAGADO, also add to vendidos
  // NOTE: Do NOT subtract apartados here - the DELETE trigger will handle it!
  for (const allocation of allocations.rows) {
    if (status === 'ENTREGADO_Y_PAGADO') {
      // Subtract from quantity, add to vendidos
      await client.query(`
        UPDATE produccion_inventory
        SET
          quantity = quantity - $1,
          vendidos = COALESCE(vendidos, 0) + $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND quantity >= $1
      `, [allocation.total_allocated, allocation.inventory_id]);
    } else {
      // Just subtract from quantity (for DELIVERED status)
      await client.query(`
        UPDATE produccion_inventory
        SET
          quantity = quantity - $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND quantity >= $1
      `, [allocation.total_allocated, allocation.inventory_id]);
    }
  }

  // Delete allocations (trigger will automatically recalculate apartados based on remaining allocations)
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

// ========== EMBALAJE INVENTORY ALLOCATION FUNCTIONS ==========

// Get available embalaje inventory for a pedido's items
export const getPedidoEmbalajeAvailability = async (req: Request, res: Response) => {
  const { id } = req.params; // pedido_id
  const client = await pool.connect();

  try {
    // Get pedido items that are embalaje products
    const pedidoItemsResult = await client.query(`
      SELECT
        pi.id as pedido_item_id,
        pi.product_id,
        pi.product_name,
        pi.tipo_name,
        pi.quantity as quantity_needed,
        pi.unit_price,
        COALESCE(SUM(pa.quantity_allocated), 0) as quantity_allocated
      FROM ventas_pedido_items pi
      JOIN produccion_products p ON pi.product_id = p.id
      LEFT JOIN ventas_pedido_embalaje_allocations pa ON pi.id = pa.pedido_item_id
      WHERE pi.pedido_id = $1
        AND p.product_category = 'EMBALAJE'
      GROUP BY pi.id
      ORDER BY pi.id
    `, [id]);

    // For each item, find matching embalaje inventory
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
            p.name as product_name,
            t.name as tipo_name
          FROM embalaje_inventory inv
          JOIN produccion_products p ON inv.product_id = p.id
          LEFT JOIN produccion_tipo t ON p.tipo_id = t.id
          WHERE inv.product_id = $1
          ORDER BY inv.created_at ASC
        `, [item.product_id]);

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
    console.error('Error getting pedido embalaje availability:', error);
    res.status(500).json({ error: 'Failed to get embalaje availability', details: error.message });
  } finally {
    client.release();
  }
};

// Allocate embalaje inventory to a pedido item
export const allocateEmbalajeInventory = async (req: Request, res: Response) => {
  const { pedido_id, pedido_item_id, inventory_id, quantity } = req.body;
  const userId = (req as any).user?.id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify inventory has enough disponibles
    const inventoryCheck = await client.query(`
      SELECT quantity, apartados, (quantity - apartados) as disponibles
      FROM embalaje_inventory
      WHERE id = $1
    `, [inventory_id]);

    if (inventoryCheck.rows.length === 0) {
      throw new Error('Embalaje inventory item not found');
    }

    const disponibles = Number(inventoryCheck.rows[0].disponibles);
    if (disponibles < quantity) {
      throw new Error(`Not enough disponibles. Available: ${disponibles}, Requested: ${quantity}`);
    }

    // Create allocation
    const result = await client.query(`
      INSERT INTO ventas_pedido_embalaje_allocations (
        pedido_id, pedido_item_id, inventory_id, quantity_allocated, allocated_by
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [pedido_id, pedido_item_id, inventory_id, quantity, userId]);

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error allocating embalaje inventory:', error);
    res.status(400).json({ error: 'Failed to allocate embalaje inventory', details: error.message });
  } finally {
    client.release();
  }
};

// Get embalaje allocations for a pedido
export const getPedidoEmbalajeAllocations = async (req: Request, res: Response) => {
  const { id } = req.params; // pedido_id

  try {
    const result = await pool.query(`
      SELECT
        pa.*,
        pi.product_name,
        pi.tipo_name,
        inv.quantity as inventory_cant,
        inv.apartados as inventory_apartados,
        u.username as allocated_by_name
      FROM ventas_pedido_embalaje_allocations pa
      JOIN ventas_pedido_items pi ON pa.pedido_item_id = pi.id
      JOIN embalaje_inventory inv ON pa.inventory_id = inv.id
      LEFT JOIN users u ON pa.allocated_by = u.id
      WHERE pa.pedido_id = $1
      ORDER BY pa.created_at DESC
    `, [id]);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error getting pedido embalaje allocations:', error);
    res.status(500).json({ error: 'Failed to get embalaje allocations', details: error.message });
  }
};

// Deallocate embalaje inventory from a pedido
export const deallocateEmbalajeInventory = async (req: Request, res: Response) => {
  const { id } = req.params; // allocation_id
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Delete allocation (trigger will automatically update apartados)
    const result = await client.query(`
      DELETE FROM ventas_pedido_embalaje_allocations
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      throw new Error('Embalaje allocation not found');
    }

    await client.query('COMMIT');
    res.json({ message: 'Embalaje allocation removed successfully', allocation: result.rows[0] });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error deallocating embalaje inventory:', error);
    res.status(400).json({ error: 'Failed to deallocate embalaje inventory', details: error.message });
  } finally {
    client.release();
  }
};

// Handle pedido delivery for embalaje - subtract from both cant and apartados
export const handlePedidoEmbalajeDelivery = async (pedido_id: number, client: any, status?: string) => {
  // Get all embalaje allocations for this pedido
  const allocations = await client.query(`
    SELECT inventory_id, SUM(quantity_allocated) as total_allocated
    FROM ventas_pedido_embalaje_allocations
    WHERE pedido_id = $1
    GROUP BY inventory_id
  `, [pedido_id]);

  // For each inventory item, subtract from quantity
  for (const allocation of allocations.rows) {
    await client.query(`
      UPDATE embalaje_inventory
      SET
        quantity = quantity - $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND quantity >= $1
    `, [allocation.total_allocated, allocation.inventory_id]);
  }

  // Delete allocations (trigger will automatically recalculate apartados)
  await client.query(`
    DELETE FROM ventas_pedido_embalaje_allocations
    WHERE pedido_id = $1
  `, [pedido_id]);
};

// Handle pedido cancellation for embalaje - only remove apartados
export const handlePedidoEmbalajeCancellation = async (pedido_id: number, client: any) => {
  // Delete allocations (trigger will automatically update apartados)
  await client.query(`
    DELETE FROM ventas_pedido_embalaje_allocations
    WHERE pedido_id = $1
  `, [pedido_id]);
};
