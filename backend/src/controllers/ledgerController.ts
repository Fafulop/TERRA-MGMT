import { Request, Response } from 'express';
import { Pool } from 'pg';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { mapLedgerEntries, mapLedgerEntryWithAttachments, DatabaseLedgerEntry } from '../utils/ledgerMappers';
import { buildLedgerFilters, buildLedgerEntriesQuery, buildSingleLedgerEntryQuery, buildLedgerSummaryQuery, LedgerQueryFilters } from '../utils/queryBuilders';

// Generate unique internal ID for ledger entries
const generateInternalId = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `TXN-${timestamp}-${random}`;
};

// Get all ledger entries (for all users)
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
      por_realizar,
      limit = 50,
      offset = 0 
    } = req.query;

    // Build filters using utility function
    const filters: LedgerQueryFilters = {
      entryType: entryType as string,
      bankAccount: bankAccount as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
      search: search as string,
      por_realizar: por_realizar as string
    };

    const filterResult = buildLedgerFilters(filters, 1);
    const query = buildLedgerEntriesQuery('ledger_entries', 'ledger_attachments', filterResult.whereClause) + 
      ` LIMIT $${filterResult.paramIndex} OFFSET $${filterResult.paramIndex + 1}`;
    
    const queryParams = [...filterResult.queryParams, limit, offset];

    const result = await db.query(query, queryParams);
    
    // Use utility function for mapping
    const mappedEntries = mapLedgerEntries(result.rows as DatabaseLedgerEntry[]);
    
    // Get summary totals using utility function
    const summaryQuery = buildLedgerSummaryQuery('ledger_entries');
    const summaryResult = await db.query(summaryQuery);
    
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

