import { Request, Response } from 'express';
import { Pool } from 'pg';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Generate unique internal ID for ledger entries
const generateInternalId = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `TXN-${timestamp}-${random}`;
};

// Get all ledger entries for a user
export const getLedgerEntries = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { 
      entryType, 
      bankAccount, 
      dateFrom, 
      dateTo, 
      search,
      limit = 50,
      offset = 0 
    } = req.query;

    let query = `
      SELECT 
        le.*,
        COUNT(la.id) as attachment_count
      FROM ledger_entries le
      LEFT JOIN ledger_attachments la ON le.id = la.ledger_entry_id
      WHERE le.user_id = $1
    `;
    
    const queryParams: any[] = [userId];
    let paramIndex = 2;

    // Add filters
    if (entryType && entryType !== 'all') {
      query += ` AND le.entry_type = $${paramIndex}`;
      queryParams.push(entryType);
      paramIndex++;
    }

    if (bankAccount) {
      query += ` AND le.bank_account = $${paramIndex}`;
      queryParams.push(bankAccount);
      paramIndex++;
    }

    if (dateFrom) {
      query += ` AND le.transaction_date >= $${paramIndex}`;
      queryParams.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      query += ` AND le.transaction_date <= $${paramIndex}`;
      queryParams.push(dateTo);
      paramIndex++;
    }

    if (search) {
      query += ` AND (
        le.concept ILIKE $${paramIndex} OR 
        le.internal_id ILIKE $${paramIndex} OR 
        le.bank_movement_id ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    query += `
      GROUP BY le.id
      ORDER BY le.transaction_date DESC, le.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(limit, offset);

    const result = await db.query(query, queryParams);
    
    // Map database columns to camelCase for frontend
    const mappedEntries = result.rows.map((row: any) => ({
      id: row.id,
      amount: parseFloat(row.amount),
      concept: row.concept,
      bankAccount: row.bank_account,
      internalId: row.internal_id,
      bankMovementId: row.bank_movement_id,
      entryType: row.entry_type,
      date: row.transaction_date,
      userId: row.user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      attachmentCount: parseInt(row.attachment_count) || 0
    }));
    
    // Get summary totals
    const summaryQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN entry_type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN entry_type = 'expense' THEN ABS(amount) ELSE 0 END), 0) as total_expenses,
        COALESCE(SUM(amount), 0) as net_cash_flow,
        COUNT(*) as total_entries
      FROM ledger_entries 
      WHERE user_id = $1
    `;
    
    const summaryResult = await db.query(summaryQuery, [userId]);
    
    res.json({
      entries: mappedEntries,
      summary: summaryResult.rows[0],
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: result.rows.length === parseInt(limit as string)
      }
    });
  } catch (error) {
    console.error('Error fetching ledger entries:', error);
    res.status(500).json({ error: 'Failed to fetch ledger entries' });
  }
};

// Get a single ledger entry with attachments
export const getLedgerEntry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // Get ledger entry
    const entryQuery = `
      SELECT * FROM ledger_entries 
      WHERE id = $1 AND user_id = $2
    `;
    const entryResult = await db.query(entryQuery, [id, userId]);

    if (entryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ledger entry not found' });
    }

    // Get attachments
    const attachmentsQuery = `
      SELECT 
        la.*,
        u.username,
        u.first_name,
        u.last_name
      FROM ledger_attachments la
      LEFT JOIN users u ON la.uploaded_by = u.id
      WHERE la.ledger_entry_id = $1
      ORDER BY la.created_at ASC
    `;
    const attachmentsResult = await db.query(attachmentsQuery, [id]);

    const entry = entryResult.rows[0];
    const mappedEntry = {
      id: entry.id,
      amount: parseFloat(entry.amount),
      concept: entry.concept,
      bankAccount: entry.bank_account,
      internalId: entry.internal_id,
      bankMovementId: entry.bank_movement_id,
      entryType: entry.entry_type,
      date: entry.transaction_date,
      userId: entry.user_id,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at,
      attachments: attachmentsResult.rows.map((att: any) => ({
        id: att.id,
        ledgerEntryId: att.ledger_entry_id,
        fileName: att.file_name,
        fileUrl: att.file_url,
        fileSize: att.file_size,
        fileType: att.file_type,
        attachmentType: att.attachment_type,
        createdAt: att.created_at,
        uploadedBy: {
          username: att.username,
          firstName: att.first_name,
          lastName: att.last_name
        }
      }))
    };

    res.json(mappedEntry);
  } catch (error) {
    console.error('Error fetching ledger entry:', error);
    res.status(500).json({ error: 'Failed to fetch ledger entry' });
  }
};

// Create a new ledger entry
export const createLedgerEntry = async (req: AuthRequest, res: Response) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    const userId = req.userId;
    const {
      amount,
      concept,
      bankAccount,
      bankMovementId,
      entryType,
      date,
      fileAttachments = []
    } = req.body;

    // Validate required fields
    if (!amount || !concept || !bankAccount || !entryType || !date) {
      return res.status(400).json({ 
        error: 'Missing required fields: amount, concept, bankAccount, entryType, date' 
      });
    }

    // Validate entry type
    if (!['income', 'expense'].includes(entryType)) {
      return res.status(400).json({ error: 'entryType must be either "income" or "expense"' });
    }

    // Ensure amount is positive and apply sign based on entry type
    const finalAmount = entryType === 'expense' ? -Math.abs(parseFloat(amount)) : Math.abs(parseFloat(amount));
    const internalId = generateInternalId();

    // Create ledger entry
    const entryQuery = `
      INSERT INTO ledger_entries (
        user_id, amount, concept, bank_account, internal_id, 
        bank_movement_id, entry_type, transaction_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const entryValues = [
      userId,
      finalAmount,
      concept,
      bankAccount,
      internalId,
      bankMovementId || null,
      entryType,
      date
    ];

    const entryResult = await client.query(entryQuery, entryValues);
    const ledgerEntry = entryResult.rows[0];

    // Create attachments
    console.log('FileAttachments received:', fileAttachments);
    if (fileAttachments && fileAttachments.length > 0) {
      console.log('Creating', fileAttachments.length, 'attachments');
      for (const attachment of fileAttachments) {
        console.log('Processing attachment:', attachment);
        const attachmentQuery = `
          INSERT INTO ledger_attachments (
            ledger_entry_id, file_name, file_url, file_size, 
            file_type, attachment_type, uploaded_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        
        await client.query(attachmentQuery, [
          ledgerEntry.id,
          attachment.file.name,
          attachment.file.url,
          attachment.file.size,
          attachment.file.type,
          'file',
          userId
        ]);
      }
    }

    await client.query('COMMIT');

    // Fetch the complete entry with attachments
    const completeEntryQuery = `
      SELECT 
        le.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', la.id,
              'fileName', la.file_name,
              'fileUrl', la.file_url,
              'fileSize', la.file_size,
              'fileType', la.file_type,
              'createdAt', la.created_at
            )
          ) FILTER (WHERE la.id IS NOT NULL),
          '[]'
        ) as attachments
      FROM ledger_entries le
      LEFT JOIN ledger_attachments la ON le.id = la.ledger_entry_id
      WHERE le.id = $1
      GROUP BY le.id
    `;
    
    const completeResult = await db.query(completeEntryQuery, [ledgerEntry.id]);
    const entry = completeResult.rows[0];
    
    // Map to camelCase for frontend
    const mappedEntry = {
      id: entry.id,
      amount: parseFloat(entry.amount),
      concept: entry.concept,
      bankAccount: entry.bank_account,
      internalId: entry.internal_id,
      bankMovementId: entry.bank_movement_id,
      entryType: entry.entry_type,
      date: entry.transaction_date,
      userId: entry.user_id,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at,
      attachments: entry.attachments || []
    };
    
    res.status(201).json(mappedEntry);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating ledger entry:', error);
    res.status(500).json({ error: 'Failed to create ledger entry' });
  } finally {
    client.release();
  }
};

// Update a ledger entry
export const updateLedgerEntry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const {
      amount,
      concept,
      bankAccount,
      bankMovementId,
      entryType,
      date
    } = req.body;

    // Check if entry exists and belongs to user
    const checkQuery = 'SELECT id FROM ledger_entries WHERE id = $1 AND user_id = $2';
    const checkResult = await db.query(checkQuery, [id, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ledger entry not found' });
    }

    // Apply amount sign based on entry type
    const finalAmount = entryType === 'expense' ? -Math.abs(parseFloat(amount)) : Math.abs(parseFloat(amount));

    const updateQuery = `
      UPDATE ledger_entries 
      SET 
        amount = $1,
        concept = $2,
        bank_account = $3,
        bank_movement_id = $4,
        entry_type = $5,
        transaction_date = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 AND user_id = $8
      RETURNING *
    `;
    
    const updateValues = [
      finalAmount,
      concept,
      bankAccount,
      bankMovementId || null,
      entryType,
      date,
      id,
      userId
    ];

    const result = await db.query(updateQuery, updateValues);
    const entry = result.rows[0];
    
    // Map to camelCase for frontend
    const mappedEntry = {
      id: entry.id,
      amount: parseFloat(entry.amount),
      concept: entry.concept,
      bankAccount: entry.bank_account,
      internalId: entry.internal_id,
      bankMovementId: entry.bank_movement_id,
      entryType: entry.entry_type,
      date: entry.transaction_date,
      userId: entry.user_id,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at
    };
    
    res.json(mappedEntry);
  } catch (error) {
    console.error('Error updating ledger entry:', error);
    res.status(500).json({ error: 'Failed to update ledger entry' });
  }
};

// Delete a ledger entry
export const deleteLedgerEntry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // Check if entry exists and belongs to user
    const checkQuery = 'SELECT id FROM ledger_entries WHERE id = $1 AND user_id = $2';
    const checkResult = await db.query(checkQuery, [id, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ledger entry not found' });
    }

    // Delete entry (attachments will be deleted automatically due to CASCADE)
    const deleteQuery = 'DELETE FROM ledger_entries WHERE id = $1 AND user_id = $2';
    await db.query(deleteQuery, [id, userId]);

    res.json({ message: 'Ledger entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting ledger entry:', error);
    res.status(500).json({ error: 'Failed to delete ledger entry' });
  }
};

// Get ledger summary/dashboard data
export const getLedgerSummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { startDate, endDate } = req.query;

    let dateFilter = '';
    const queryParams: any[] = [userId];
    
    if (startDate && endDate) {
      dateFilter = 'AND transaction_date BETWEEN $2 AND $3';
      queryParams.push(startDate as string, endDate as string);
    }

    const summaryQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN entry_type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN entry_type = 'expense' THEN ABS(amount) ELSE 0 END), 0) as total_expenses,
        COALESCE(SUM(amount), 0) as net_cash_flow,
        COUNT(*) as total_entries,
        COUNT(CASE WHEN entry_type = 'income' THEN 1 END) as income_entries,
        COUNT(CASE WHEN entry_type = 'expense' THEN 1 END) as expense_entries
      FROM ledger_entries 
      WHERE user_id = $1 ${dateFilter}
    `;

    const result = await db.query(summaryQuery, queryParams);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching ledger summary:', error);
    res.status(500).json({ error: 'Failed to fetch ledger summary' });
  }
};