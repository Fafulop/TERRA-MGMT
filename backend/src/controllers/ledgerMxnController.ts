import { Request, Response } from 'express';
import { Pool } from 'pg';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { mapLedgerEntries, mapLedgerEntryWithAttachments, DatabaseLedgerEntry } from '../utils/ledgerMappers';
import { buildLedgerFilters, buildLedgerEntriesQuery, buildSingleLedgerEntryQuery, buildLedgerSummaryQuery, LedgerQueryFilters } from '../utils/queryBuilders';

// Generate unique internal ID for MXN ledger entries
const generateInternalId = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `MXN-${timestamp}-${random}`;
};

// Get all MXN ledger entries (for all users)
export const getMxnLedgerEntries = async (req: AuthRequest, res: Response) => {
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
        le.transaction_date as date,
        le.por_realizar,
        u.username,
        u.first_name,
        u.last_name,
        COUNT(DISTINCT la.id) as attachment_count,
        COUNT(DISTINCT lf.id) as factura_count
      FROM ledger_entries_mxn le
      LEFT JOIN ledger_attachments_mxn la ON le.id = la.ledger_entry_id
      LEFT JOIN ledger_facturas_mxn lf ON le.id = lf.ledger_entry_id
      LEFT JOIN users u ON le.user_id = u.id
      WHERE 1=1
    `;
    
    const queryParams: any[] = [];
    let paramIndex = 1;

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
        le.bank_movement_id ILIKE $${paramIndex} OR
        le.area ILIKE $${paramIndex} OR
        le.subarea ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    query += `
      GROUP BY le.id, u.username, u.first_name, u.last_name
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
      area: row.area,
      subarea: row.subarea,
      por_realizar: row.por_realizar,
      userId: row.user_id,
      username: row.username,
      firstName: row.first_name,
      lastName: row.last_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      attachmentCount: parseInt(row.attachment_count) || 0,
      facturaCount: parseInt(row.factura_count) || 0,
      currency: 'MXN' // Add currency identifier
    }));
    
    // Get summary totals for all users
    const summaryQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN entry_type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN entry_type = 'expense' THEN ABS(amount) ELSE 0 END), 0) as total_expenses,
        COALESCE(SUM(amount), 0) as net_cash_flow,
        COUNT(*) as total_entries
      FROM ledger_entries_mxn 
      WHERE 1=1
    `;
    
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
    console.error('Error fetching MXN ledger entries:', error);
    res.status(500).json({ error: 'Failed to fetch MXN ledger entries' });
  }
};

// Get a single MXN ledger entry with attachments (any user can view)
export const getMxnLedgerEntry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get ledger entry with user information
    const entryQuery = `
      SELECT 
        le.*,
        le.transaction_date as date,
        le.por_realizar,
        u.username,
        u.first_name,
        u.last_name
      FROM ledger_entries_mxn le
      LEFT JOIN users u ON le.user_id = u.id
      WHERE le.id = $1
    `;
    const entryResult = await db.query(entryQuery, [id]);

    if (entryResult.rows.length === 0) {
      return res.status(404).json({ error: 'MXN ledger entry not found' });
    }

    // Get attachments
    const attachmentsQuery = `
      SELECT 
        la.*,
        u.username,
        u.first_name,
        u.last_name
      FROM ledger_attachments_mxn la
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
      area: entry.area,
      subarea: entry.subarea,
      por_realizar: entry.por_realizar,
      userId: entry.user_id,
      username: entry.username,
      firstName: entry.first_name,
      lastName: entry.last_name,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at,
      currency: 'MXN',
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
    console.error('Error fetching MXN ledger entry:', error);
    res.status(500).json({ error: 'Failed to fetch MXN ledger entry' });
  }
};

