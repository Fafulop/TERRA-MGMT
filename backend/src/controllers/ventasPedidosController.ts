import { Request, Response } from 'express';
import pool from '../config/database';
import { handlePedidoDelivery, handlePedidoCancellation } from './ventasInventoryController';

// Get all pedidos
export const getPedidos = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        p.*,
        u.username as created_by_name,
        COUNT(pi.id) as items_count
      FROM ventas_pedidos p
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN ventas_pedido_items pi ON p.id = pi.pedido_id
      GROUP BY p.id, u.username
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pedidos:', error);
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
      FROM ventas_pedidos p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = $1
    `, [id]);

    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido not found' });
    }

    const itemsResult = await pool.query(`
      SELECT * FROM ventas_pedido_items
      WHERE pedido_id = $1
      ORDER BY id ASC
    `, [id]);

    res.json({
      ...pedidoResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching pedido:', error);
    res.status(500).json({ error: 'Failed to fetch pedido' });
  }
};

// Create pedido from quotation
export const createPedido = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      quotation_id,
      expected_delivery_date,
      payment_method,
      notes,
    } = req.body;

    const userId = (req as any).userId;

    if (!quotation_id) {
      return res.status(400).json({ error: 'Quotation ID is required' });
    }

    // Get quotation details
    const quotationResult = await client.query(`
      SELECT * FROM ventas_quotations WHERE id = $1
    `, [quotation_id]);

    if (quotationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const quotation = quotationResult.rows[0];

    // Generate pedido number
    const pedidoNumberResult = await client.query(
      'SELECT generate_pedido_number() as pedido_number'
    );
    const pedido_number = pedidoNumberResult.rows[0].pedido_number;

    // Insert pedido
    const pedidoResult = await client.query(`
      INSERT INTO ventas_pedidos (
        pedido_number,
        quotation_id,
        quotation_number,
        customer_name,
        customer_email,
        customer_phone,
        customer_address,
        expected_delivery_date,
        payment_method,
        notes,
        terms,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      pedido_number,
      quotation_id,
      quotation.quotation_number,
      quotation.customer_name,
      quotation.customer_email,
      quotation.customer_phone,
      quotation.customer_address,
      expected_delivery_date || null,
      payment_method || null,
      notes || null,
      quotation.terms,
      userId,
    ]);

    const pedido = pedidoResult.rows[0];

    // Get quotation items
    const quotationItemsResult = await client.query(`
      SELECT * FROM ventas_quotation_items WHERE quotation_id = $1
    `, [quotation_id]);

    // Insert pedido items (copy from quotation items)
    for (const item of quotationItemsResult.rows) {
      await client.query(`
        INSERT INTO ventas_pedido_items (
          pedido_id,
          product_id,
          product_name,
          tipo_name,
          size_cm,
          capacity_ml,
          esmalte_color_id,
          esmalte_color,
          esmalte_hex_code,
          quantity,
          unit_price,
          discount_percentage,
          tax_percentage,
          notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        pedido.id,
        item.product_id,
        item.product_name,
        item.tipo_name,
        item.size_cm,
        item.capacity_ml,
        item.esmalte_color_id,
        item.esmalte_color,
        item.esmalte_hex_code,
        item.quantity,
        item.unit_price,
        item.discount_percentage,
        item.tax_percentage,
        item.notes,
      ]);
    }

    await client.query('COMMIT');
    res.status(201).json(pedido);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating pedido:', error);
    res.status(500).json({ error: 'Failed to create pedido', details: (error as Error).message });
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

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'DELIVERED', 'ENTREGADO_Y_PAGADO', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get current status
    const currentResult = await client.query(
      'SELECT status FROM ventas_pedidos WHERE id = $1',
      [id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido not found' });
    }

    const currentStatus = currentResult.rows[0].status;

    // Handle inventory changes based on status transition
    if ((status === 'DELIVERED' || status === 'ENTREGADO_Y_PAGADO') &&
        (currentStatus !== 'DELIVERED' && currentStatus !== 'ENTREGADO_Y_PAGADO')) {
      // Subtract inventory: both cant and apartados
      // If ENTREGADO_Y_PAGADO, also add to vendidos
      await handlePedidoDelivery(parseInt(id), client, status);

      // Set actual delivery date
      await client.query(`
        UPDATE ventas_pedidos
        SET actual_delivery_date = CURRENT_DATE
        WHERE id = $1
      `, [id]);
    } else if (status === 'CANCELLED' && currentStatus !== 'CANCELLED') {
      // Release allocations: remove apartados only
      await handlePedidoCancellation(parseInt(id), client);
    }

    // Update pedido status
    const result = await client.query(`
      UPDATE ventas_pedidos
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [status, id]);

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating pedido status:', error);
    res.status(500).json({ error: 'Failed to update pedido status', details: (error as Error).message });
  } finally {
    client.release();
  }
};

// Delete pedido
export const deletePedido = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM ventas_pedidos WHERE id = $1', [id]);
    res.json({ message: 'Pedido deleted successfully' });
  } catch (error) {
    console.error('Error deleting pedido:', error);
    res.status(500).json({ error: 'Failed to delete pedido' });
  }
};
