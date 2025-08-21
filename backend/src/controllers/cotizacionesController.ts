import { Request, Response } from 'express';
import { Pool } from 'pg';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Generate unique internal ID for cotizaciones entries
const generateInternalId = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `COT-${timestamp}-${random}`;
};

// Get all cotizaciones entries with filtering and pagination
export const getCotizacionesEntries = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const {
      currency,
      entry_type,
      bank_account,
      start_date,
      end_date,
      search,
      limit = '50',
      offset = '0'
    } = req.query;

    let query = `
      SELECT 
        ce.*,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', ca.id,
              'fileName', ca.file_name,
              'fileUrl', ca.file_url,
              'fileSize', ca.file_size,
              'fileType', ca.file_type,
              'attachmentType', ca.attachment_type,
              'urlTitle', ca.url_title,
              'createdAt', ca.created_at
            )
          ) FILTER (WHERE ca.id IS NOT NULL), 
          '[]'
        ) as attachments
      FROM cotizaciones_entries ce
      LEFT JOIN cotizaciones_attachments ca ON ce.id = ca.cotizacion_entry_id
      WHERE ce.user_id = $1
    `;

    const params: any[] = [userId];
    let paramCount = 1;

    // Add filters
    if (currency) {
      paramCount++;
      query += ` AND ce.currency = $${paramCount}`;
      params.push(currency as string);
    }

    if (entry_type) {
      paramCount++;
      query += ` AND ce.entry_type = $${paramCount}`;
      params.push(entry_type as string);
    }

    if (bank_account) {
      paramCount++;
      query += ` AND ce.bank_account ILIKE $${paramCount}`;
      params.push(`%${bank_account}%`);
    }

    if (start_date) {
      paramCount++;
      query += ` AND ce.transaction_date >= $${paramCount}`;
      params.push(start_date as string);
    }

    if (end_date) {
      paramCount++;
      query += ` AND ce.transaction_date <= $${paramCount}`;
      params.push(end_date as string);
    }

    if (search) {
      paramCount++;
      query += ` AND (ce.concept ILIKE $${paramCount} OR ce.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += `
      GROUP BY ce.id
      ORDER BY ce.transaction_date DESC, ce.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    params.push(limit, offset);

    // Execute main query
    const result = await db.query(query, params);

    // Get summary data
    let summaryQuery = `
      SELECT 
        currency,
        SUM(CASE WHEN entry_type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN entry_type = 'expense' THEN ABS(amount) ELSE 0 END) as total_expenses,
        SUM(CASE WHEN entry_type = 'income' THEN amount ELSE -ABS(amount) END) as net_cash_flow,
        COUNT(*) as total_entries
      FROM cotizaciones_entries 
      WHERE user_id = $1
    `;

    const summaryParams: any[] = [userId];
    let summaryParamCount = 1;

    // Apply same filters to summary
    if (currency) {
      summaryParamCount++;
      summaryQuery += ` AND currency = $${summaryParamCount}`;
      summaryParams.push(currency as string);
    }

    if (entry_type) {
      summaryParamCount++;
      summaryQuery += ` AND entry_type = $${summaryParamCount}`;
      summaryParams.push(entry_type as string);
    }

    if (bank_account) {
      summaryParamCount++;
      summaryQuery += ` AND bank_account ILIKE $${summaryParamCount}`;
      summaryParams.push(`%${bank_account}%`);
    }

    if (start_date) {
      summaryParamCount++;
      summaryQuery += ` AND transaction_date >= $${summaryParamCount}`;
      summaryParams.push(start_date as string);
    }

    if (end_date) {
      summaryParamCount++;
      summaryQuery += ` AND transaction_date <= $${summaryParamCount}`;
      summaryParams.push(end_date as string);
    }

    if (search) {
      summaryParamCount++;
      summaryQuery += ` AND (concept ILIKE $${summaryParamCount} OR description ILIKE $${summaryParamCount})`;
      summaryParams.push(`%${search}%`);
    }

    summaryQuery += ` GROUP BY currency`;

    const summaryResult = await db.query(summaryQuery, summaryParams);

    // Aggregate summary by currency
    const summary = summaryResult.rows.reduce((acc, row) => {
      acc[row.currency] = {
        total_income: parseFloat(row.total_income) || 0,
        total_expenses: parseFloat(row.total_expenses) || 0,
        net_cash_flow: parseFloat(row.net_cash_flow) || 0,
        total_entries: parseInt(row.total_entries) || 0
      };
      return acc;
    }, {});

    res.json({
      entries: result.rows,
      summary,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: result.rows.length === parseInt(limit as string)
      }
    });

  } catch (error) {
    console.error('Error fetching cotizaciones entries:', error);
    res.status(500).json({ 
      error: 'Failed to fetch cotizaciones entries',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get a single cotizaciones entry with attachments
export const getCotizacionesEntry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const entryId = parseInt(req.params.id);

    if (isNaN(entryId)) {
      return res.status(400).json({ error: 'Invalid entry ID' });
    }

    const query = `
      SELECT 
        ce.*,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', ca.id,
              'fileName', ca.file_name,
              'fileUrl', ca.file_url,
              'fileSize', ca.file_size,
              'fileType', ca.file_type,
              'attachmentType', ca.attachment_type,
              'urlTitle', ca.url_title,
              'createdAt', ca.created_at
            )
          ) FILTER (WHERE ca.id IS NOT NULL), 
          '[]'
        ) as attachments
      FROM cotizaciones_entries ce
      LEFT JOIN cotizaciones_attachments ca ON ce.id = ca.cotizacion_entry_id
      WHERE ce.id = $1 AND ce.user_id = $2
      GROUP BY ce.id
    `;

    const result = await db.query(query, [entryId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cotizaciones entry not found' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error fetching cotizaciones entry:', error);
    res.status(500).json({ 
      error: 'Failed to fetch cotizaciones entry',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Create a new cotizaciones entry
export const createCotizacionesEntry = async (req: AuthRequest, res: Response) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    const userId = req.userId;
    const {
      amount,
      currency,
      concept,
      bank_account,
      entry_type,
      transaction_date,
      description,
      fileAttachments = []
    } = req.body;

    // Validation
    if (!amount || !currency || !concept || !bank_account || !entry_type || !transaction_date) {
      return res.status(400).json({ 
        error: 'Missing required fields: amount, currency, concept, bank_account, entry_type, transaction_date' 
      });
    }

    if (!['USD', 'MXN'].includes(currency)) {
      return res.status(400).json({ error: 'Currency must be USD or MXN' });
    }

    if (!['income', 'expense'].includes(entry_type)) {
      return res.status(400).json({ error: 'Entry type must be income or expense' });
    }

    // Generate internal ID
    const internalId = generateInternalId();

    // Ensure amount is positive for income, negative for expense
    const normalizedAmount = entry_type === 'income' ? Math.abs(amount) : -Math.abs(amount);

    const query = `
      INSERT INTO cotizaciones_entries (
        user_id, internal_id, amount, currency, concept, bank_account, 
        entry_type, transaction_date, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      userId,
      internalId,
      normalizedAmount,
      currency,
      concept,
      bank_account,
      entry_type,
      transaction_date,
      description || null
    ];

    const result = await client.query(query, values);
    const cotizacionesEntry = result.rows[0];

    // Create attachments
    console.log('FileAttachments received for cotizaciones:', fileAttachments);
    if (fileAttachments && fileAttachments.length > 0) {
      console.log('Creating', fileAttachments.length, 'cotizaciones attachments');
      for (const attachment of fileAttachments) {
        console.log('Processing cotizaciones attachment:', attachment);
        const attachmentQuery = `
          INSERT INTO cotizaciones_attachments (
            cotizacion_entry_id, user_id, file_name, file_url, file_size, 
            file_type, attachment_type
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        
        await client.query(attachmentQuery, [
          cotizacionesEntry.id,
          userId,
          attachment.file.name,
          attachment.file.url,
          attachment.file.size,
          attachment.file.type,
          'file'
        ]);
      }
    }

    await client.query('COMMIT');

    // Fetch the complete entry with attachments
    const completeEntryQuery = `
      SELECT 
        ce.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ca.id,
              'fileName', ca.file_name,
              'fileUrl', ca.file_url,
              'fileSize', ca.file_size,
              'fileType', ca.file_type,
              'createdAt', ca.created_at
            )
          ) FILTER (WHERE ca.id IS NOT NULL),
          '[]'
        ) as attachments
      FROM cotizaciones_entries ce
      LEFT JOIN cotizaciones_attachments ca ON ce.id = ca.cotizacion_entry_id
      WHERE ce.id = $1
      GROUP BY ce.id
    `;
    
    const completeResult = await db.query(completeEntryQuery, [cotizacionesEntry.id]);
    const entry = completeResult.rows[0];
    
    res.status(201).json({
      ...entry,
      attachments: entry.attachments || []
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating cotizaciones entry:', error);
    
    if (error instanceof Error && error.message.includes('duplicate key')) {
      res.status(409).json({ error: 'Internal ID already exists. Please try again.' });
    } else {
      res.status(500).json({ 
        error: 'Failed to create cotizaciones entry',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } finally {
    client.release();
  }
};

// Update a cotizaciones entry
export const updateCotizacionesEntry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const entryId = parseInt(req.params.id);

    if (isNaN(entryId)) {
      return res.status(400).json({ error: 'Invalid entry ID' });
    }

    const {
      amount,
      currency,
      concept,
      bank_account,
      entry_type,
      transaction_date,
      description
    } = req.body;

    // Validate currency if provided
    if (currency && !['USD', 'MXN'].includes(currency)) {
      return res.status(400).json({ error: 'Currency must be USD or MXN' });
    }

    // Validate entry_type if provided
    if (entry_type && !['income', 'expense'].includes(entry_type)) {
      return res.status(400).json({ error: 'Entry type must be income or expense' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 0;

    if (amount !== undefined) {
      paramCount++;
      // If entry_type is also being updated, use that; otherwise fetch current entry_type
      let currentEntryType = entry_type;
      if (!currentEntryType) {
        const currentEntry = await db.query(
          'SELECT entry_type FROM cotizaciones_entries WHERE id = $1 AND user_id = $2',
          [entryId, userId]
        );
        if (currentEntry.rows.length === 0) {
          return res.status(404).json({ error: 'Cotizaciones entry not found' });
        }
        currentEntryType = currentEntry.rows[0].entry_type;
      }
      
      const normalizedAmount = currentEntryType === 'income' ? Math.abs(amount) : -Math.abs(amount);
      updates.push(`amount = $${paramCount}`);
      values.push(normalizedAmount);
    }

    if (currency !== undefined) {
      paramCount++;
      updates.push(`currency = $${paramCount}`);
      values.push(currency);
    }

    if (concept !== undefined) {
      paramCount++;
      updates.push(`concept = $${paramCount}`);
      values.push(concept);
    }

    if (bank_account !== undefined) {
      paramCount++;
      updates.push(`bank_account = $${paramCount}`);
      values.push(bank_account);
    }

    if (entry_type !== undefined) {
      paramCount++;
      updates.push(`entry_type = $${paramCount}`);
      values.push(entry_type);

      // If entry_type is being updated and amount wasn't provided, update amount sign
      if (amount === undefined) {
        const currentEntry = await db.query(
          'SELECT amount FROM cotizaciones_entries WHERE id = $1 AND user_id = $2',
          [entryId, userId]
        );
        if (currentEntry.rows.length > 0) {
          const currentAmount = parseFloat(currentEntry.rows[0].amount);
          const normalizedAmount = entry_type === 'income' ? Math.abs(currentAmount) : -Math.abs(currentAmount);
          paramCount++;
          updates.push(`amount = $${paramCount}`);
          values.push(normalizedAmount);
        }
      }
    }

    if (transaction_date !== undefined) {
      paramCount++;
      updates.push(`transaction_date = $${paramCount}`);
      values.push(transaction_date);
    }

    if (description !== undefined) {
      paramCount++;
      updates.push(`description = $${paramCount}`);
      values.push(description);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Add updated_at
    paramCount++;
    updates.push(`updated_at = $${paramCount}`);
    values.push(new Date());

    // Add WHERE conditions
    paramCount++;
    values.push(entryId);
    paramCount++;
    values.push(userId);

    const query = `
      UPDATE cotizaciones_entries 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount - 1} AND user_id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cotizaciones entry not found' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error updating cotizaciones entry:', error);
    res.status(500).json({ 
      error: 'Failed to update cotizaciones entry',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete a cotizaciones entry
export const deleteCotizacionesEntry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const entryId = parseInt(req.params.id);

    if (isNaN(entryId)) {
      return res.status(400).json({ error: 'Invalid entry ID' });
    }

    // Delete the entry (attachments will be deleted due to CASCADE)
    const result = await db.query(
      'DELETE FROM cotizaciones_entries WHERE id = $1 AND user_id = $2 RETURNING id',
      [entryId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cotizaciones entry not found' });
    }

    res.json({ message: 'Cotizaciones entry deleted successfully' });

  } catch (error) {
    console.error('Error deleting cotizaciones entry:', error);
    res.status(500).json({ 
      error: 'Failed to delete cotizaciones entry',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get cotizaciones summary/dashboard data
export const getCotizacionesSummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { startDate, endDate, currency } = req.query;

    let query = `
      SELECT 
        currency,
        SUM(CASE WHEN entry_type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN entry_type = 'expense' THEN ABS(amount) ELSE 0 END) as total_expenses,
        SUM(CASE WHEN entry_type = 'income' THEN amount ELSE -ABS(amount) END) as net_cash_flow,
        COUNT(*) as total_entries,
        COUNT(CASE WHEN entry_type = 'income' THEN 1 END) as income_entries,
        COUNT(CASE WHEN entry_type = 'expense' THEN 1 END) as expense_entries
      FROM cotizaciones_entries 
      WHERE user_id = $1
    `;

    const params: any[] = [userId];
    let paramCount = 1;

    if (startDate) {
      paramCount++;
      query += ` AND transaction_date >= $${paramCount}`;
      params.push(startDate as string);
    }

    if (endDate) {
      paramCount++;
      query += ` AND transaction_date <= $${paramCount}`;
      params.push(endDate as string);
    }

    if (currency) {
      paramCount++;
      query += ` AND currency = $${paramCount}`;
      params.push(currency as string);
    }

    query += ` GROUP BY currency ORDER BY currency`;

    const result = await db.query(query, params);

    // Format the response
    const summary = result.rows.reduce((acc, row) => {
      acc[row.currency] = {
        total_income: parseFloat(row.total_income) || 0,
        total_expenses: parseFloat(row.total_expenses) || 0,
        net_cash_flow: parseFloat(row.net_cash_flow) || 0,
        total_entries: parseInt(row.total_entries) || 0,
        income_entries: parseInt(row.income_entries) || 0,
        expense_entries: parseInt(row.expense_entries) || 0
      };
      return acc;
    }, {});

    res.json(summary);

  } catch (error) {
    console.error('Error fetching cotizaciones summary:', error);
    res.status(500).json({ 
      error: 'Failed to fetch cotizaciones summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};