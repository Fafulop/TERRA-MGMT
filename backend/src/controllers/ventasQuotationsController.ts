import { Request, Response } from 'express';
import pool from '../config/database';

// Get all quotations
export const getQuotations = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        q.*,
        u.username as created_by_name,
        COUNT(qi.id) as items_count
      FROM ventas_quotations q
      LEFT JOIN users u ON q.created_by = u.id
      LEFT JOIN ventas_quotation_items qi ON q.id = qi.quotation_id
      GROUP BY q.id, u.username
      ORDER BY q.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching quotations:', error);
    res.status(500).json({ error: 'Failed to fetch quotations' });
  }
};

// Get single quotation with items
export const getQuotation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const quotationResult = await pool.query(`
      SELECT
        q.*,
        u.username as created_by_name
      FROM ventas_quotations q
      LEFT JOIN users u ON q.created_by = u.id
      WHERE q.id = $1
    `, [id]);

    if (quotationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const itemsResult = await pool.query(`
      SELECT * FROM ventas_quotation_items
      WHERE quotation_id = $1
      ORDER BY id ASC
    `, [id]);

    res.json({
      ...quotationResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching quotation:', error);
    res.status(500).json({ error: 'Failed to fetch quotation' });
  }
};

// Create quotation
export const createQuotation = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      valid_until,
      notes,
      terms,
      items,
    } = req.body;

    const userId = (req as any).userId;

    if (!customer_name) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    // Generate quotation number
    const quotationNumberResult = await client.query(
      'SELECT generate_quotation_number() as quotation_number'
    );
    const quotation_number = quotationNumberResult.rows[0].quotation_number;

    // Insert quotation
    const quotationResult = await client.query(`
      INSERT INTO ventas_quotations (
        quotation_number,
        customer_name,
        customer_email,
        customer_phone,
        customer_address,
        valid_until,
        notes,
        terms,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      quotation_number,
      customer_name,
      customer_email || null,
      customer_phone || null,
      customer_address || null,
      valid_until || null,
      notes || null,
      terms || null,
      userId,
    ]);

    const quotation = quotationResult.rows[0];

    // Insert items
    for (const item of items) {
      const productResult = await client.query(`
        SELECT p.name, t.name as tipo_name
        FROM produccion_products p
        LEFT JOIN produccion_tipo t ON p.tipo_id = t.id
        WHERE p.id = $1
      `, [item.product_id]);

      if (productResult.rows.length === 0) {
        throw new Error(`Product ${item.product_id} not found`);
      }

      const product = productResult.rows[0];

      await client.query(`
        INSERT INTO ventas_quotation_items (
          quotation_id,
          product_id,
          product_name,
          tipo_name,
          quantity,
          unit_price,
          discount_percentage,
          tax_percentage,
          notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        quotation.id,
        item.product_id,
        product.name,
        product.tipo_name,
        item.quantity,
        item.unit_price,
        item.discount_percentage || 0,
        item.tax_percentage || 16,
        item.notes || null,
      ]);
    }

    await client.query('COMMIT');
    res.status(201).json(quotation);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating quotation:', error);
    res.status(500).json({ error: 'Failed to create quotation', details: (error as Error).message });
  } finally {
    client.release();
  }
};

// Update quotation
export const updateQuotation = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const {
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      valid_until,
      notes,
      terms,
      items,
    } = req.body;

    if (!customer_name) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    // Update quotation
    await client.query(`
      UPDATE ventas_quotations
      SET
        customer_name = $1,
        customer_email = $2,
        customer_phone = $3,
        customer_address = $4,
        valid_until = $5,
        notes = $6,
        terms = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
    `, [
      customer_name,
      customer_email || null,
      customer_phone || null,
      customer_address || null,
      valid_until || null,
      notes || null,
      terms || null,
      id,
    ]);

    // Delete existing items
    await client.query('DELETE FROM ventas_quotation_items WHERE quotation_id = $1', [id]);

    // Insert new items
    for (const item of items) {
      const productResult = await client.query(`
        SELECT p.name, t.name as tipo_name
        FROM produccion_products p
        LEFT JOIN produccion_tipo t ON p.tipo_id = t.id
        WHERE p.id = $1
      `, [item.product_id]);

      if (productResult.rows.length === 0) {
        throw new Error(`Product ${item.product_id} not found`);
      }

      const product = productResult.rows[0];

      await client.query(`
        INSERT INTO ventas_quotation_items (
          quotation_id,
          product_id,
          product_name,
          tipo_name,
          quantity,
          unit_price,
          discount_percentage,
          tax_percentage,
          notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        id,
        item.product_id,
        product.name,
        product.tipo_name,
        item.quantity,
        item.unit_price,
        item.discount_percentage || 0,
        item.tax_percentage || 16,
        item.notes || null,
      ]);
    }

    await client.query('COMMIT');

    // Fetch updated quotation
    const updatedResult = await client.query(`
      SELECT
        q.*,
        u.username as created_by_name
      FROM ventas_quotations q
      LEFT JOIN users u ON q.created_by = u.id
      WHERE q.id = $1
    `, [id]);

    res.json(updatedResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating quotation:', error);
    res.status(500).json({ error: 'Failed to update quotation', details: (error as Error).message });
  } finally {
    client.release();
  }
};

// Delete quotation
export const deleteQuotation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM ventas_quotations WHERE id = $1', [id]);
    res.json({ message: 'Quotation deleted successfully' });
  } catch (error) {
    console.error('Error deleting quotation:', error);
    res.status(500).json({ error: 'Failed to delete quotation' });
  }
};
