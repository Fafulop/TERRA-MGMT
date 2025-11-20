import { Request, Response } from 'express';
import pool from '../config/database';

// Get all quotes with filters
export const getQuotes = async (req: Request, res: Response) => {
  try {
    const { status, customer_id, from_date, to_date, currency } = req.query;

    let query = `
      SELECT
        q.*,
        COALESCE(q.customer_name, c.name) as customer_name,
        COALESCE(q.customer_company, c.company) as customer_company,
        COALESCE(q.customer_email, c.email) as customer_email,
        COALESCE(q.customer_phone, c.phone) as customer_phone,
        u.username as created_by_name,
        u2.username as updated_by_name,
        COUNT(qi.id) as items_count
      FROM ventas_quotes q
      LEFT JOIN contacts c ON q.customer_id = c.id
      LEFT JOIN users u ON q.created_by = u.id
      LEFT JOIN users u2 ON q.updated_by = u2.id
      LEFT JOIN ventas_quote_items qi ON q.id = qi.quote_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND q.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (customer_id) {
      query += ` AND q.customer_id = $${paramIndex}`;
      params.push(customer_id);
      paramIndex++;
    }

    if (currency) {
      query += ` AND q.currency = $${paramIndex}`;
      params.push(currency);
      paramIndex++;
    }

    if (from_date) {
      query += ` AND q.created_at >= $${paramIndex}`;
      params.push(from_date);
      paramIndex++;
    }

    if (to_date) {
      query += ` AND q.created_at <= $${paramIndex}`;
      params.push(to_date);
      paramIndex++;
    }

    query += `
      GROUP BY q.id, c.id, u.id, u2.id
      ORDER BY q.created_at DESC
    `;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
};

// Get single quote with items
export const getQuote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get quote details
    const quoteResult = await pool.query(`
      SELECT
        q.*,
        COALESCE(q.customer_name, c.name) as customer_name,
        COALESCE(q.customer_company, c.company) as customer_company,
        COALESCE(q.customer_email, c.email) as customer_email,
        COALESCE(q.customer_phone, c.phone) as customer_phone,
        COALESCE(q.customer_address, c.address) as customer_address,
        c.city as customer_city,
        c.state as customer_state,
        c.postal_code as customer_postal_code,
        u.username as created_by_name,
        u2.username as updated_by_name
      FROM ventas_quotes q
      LEFT JOIN contacts c ON q.customer_id = c.id
      LEFT JOIN users u ON q.created_by = u.id
      LEFT JOIN users u2 ON q.updated_by = u2.id
      WHERE q.id = $1
    `, [id]);

    if (quoteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Get quote items
    const itemsResult = await pool.query(`
      SELECT
        qi.*,
        p.id as product_current_id,
        p.name as product_current_name
      FROM ventas_quote_items qi
      LEFT JOIN produccion_products p ON qi.product_id = p.id
      WHERE qi.quote_id = $1
      ORDER BY qi.id ASC
    `, [id]);

    const quote = {
      ...quoteResult.rows[0],
      items: itemsResult.rows
    };

    res.json(quote);
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
};

// Create new quote
export const createQuote = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('Create quote - Request body:', JSON.stringify(req.body, null, 2));

    const {
      customer_id,
      customer_name,
      customer_company,
      customer_email,
      customer_phone,
      customer_address,
      valid_until,
      discount_percentage,
      discount_amount,
      currency,
      notes,
      terms_and_conditions,
      internal_notes,
      items
    } = req.body;

    const userId = (req as any).userId;
    console.log('User ID from auth:', userId);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Either customer_id or customer_name must be provided
    if (!customer_id && !customer_name) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    // Generate quote number
    const quoteNumberResult = await client.query('SELECT generate_quote_number() as quote_number');
    const quote_number = quoteNumberResult.rows[0].quote_number;

    // Insert quote
    const quoteResult = await client.query(`
      INSERT INTO ventas_quotes (
        quote_number,
        customer_id,
        customer_name,
        customer_company,
        customer_email,
        customer_phone,
        customer_address,
        valid_until,
        discount_percentage,
        discount_amount,
        currency,
        notes,
        terms_and_conditions,
        internal_notes,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      quote_number,
      customer_id || null,
      customer_name || null,
      customer_company || null,
      customer_email || null,
      customer_phone || null,
      customer_address || null,
      valid_until || null,
      discount_percentage || 0,
      discount_amount || 0,
      'MXN', // Always MXN
      notes || null,
      terms_and_conditions || null,
      internal_notes || null,
      userId
    ]);

    const quote = quoteResult.rows[0];

    // Insert quote items
    for (const item of items) {
      // Get product details for snapshot
      const productResult = await client.query(`
        SELECT
          p.name,
          t.name as tipo_name,
          s.size_cm,
          c.capacity_ml,
          e.color as esmalte_color
        FROM produccion_products p
        LEFT JOIN produccion_tipo t ON p.tipo_id = t.id
        LEFT JOIN produccion_size s ON p.size_id = s.id
        LEFT JOIN produccion_capacity c ON p.capacity_id = c.id
        LEFT JOIN produccion_esmalte_color e ON p.esmalte_color_id = e.id
        WHERE p.id = $1
      `, [item.product_id]);

      if (productResult.rows.length === 0) {
        throw new Error(`Product ${item.product_id} not found`);
      }

      const product = productResult.rows[0];

      await client.query(`
        INSERT INTO ventas_quote_items (
          quote_id,
          product_id,
          quantity,
          unit_price,
          discount_percentage,
          product_name,
          product_tipo,
          product_size,
          product_capacity,
          product_color,
          notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        quote.id,
        item.product_id,
        item.quantity,
        item.unit_price,
        item.discount_percentage || 0,
        product.name,
        product.tipo_name,
        product.size_cm ? `${product.size_cm} cm` : null,
        product.capacity_ml ? `${product.capacity_ml} ml` : null,
        product.esmalte_color,
        item.notes || null
      ]);
    }

    // Recalculate totals
    await client.query('SELECT calculate_quote_totals($1)', [quote.id]);

    await client.query('COMMIT');

    // Fetch the complete quote
    const completeQuoteResult = await client.query(`
      SELECT
        q.*,
        c.name as customer_name,
        c.company as customer_company
      FROM ventas_quotes q
      LEFT JOIN contacts c ON q.customer_id = c.id
      WHERE q.id = $1
    `, [quote.id]);

    res.status(201).json(completeQuoteResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating quote:', error);
    res.status(500).json({ error: 'Failed to create quote', details: (error as Error).message });
  } finally {
    client.release();
  }
};

// Update quote
export const updateQuote = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const userId = (req as any).userId;

    // Check if quote exists and is editable
    const existingQuoteResult = await client.query(
      'SELECT status FROM ventas_quotes WHERE id = $1',
      [id]
    );

    if (existingQuoteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    const currentStatus = existingQuoteResult.rows[0].status;

    // Only DRAFT quotes can be fully edited
    if (currentStatus !== 'DRAFT') {
      return res.status(400).json({ error: 'Only DRAFT quotes can be edited' });
    }

    const {
      customer_id,
      customer_name,
      customer_company,
      customer_email,
      customer_phone,
      customer_address,
      valid_until,
      discount_percentage,
      discount_amount,
      currency,
      notes,
      terms_and_conditions,
      internal_notes,
      items
    } = req.body;

    // Update quote
    await client.query(`
      UPDATE ventas_quotes
      SET
        customer_id = COALESCE($1, customer_id),
        customer_name = $2,
        customer_company = $3,
        customer_email = $4,
        customer_phone = $5,
        customer_address = $6,
        valid_until = $7,
        discount_percentage = COALESCE($8, discount_percentage),
        discount_amount = COALESCE($9, discount_amount),
        currency = 'MXN',
        notes = $10,
        terms_and_conditions = $11,
        internal_notes = $12,
        updated_by = $13,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
    `, [
      customer_id,
      customer_name,
      customer_company,
      customer_email,
      customer_phone,
      customer_address,
      valid_until,
      discount_percentage,
      discount_amount,
      notes,
      terms_and_conditions,
      internal_notes,
      userId,
      id
    ]);

    // If items provided, replace all items
    if (items && Array.isArray(items)) {
      // Delete existing items
      await client.query('DELETE FROM ventas_quote_items WHERE quote_id = $1', [id]);

      // Insert new items
      for (const item of items) {
        const productResult = await client.query(`
          SELECT
            p.name,
            t.name as tipo_name,
            s.size_cm,
            c.capacity_ml,
            e.color as esmalte_color
          FROM produccion_products p
          LEFT JOIN produccion_tipo t ON p.tipo_id = t.id
          LEFT JOIN produccion_size s ON p.size_id = s.id
          LEFT JOIN produccion_capacity c ON p.capacity_id = c.id
          LEFT JOIN produccion_esmalte_color e ON p.esmalte_color_id = e.id
          WHERE p.id = $1
        `, [item.product_id]);

        if (productResult.rows.length === 0) {
          throw new Error(`Product ${item.product_id} not found`);
        }

        const product = productResult.rows[0];

        await client.query(`
          INSERT INTO ventas_quote_items (
            quote_id,
            product_id,
            quantity,
            unit_price,
            discount_percentage,
            product_name,
            product_tipo,
            product_size,
            product_capacity,
            product_color,
            notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          id,
          item.product_id,
          item.quantity,
          item.unit_price,
          item.discount_percentage || 0,
          product.name,
          product.tipo_name,
          product.size_cm ? `${product.size_cm} cm` : null,
          product.capacity_ml ? `${product.capacity_ml} ml` : null,
          product.esmalte_color,
          item.notes || null
        ]);
      }

      // Recalculate totals
      await client.query('SELECT calculate_quote_totals($1)', [id]);
    }

    await client.query('COMMIT');

    // Fetch updated quote
    const updatedQuoteResult = await client.query(`
      SELECT
        q.*,
        COALESCE(q.customer_name, c.name) as customer_name,
        COALESCE(q.customer_company, c.company) as customer_company
      FROM ventas_quotes q
      LEFT JOIN contacts c ON q.customer_id = c.id
      WHERE q.id = $1
    `, [id]);

    res.json(updatedQuoteResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating quote:', error);
    res.status(500).json({ error: 'Failed to update quote', details: (error as Error).message });
  } finally {
    client.release();
  }
};

