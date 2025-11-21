import { Request, Response } from 'express';
import pool from '../config/database';

// Get all pedidos
export const getPedidos = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        p.*,
        u.username as created_by_name,
        COUNT(pi.id) as items_count,
        COALESCE(SUM(pi.quantity), 0) as total_kits
      FROM ecommerce_pedidos p
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN ecommerce_pedido_items pi ON p.id = pi.pedido_id
      GROUP BY p.id, u.username
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching ecommerce pedidos:', error);
    res.status(500).json({ error: 'Failed to fetch pedidos' });
  }
};

// Get single pedido with items
export const getPedido = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const pedidoResult = await pool.query(`
      SELECT
        p.*,
        u.username as created_by_name
      FROM ecommerce_pedidos p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = $1
    `, [id]);

    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido not found' });
    }

    const itemsResult = await pool.query(`
      SELECT
        pi.*,
        k.current_stock as kit_current_stock
      FROM ecommerce_pedido_items pi
      LEFT JOIN ecommerce_kits k ON pi.kit_id = k.id
      WHERE pi.pedido_id = $1
      ORDER BY pi.id ASC
    `, [id]);

    res.json({
      ...pedidoResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching ecommerce pedido:', error);
    res.status(500).json({ error: 'Failed to fetch pedido' });
  }
};