// Get a single ledger entry with attachments (any user can view)
export const getLedgerEntry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get ledger entry with user information using utility function
    const entryQuery = buildSingleLedgerEntryQuery('ledger_entries', 'ledger_attachments');
    const entryResult = await db.query(entryQuery, [id]);

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
    // Manually add attachments to entry object for utility function
    const entryWithAttachments = {
      ...entry,
      attachments: attachmentsResult.rows
    };
    
    const mappedEntry = mapLedgerEntryWithAttachments(entryWithAttachments as DatabaseLedgerEntry & { attachments: any[] });

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
      area,
      subarea,
      por_realizar = false,
      fileAttachments = []
    } = req.body;

    // Validate required fields
    if (!amount || !concept || !bankAccount || !entryType || !date || !area || !subarea) {
      return res.status(400).json({ 
        error: 'Missing required fields: amount, concept, bankAccount, entryType, date, area, subarea' 
      });
    }

    // Validate area and subarea
    if (!area.trim()) {
      return res.status(400).json({ error: 'Area cannot be empty' });
    }

    if (!subarea.trim()) {
      return res.status(400).json({ error: 'Subarea cannot be empty' });
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
        bank_movement_id, entry_type, transaction_date, area, subarea, por_realizar
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
      date,
      area.trim(),
      subarea.trim(),
      por_realizar
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
    
    // Use utility function for mapping
    const mappedEntry = mapLedgerEntryWithAttachments(entry as DatabaseLedgerEntry & { attachments: any[] });
    
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
      date,
      area,
      subarea,
      por_realizar = false
    } = req.body;

    // Check if entry exists and belongs to user
    const checkQuery = 'SELECT id FROM ledger_entries WHERE id = $1 AND user_id = $2';
    const checkResult = await db.query(checkQuery, [id, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ledger entry not found' });
    }

    // Validate area and subarea if provided
    if (area !== undefined && !area.trim()) {
      return res.status(400).json({ error: 'Area cannot be empty' });
    }

    if (subarea !== undefined && !subarea.trim()) {
      return res.status(400).json({ error: 'Subarea cannot be empty' });
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
        area = $7,
        subarea = $8,
        por_realizar = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10 AND user_id = $11
      RETURNING *
    `;
    
    const updateValues = [
      finalAmount,
      concept,
      bankAccount,
      bankMovementId || null,
      entryType,
      date,
      area?.trim() || null,
      subarea?.trim() || null,
      por_realizar,
      id,
      userId
    ];

    const result = await db.query(updateQuery, updateValues);
    const entry = result.rows[0];
    
    // Use utility function for mapping
    const mappedEntry = mapLedgerEntryWithAttachments(entry as DatabaseLedgerEntry & { attachments: any[] });
    
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

// Get ledger summary/dashboard data (for all users)
export const getLedgerSummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const { startDate, endDate } = req.query;

    let dateFilter = '';
    const queryParams: any[] = [];
    
    if (startDate && endDate) {
      dateFilter = 'AND transaction_date BETWEEN $1 AND $2';
      queryParams.push(startDate as string, endDate as string);
    }

    const summaryQuery = `
      SELECT 
        -- Current (realized) totals
        COALESCE(SUM(CASE WHEN entry_type = 'income' AND (por_realizar IS FALSE OR por_realizar IS NULL) THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN entry_type = 'expense' AND (por_realizar IS FALSE OR por_realizar IS NULL) THEN ABS(amount) ELSE 0 END), 0) as total_expenses,
        COALESCE(SUM(CASE WHEN (por_realizar IS FALSE OR por_realizar IS NULL) THEN amount ELSE 0 END), 0) as net_cash_flow,
        
        -- Future (por realizar) totals
        COALESCE(SUM(CASE WHEN entry_type = 'income' AND por_realizar IS TRUE THEN amount ELSE 0 END), 0) as pending_income,
        COALESCE(SUM(CASE WHEN entry_type = 'expense' AND por_realizar IS TRUE THEN ABS(amount) ELSE 0 END), 0) as pending_expenses,
        COALESCE(SUM(CASE WHEN por_realizar IS TRUE THEN amount ELSE 0 END), 0) as pending_cash_flow,
        
        -- Projected totals (current + future)
        COALESCE(SUM(CASE WHEN entry_type = 'income' THEN amount ELSE 0 END), 0) as projected_income,
        COALESCE(SUM(CASE WHEN entry_type = 'expense' THEN ABS(amount) ELSE 0 END), 0) as projected_expenses,
        COALESCE(SUM(amount), 0) as projected_cash_flow,
        
        -- Entry counts
        COUNT(*) as total_entries,
        COUNT(CASE WHEN entry_type = 'income' THEN 1 END) as income_entries,
        COUNT(CASE WHEN entry_type = 'expense' THEN 1 END) as expense_entries,
        COUNT(CASE WHEN por_realizar IS TRUE THEN 1 END) as por_realizar_entries
      FROM ledger_entries 
      WHERE 1=1 ${dateFilter}
    `;

    const result = await db.query(summaryQuery, queryParams);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching ledger summary:', error);
    res.status(500).json({ error: 'Failed to fetch ledger summary' });
  }
};

// Mark a por_realizar entry as realized
export const markAsRealized = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // Check if entry exists and belongs to user
    const checkQuery = 'SELECT id, por_realizar FROM ledger_entries WHERE id = $1 AND user_id = $2';
    const checkResult = await db.query(checkQuery, [id, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const entry = checkResult.rows[0];
    if (!entry.por_realizar) {
      return res.status(400).json({ error: 'Entry is already realized' });
    }

    // Update entry to mark as realized
    const updateQuery = `
      UPDATE ledger_entries 
      SET 
        por_realizar = FALSE,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await db.query(updateQuery, [id, userId]);
    const updatedEntry = result.rows[0];

    res.json({
      message: 'Entry marked as realized successfully',
      entry: updatedEntry
    });
  } catch (error) {
    console.error('Error marking entry as realized:', error);
    res.status(500).json({ error: 'Failed to mark entry as realized' });
  }
};