// Create a new MXN ledger entry
export const createMxnLedgerEntry = async (req: AuthRequest, res: Response) => {
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
      fileAttachments = [],
      facturaAttachments = []
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

    // Create MXN ledger entry
    const entryQuery = `
      INSERT INTO ledger_entries_mxn (
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
    console.log('MXN FileAttachments received:', fileAttachments);
    if (fileAttachments && fileAttachments.length > 0) {
      console.log('Creating', fileAttachments.length, 'MXN attachments');
      for (const attachment of fileAttachments) {
        console.log('Processing MXN attachment:', attachment);
        const attachmentQuery = `
          INSERT INTO ledger_attachments_mxn (
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

    // Create facturas
    console.log('MXN FacturaAttachments received:', facturaAttachments);
    if (facturaAttachments && facturaAttachments.length > 0) {
      console.log('Creating', facturaAttachments.length, 'MXN facturas');
      for (const factura of facturaAttachments) {
        console.log('Processing MXN factura:', factura);
        const facturaQuery = `
          INSERT INTO ledger_facturas_mxn (
            ledger_entry_id, file_name, file_url, file_size,
            file_type, folio, uuid, rfc_emisor, rfc_receptor,
            total, notes, uploaded_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `;

        await client.query(facturaQuery, [
          ledgerEntry.id,
          factura.file.name,
          factura.file.url,
          factura.file.size,
          factura.file.type,
          factura.folio || null,
          factura.uuid || null,
          factura.rfcEmisor || null,
          factura.rfcReceptor || null,
          factura.total || null,
          factura.notes || null,
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
      FROM ledger_entries_mxn le
      LEFT JOIN ledger_attachments_mxn la ON le.id = la.ledger_entry_id
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
      area: entry.area,
      subarea: entry.subarea,
      por_realizar: entry.por_realizar,
      userId: entry.user_id,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at,
      currency: 'MXN',
      attachments: entry.attachments || []
    };
    
    res.status(201).json(mappedEntry);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating MXN ledger entry:', error);
    res.status(500).json({ error: 'Failed to create MXN ledger entry' });
  } finally {
    client.release();
  }
};

// Update a MXN ledger entry
export const updateMxnLedgerEntry = async (req: AuthRequest, res: Response) => {
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

    // Check if entry exists
    const checkQuery = 'SELECT id FROM ledger_entries_mxn WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'MXN ledger entry not found' });
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
      UPDATE ledger_entries_mxn
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
      WHERE id = $10
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
      id
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
      area: entry.area,
      subarea: entry.subarea,
      por_realizar: entry.por_realizar,
      userId: entry.user_id,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at,
      currency: 'MXN'
    };
    
    res.json(mappedEntry);
  } catch (error) {
    console.error('Error updating MXN ledger entry:', error);
    res.status(500).json({ error: 'Failed to update MXN ledger entry' });
  }
};

// Delete a MXN ledger entry
export const deleteMxnLedgerEntry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // Check if entry exists
    const checkQuery = 'SELECT id FROM ledger_entries_mxn WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'MXN ledger entry not found' });
    }

    // Delete entry (attachments will be deleted automatically due to CASCADE)
    const deleteQuery = 'DELETE FROM ledger_entries_mxn WHERE id = $1';
    await db.query(deleteQuery, [id]);

    res.json({ message: 'MXN ledger entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting MXN ledger entry:', error);
    res.status(500).json({ error: 'Failed to delete MXN ledger entry' });
  }
};

// Get MXN ledger summary/dashboard data (for all users)
export const getMxnLedgerSummary = async (req: AuthRequest, res: Response) => {
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
      FROM ledger_entries_mxn 
      WHERE 1=1 ${dateFilter}
    `;

    const result = await db.query(summaryQuery, queryParams);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching MXN ledger summary:', error);
    res.status(500).json({ error: 'Failed to fetch MXN ledger summary' });
  }
};

// Mark a por_realizar MXN entry as realized
export const markMxnAsRealized = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // Check if entry exists
    const checkQuery = 'SELECT id, por_realizar FROM ledger_entries_mxn WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const entry = checkResult.rows[0];
    if (!entry.por_realizar) {
      return res.status(400).json({ error: 'Entry is already realized' });
    }

    // Update entry to mark as realized
    const updateQuery = `
      UPDATE ledger_entries_mxn
      SET
        por_realizar = FALSE,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(updateQuery, [id]);
    const updatedEntry = result.rows[0];

    res.json({
      message: 'MXN entry marked as realized successfully',
      entry: updatedEntry
    });
  } catch (error) {
    console.error('Error marking MXN entry as realized:', error);
    res.status(500).json({ error: 'Failed to mark MXN entry as realized' });
  }
};