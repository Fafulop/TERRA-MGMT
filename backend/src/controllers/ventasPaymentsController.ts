import { Request, Response } from 'express';
import pool from '../config/database';

// Get available payments (VENTAS MAYOREO movements not attached to any pedido)
export const getAvailablePayments = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        le.id,
        le.amount,
        le.concept,
        le.transaction_date,
        le.internal_id,
        le.bank_account,
        le.bank_movement_id,
        le.area,
        le.subarea,
        le.created_at,
        u.username,
        u.first_name,
        u.last_name
      FROM ledger_entries_mxn le
      LEFT JOIN users u ON le.user_id = u.id
      WHERE le.area = 'VENTAS'
        AND le.subarea = 'VENTAS MAYOREO'
        AND le.entry_type = 'income'
        AND le.id NOT IN (
          SELECT ledger_entry_id FROM ventas_pedido_payments
        )
      ORDER BY le.transaction_date DESC, le.created_at DESC
    `);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error getting available payments:', error);
    res.status(500).json({ error: 'Failed to get available payments', details: error.message });
  }
};

// Get payments attached to a specific pedido
export const getPedidoPayments = async (req: Request, res: Response) => {
  const { id } = req.params; // pedido_id

  try {
    const result = await pool.query(`
      SELECT
        vpp.id as attachment_id,
        vpp.attached_at,
        vpp.notes as attachment_notes,
        le.id as ledger_entry_id,
        le.amount,
        le.concept,
        le.transaction_date,
        le.internal_id,
        le.bank_account,
        le.bank_movement_id,
        le.created_at,
        u.username as attached_by_username,
        u.first_name as attached_by_first_name,
        u.last_name as attached_by_last_name,
        creator.username as created_by_username,
        creator.first_name as created_by_first_name,
        creator.last_name as created_by_last_name
      FROM ventas_pedido_payments vpp
      JOIN ledger_entries_mxn le ON vpp.ledger_entry_id = le.id
      LEFT JOIN users u ON vpp.attached_by = u.id
      LEFT JOIN users creator ON le.user_id = creator.id
      WHERE vpp.pedido_id = $1
      ORDER BY le.transaction_date DESC, vpp.attached_at DESC
    `, [id]);

    // Calculate totals
    const totalPaid = result.rows.reduce((sum, row) => sum + Number(row.amount), 0);

    res.json({
      payments: result.rows,
      totalPaid,
      paymentCount: result.rows.length
    });
  } catch (error: any) {
    console.error('Error getting pedido payments:', error);
    res.status(500).json({ error: 'Failed to get pedido payments', details: error.message });
  }
};

// Attach a payment to a pedido
export const attachPayment = async (req: Request, res: Response) => {
  const { pedido_id, ledger_entry_id, notes } = req.body;
  const userId = (req as any).user?.id;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify the ledger entry exists and is VENTAS MAYOREO income
    const ledgerCheck = await client.query(`
      SELECT id, amount, area, subarea, entry_type
      FROM ledger_entries_mxn
      WHERE id = $1
    `, [ledger_entry_id]);

    if (ledgerCheck.rows.length === 0) {
      throw new Error('Ledger entry not found');
    }

    const ledgerEntry = ledgerCheck.rows[0];
    if (ledgerEntry.area !== 'VENTAS' || ledgerEntry.subarea !== 'VENTAS MAYOREO') {
      throw new Error('Ledger entry is not from VENTAS MAYOREO area');
    }
    if (ledgerEntry.entry_type !== 'income') {
      throw new Error('Only income entries can be attached as payments');
    }

    // Check if already attached
    const existingAttachment = await client.query(`
      SELECT id FROM ventas_pedido_payments WHERE ledger_entry_id = $1
    `, [ledger_entry_id]);

    if (existingAttachment.rows.length > 0) {
      throw new Error('This payment is already attached to a pedido');
    }

    // Verify pedido exists
    const pedidoCheck = await client.query(`
      SELECT id, total FROM ventas_pedidos WHERE id = $1
    `, [pedido_id]);

    if (pedidoCheck.rows.length === 0) {
      throw new Error('Pedido not found');
    }

    // Create the attachment
    const result = await client.query(`
      INSERT INTO ventas_pedido_payments (pedido_id, ledger_entry_id, attached_by, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [pedido_id, ledger_entry_id, userId, notes || null]);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Payment attached successfully',
      attachment: result.rows[0]
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error attaching payment:', error);
    res.status(400).json({ error: 'Failed to attach payment', details: error.message });
  } finally {
    client.release();
  }
};

// Detach a payment from a pedido
export const detachPayment = async (req: Request, res: Response) => {
  const { id } = req.params; // attachment_id

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get the attachment to verify it exists
    const attachmentCheck = await client.query(`
      SELECT id, pedido_id FROM ventas_pedido_payments WHERE id = $1
    `, [id]);

    if (attachmentCheck.rows.length === 0) {
      throw new Error('Payment attachment not found');
    }

    // Delete the attachment (trigger will recalculate pedido totals)
    await client.query(`
      DELETE FROM ventas_pedido_payments WHERE id = $1
    `, [id]);

    await client.query('COMMIT');

    res.json({ message: 'Payment detached successfully' });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error detaching payment:', error);
    res.status(400).json({ error: 'Failed to detach payment', details: error.message });
  } finally {
    client.release();
  }
};

// Get payment summary for a pedido
export const getPedidoPaymentSummary = async (req: Request, res: Response) => {
  const { id } = req.params; // pedido_id

  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.total,
        p.amount_paid,
        p.payment_status,
        (p.total - p.amount_paid) as amount_remaining,
        (SELECT COUNT(*) FROM ventas_pedido_payments WHERE pedido_id = p.id) as payment_count
      FROM ventas_pedidos p
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error getting payment summary:', error);
    res.status(500).json({ error: 'Failed to get payment summary', details: error.message });
  }
};