// Delete quote
export const deleteQuote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if quote exists and is deletable
    const quoteResult = await pool.query(
      'SELECT status FROM ventas_quotes WHERE id = $1',
      [id]
    );

    if (quoteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    const status = quoteResult.rows[0].status;

    // Only DRAFT or REJECTED quotes can be deleted
    if (status !== 'DRAFT' && status !== 'REJECTED') {
      return res.status(400).json({ error: 'Only DRAFT or REJECTED quotes can be deleted' });
    }

    await pool.query('DELETE FROM ventas_quotes WHERE id = $1', [id]);

    res.json({ message: 'Quote deleted successfully' });
  } catch (error) {
    console.error('Error deleting quote:', error);
    res.status(500).json({ error: 'Failed to delete quote' });
  }
};

// Update quote status
export const updateQuoteStatus = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { status } = req.body;
    const userId = (req as any).userId;

    const validStatuses = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED_TO_ORDER'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get current quote
    const quoteResult = await client.query(
      'SELECT status FROM ventas_quotes WHERE id = $1',
      [id]
    );

    if (quoteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    let updateFields = 'status = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP';
    const params: any[] = [status, userId];
    let paramIndex = 3;

    // Set timestamp fields based on status
    if (status === 'SENT') {
      updateFields += `, sent_at = CURRENT_TIMESTAMP`;
    } else if (status === 'ACCEPTED') {
      updateFields += `, accepted_at = CURRENT_TIMESTAMP`;
    } else if (status === 'REJECTED') {
      updateFields += `, rejected_at = CURRENT_TIMESTAMP`;
    }

    params.push(id);

    await client.query(`
      UPDATE ventas_quotes
      SET ${updateFields}
      WHERE id = $${paramIndex}
    `, params);

    await client.query('COMMIT');

    // Fetch updated quote
    const updatedQuoteResult = await client.query(`
      SELECT
        q.*,
        COALESCE(q.customer_name, c.name) as customer_name,
        COALESCE(q.customer_company, c.company) as customer_company
      FROM ventas_quotes q
      LEFT JOIN contacts c ON q.customer_id = c.id
      WHERE q.id = $1
    `, [id]);

    res.json(updatedQuoteResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating quote status:', error);
    res.status(500).json({ error: 'Failed to update quote status' });
  } finally {
    client.release();
  }
};

// Get quote statistics/summary
export const getQuotesSummary = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        status,
        currency,
        COUNT(*) as count,
        SUM(total) as total_amount
      FROM ventas_quotes
      GROUP BY status, currency
      ORDER BY status, currency
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching quotes summary:', error);
    res.status(500).json({ error: 'Failed to fetch quotes summary' });
  }
};