// Create pedido
export const createPedido = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      shipping_cost,
      discount,
      payment_method,
      notes,
      items,
    } = req.body;

    const userId = (req as any).userId;

    if (!customer_name) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'At least one kit is required' });
    }

    // Validate kit stock availability
    for (const item of items) {
      const kitResult = await client.query(
        'SELECT id, name, current_stock, price FROM ecommerce_kits WHERE id = $1',
        [item.kit_id]
      );

      if (kitResult.rows.length === 0) {
        throw new Error(`Kit ${item.kit_id} not found`);
      }

      const kit = kitResult.rows[0];
      if (kit.current_stock < item.quantity) {
        throw new Error(
          `Insufficient stock for kit "${kit.name}". Available: ${kit.current_stock}, Requested: ${item.quantity}`
        );
      }
    }

    // Generate pedido number
    const pedidoNumberResult = await client.query(
      'SELECT generate_ecommerce_pedido_number() as pedido_number'
    );
    const pedido_number = pedidoNumberResult.rows[0].pedido_number;

    // Insert pedido
    const pedidoResult = await client.query(`
      INSERT INTO ecommerce_pedidos (
        pedido_number,
        customer_name,
        customer_email,
        customer_phone,
        customer_address,
        shipping_cost,
        discount,
        payment_method,
        notes,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      pedido_number,
      customer_name,
      customer_email || null,
      customer_phone || null,
      customer_address || null,
      shipping_cost || 0,
      discount || 0,
      payment_method || null,
      notes || null,
      userId,
    ]);

    const pedido = pedidoResult.rows[0];

    // Insert items and deduct from kit stock
    for (const item of items) {
      const kitResult = await client.query(
        'SELECT name, sku, price FROM ecommerce_kits WHERE id = $1',
        [item.kit_id]
      );
      const kit = kitResult.rows[0];

      // Insert pedido item
      await client.query(`
        INSERT INTO ecommerce_pedido_items (
          pedido_id,
          kit_id,
          kit_name,
          kit_sku,
          quantity,
          unit_price
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        pedido.id,
        item.kit_id,
        kit.name,
        kit.sku,
        item.quantity,
        item.unit_price || kit.price,
      ]);

      // Deduct from kit stock (NOT from apartados - already reserved)
      await client.query(`
        UPDATE ecommerce_kits
        SET current_stock = current_stock - $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [item.quantity, item.kit_id]);
    }

    await client.query('COMMIT');

    // Fetch complete pedido
    const completeResult = await client.query(`
      SELECT p.*, u.username as created_by_name
      FROM ecommerce_pedidos p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = $1
    `, [pedido.id]);

    res.status(201).json(completeResult.rows[0]);
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error creating ecommerce pedido:', error);
    res.status(500).json({ error: 'Failed to create pedido', details: error.message });
  } finally {
    client.release();
  }
};

// Update pedido status
export const updatePedidoStatus = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'ENTREGADO_Y_PAGADO', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get current pedido
    const pedidoResult = await client.query(
      'SELECT status FROM ecommerce_pedidos WHERE id = $1',
      [id]
    );

    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido not found' });
    }

    const currentStatus = pedidoResult.rows[0].status;

    // If cancelling, return stock to kits
    if (status === 'CANCELLED' && currentStatus !== 'CANCELLED') {
      const itemsResult = await client.query(
        'SELECT kit_id, quantity FROM ecommerce_pedido_items WHERE pedido_id = $1',
        [id]
      );

      for (const item of itemsResult.rows) {
        await client.query(`
          UPDATE ecommerce_kits
          SET current_stock = current_stock + $1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [item.quantity, item.kit_id]);
      }
    }

    // If un-cancelling (shouldn't happen often but handle it)
    if (currentStatus === 'CANCELLED' && status !== 'CANCELLED') {
      // Re-deduct stock
      const itemsResult = await client.query(
        'SELECT kit_id, quantity FROM ecommerce_pedido_items WHERE pedido_id = $1',
        [id]
      );

      for (const item of itemsResult.rows) {
        // Check stock availability
        const kitResult = await client.query(
          'SELECT current_stock, name FROM ecommerce_kits WHERE id = $1',
          [item.kit_id]
        );
        const kit = kitResult.rows[0];

        if (kit.current_stock < item.quantity) {
          throw new Error(
            `Cannot un-cancel: insufficient stock for "${kit.name}". Available: ${kit.current_stock}, Required: ${item.quantity}`
          );
        }

        await client.query(`
          UPDATE ecommerce_kits
          SET current_stock = current_stock - $1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [item.quantity, item.kit_id]);
      }
    }

    // If marking as ENTREGADO_Y_PAGADO, update produccion inventory (VENDIDOS)
    if (status === 'ENTREGADO_Y_PAGADO' && currentStatus !== 'ENTREGADO_Y_PAGADO') {
      // Get all kits in this pedido
      const pedidoItemsResult = await client.query(
        'SELECT kit_id, quantity FROM ecommerce_pedido_items WHERE pedido_id = $1',
        [id]
      );

      for (const pedidoItem of pedidoItemsResult.rows) {
        // Get all products in this kit
        const kitItemsResult = await client.query(
          'SELECT product_id, esmalte_color_id, quantity FROM ecommerce_kit_items WHERE kit_id = $1',
          [pedidoItem.kit_id]
        );

        for (const kitItem of kitItemsResult.rows) {
          const totalQuantity = pedidoItem.quantity * kitItem.quantity;

          // Update produccion_inventory: subtract from quantity and apartados, add to vendidos
          await client.query(`
            UPDATE produccion_inventory
            SET
              quantity = quantity - $1,
              apartados = apartados - $1,
              vendidos = COALESCE(vendidos, 0) + $1,
              updated_at = CURRENT_TIMESTAMP
            WHERE product_id = $2
              AND stage = 'ESMALTADO'
              AND (esmalte_color_id = $3 OR (esmalte_color_id IS NULL AND $3 IS NULL))
          `, [totalQuantity, kitItem.product_id, kitItem.esmalte_color_id]);
        }
      }
    }

    // Update status and relevant date
    let dateUpdate = '';
    if (status === 'SHIPPED') {
      dateUpdate = ', shipped_date = CURRENT_DATE';
    } else if (status === 'DELIVERED') {
      dateUpdate = ', delivered_date = CURRENT_DATE';
    }

    await client.query(`
      UPDATE ecommerce_pedidos
      SET status = $1, updated_at = CURRENT_TIMESTAMP ${dateUpdate}
      WHERE id = $2
    `, [status, id]);

    await client.query('COMMIT');

    // Fetch updated pedido
    const updatedResult = await client.query(`
      SELECT p.*, u.username as created_by_name
      FROM ecommerce_pedidos p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = $1
    `, [id]);

    res.json(updatedResult.rows[0]);
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error updating pedido status:', error);
    res.status(500).json({ error: 'Failed to update status', details: error.message });
  } finally {
    client.release();
  }
};

// Update pedido details (customer info, notes, etc.)
export const updatePedido = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      shipping_cost,
      discount,
      payment_method,
      payment_status,
      notes,
      tracking_number,
    } = req.body;

    await pool.query(`
      UPDATE ecommerce_pedidos
      SET
        customer_name = COALESCE($1, customer_name),
        customer_email = $2,
        customer_phone = $3,
        customer_address = $4,
        shipping_cost = COALESCE($5, shipping_cost),
        discount = COALESCE($6, discount),
        payment_method = $7,
        payment_status = COALESCE($8, payment_status),
        notes = $9,
        tracking_number = $10,
        total = subtotal + COALESCE($5, shipping_cost) - COALESCE($6, discount),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
    `, [
      customer_name,
      customer_email || null,
      customer_phone || null,
      customer_address || null,
      shipping_cost,
      discount,
      payment_method || null,
      payment_status,
      notes || null,
      tracking_number || null,
      id,
    ]);

    const result = await pool.query(`
      SELECT p.*, u.username as created_by_name
      FROM ecommerce_pedidos p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = $1
    `, [id]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating pedido:', error);
    res.status(500).json({ error: 'Failed to update pedido' });
  }
};

// Delete pedido (only if PENDING or CANCELLED)
export const deletePedido = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;

    const pedidoResult = await client.query(
      'SELECT status FROM ecommerce_pedidos WHERE id = $1',
      [id]
    );

    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido not found' });
    }

    const status = pedidoResult.rows[0].status;

    // If not cancelled, return stock first
    if (status !== 'CANCELLED') {
      const itemsResult = await client.query(
        'SELECT kit_id, quantity FROM ecommerce_pedido_items WHERE pedido_id = $1',
        [id]
      );

      for (const item of itemsResult.rows) {
        await client.query(`
          UPDATE ecommerce_kits
          SET current_stock = current_stock + $1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [item.quantity, item.kit_id]);
      }
    }

    await client.query('DELETE FROM ecommerce_pedidos WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({ message: 'Pedido deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting pedido:', error);
    res.status(500).json({ error: 'Failed to delete pedido' });
  } finally {
    client.release();
  }
};
