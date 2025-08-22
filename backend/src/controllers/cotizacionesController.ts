import { BaseFinancialController, BaseFinancialFormData } from './BaseFinancialController';
import db from '../config/database';
import { generateCotizacionId } from '../utils/idGenerator';

interface CotizacionesFormData extends BaseFinancialFormData {
  currency: 'USD' | 'MXN';
  area: string;
  subarea: string;
}

class CotizacionesController extends BaseFinancialController {
  constructor() {
    super(db, 'cotizaciones_entries', 'cotizaciones_attachments', 'cotizacion_entry_id', generateCotizacionId);
  }

  // Override getEntries to allow all users to see all entries
  async getEntries(req: any, res: any) {
    const client = await this.pool.connect();
    
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const filters = req.query;
      const limit = parseInt(filters.limit as string) || 50;
      const offset = parseInt(filters.offset as string) || 0;

      // Remove user filtering - allow all users to see all entries
      let whereClause = `WHERE 1=1`;
      let params: any[] = [];
      let paramIndex = 1;

      // Build currency-specific filter
      const currencyFilter = this.buildCurrencyFilter(filters);
      whereClause += currencyFilter.whereClause.replace('$2', `$${paramIndex}`);
      params.push(...currencyFilter.params);
      paramIndex += currencyFilter.params.length;

      // Common filters
      if (filters.entry_type) {
        whereClause += ` AND e.entry_type = $${paramIndex}`;
        params.push(filters.entry_type);
        paramIndex++;
      }

      if (filters.bank_account) {
        whereClause += ` AND e.bank_account = $${paramIndex}`;
        params.push(filters.bank_account);
        paramIndex++;
      }

      if (filters.start_date) {
        whereClause += ` AND e.transaction_date >= $${paramIndex}`;
        params.push(filters.start_date);
        paramIndex++;
      }

      if (filters.end_date) {
        whereClause += ` AND e.transaction_date <= $${paramIndex}`;
        params.push(filters.end_date);
        paramIndex++;
      }

      if (filters.search) {
        whereClause += ` AND (e.concept ILIKE $${paramIndex} OR e.description ILIKE $${paramIndex})`;
        params.push(`%${filters.search}%`);
        paramIndex++;
      }

      if (filters.area) {
        whereClause += ` AND e.area ILIKE $${paramIndex}`;
        params.push(`%${filters.area}%`);
        paramIndex++;
      }

      if (filters.subarea) {
        whereClause += ` AND e.subarea ILIKE $${paramIndex}`;
        params.push(`%${filters.subarea}%`);
        paramIndex++;
      }

      // Get entries with attachments and user information
      const entriesQuery = `
        SELECT 
          e.*,
          u.username,
          u.first_name,
          u.last_name,
          COALESCE(
            json_agg(
              CASE WHEN a.id IS NOT NULL 
              THEN json_build_object(
                'id', a.id,
                'fileName', a.file_name,
                'fileUrl', a.file_url,
                'fileSize', a.file_size,
                'fileType', a.file_type,
                'attachmentType', a.attachment_type,
                'urlTitle', a.url_title,
                'createdAt', a.created_at
              ) END
            ) FILTER (WHERE a.id IS NOT NULL), '[]'
          ) as attachments
        FROM ${this.tableName} e
        LEFT JOIN ${this.attachmentTableName} a ON e.id = a.${this.attachmentForeignKey}
        LEFT JOIN users u ON e.user_id = u.id
        ${whereClause}
        GROUP BY e.id, u.username, u.first_name, u.last_name
        ORDER BY e.transaction_date DESC, e.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);
      const entriesResult = await client.query(entriesQuery, params);

      // Get summary for all entries
      const summaryQuery = `
        SELECT 
          currency,
          SUM(CASE WHEN entry_type = 'income' THEN amount ELSE 0 END) as total_income,
          SUM(CASE WHEN entry_type = 'expense' THEN ABS(amount) ELSE 0 END) as total_expenses,
          COUNT(*) as total_entries
        FROM ${this.tableName} e
        ${whereClause}
        GROUP BY currency
        ORDER BY currency
      `;

      const summaryResult = await client.query(summaryQuery, params.slice(0, -2));
      const formattedSummary = this.formatSummaryResponse(summaryResult.rows);

      res.json({
        entries: entriesResult.rows,
        summary: formattedSummary,
        pagination: {
          limit,
          offset,
          hasMore: entriesResult.rows.length === limit
        }
      });

    } catch (error) {
      console.error(`Error fetching ${this.tableName} entries:`, error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  }

  // Override getEntry to allow all users to see any entry
  async getEntry(req: any, res: any) {
    try {
      const userId = req.userId;
      const entryId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!entryId || isNaN(entryId)) {
        return res.status(400).json({ error: 'Invalid entry ID' });
      }

      const entry = await this.getEntryByIdPublic(entryId);
      
      if (!entry) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      res.json(entry);

    } catch (error) {
      console.error(`Error fetching ${this.tableName} entry:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Helper method to get entry without user restriction
  protected async getEntryByIdPublic(entryId: number) {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT 
          e.*,
          u.username,
          u.first_name,
          u.last_name,
          COALESCE(
            json_agg(
              CASE WHEN a.id IS NOT NULL 
              THEN json_build_object(
                'id', a.id,
                'fileName', a.file_name,
                'fileUrl', a.file_url,
                'fileSize', a.file_size,
                'fileType', a.file_type,
                'attachmentType', a.attachment_type,
                'urlTitle', a.url_title,
                'createdAt', a.created_at
              ) END
            ) FILTER (WHERE a.id IS NOT NULL), '[]'
          ) as attachments
        FROM ${this.tableName} e
        LEFT JOIN ${this.attachmentTableName} a ON e.id = a.${this.attachmentForeignKey}
        LEFT JOIN users u ON e.user_id = u.id
        WHERE e.id = $1
        GROUP BY e.id, u.username, u.first_name, u.last_name
      `;

      const result = await client.query(query, [entryId]);
      return result.rows[0] || null;

    } finally {
      client.release();
    }
  }

  protected buildCurrencyFilter(filters: any): { whereClause: string; params: any[] } {
    if (filters.currency) {
      return {
        whereClause: ` AND e.currency = $${2}`,
        params: [filters.currency]
      };
    }
    return { whereClause: '', params: [] };
  }

  protected formatSummaryResponse(rows: any[]): any {
    return rows.reduce((acc, row) => {
      acc[row.currency] = {
        total_income: parseFloat(row.total_income) || 0,
        total_expenses: parseFloat(row.total_expenses) || 0,
        net_cash_flow: parseFloat(row.total_income || 0) - parseFloat(row.total_expenses || 0),
        total_entries: parseInt(row.total_entries) || 0
      };
      return acc;
    }, {});
  }

  protected validateEntryData(data: CotizacionesFormData): void {
    if (!data.amount || !data.currency || !data.concept || !data.bank_account || !data.entry_type || !data.transaction_date || !data.area || !data.subarea) {
      throw new Error('Validation error: Missing required fields: amount, currency, concept, bank_account, entry_type, transaction_date, area, subarea');
    }

    if (!['USD', 'MXN'].includes(data.currency)) {
      throw new Error('Validation error: Currency must be USD or MXN');
    }

    if (!['income', 'expense'].includes(data.entry_type)) {
      throw new Error('Validation error: Entry type must be income or expense');
    }

    if (!data.area.trim()) {
      throw new Error('Validation error: Area cannot be empty');
    }

    if (!data.subarea.trim()) {
      throw new Error('Validation error: Subarea cannot be empty');
    }
  }

  // Override create method to handle currency-specific logic
  async createEntry(req: any, res: any) {
    // Normalize amount based on entry type before validation
    if (req.body.amount && req.body.entry_type) {
      req.body.amount = req.body.entry_type === 'income' ? Math.abs(req.body.amount) : -Math.abs(req.body.amount);
    }
    
    return super.createEntry(req, res);
  }

  // Get cotizaciones summary with currency grouping (for all users)
  async getSummary(req: any, res: any) {
    const client = await this.pool.connect();
    
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { startDate, endDate, currency } = req.query;

      let query = `
        SELECT 
          currency,
          SUM(CASE WHEN entry_type = 'income' THEN amount ELSE 0 END) as total_income,
          SUM(CASE WHEN entry_type = 'expense' THEN ABS(amount) ELSE 0 END) as total_expenses,
          COUNT(*) as total_entries,
          COUNT(CASE WHEN entry_type = 'income' THEN 1 END) as income_entries,
          COUNT(CASE WHEN entry_type = 'expense' THEN 1 END) as expense_entries
        FROM ${this.tableName} 
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramCount = 0;

      if (startDate) {
        paramCount++;
        query += ` AND transaction_date >= $${paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        query += ` AND transaction_date <= $${paramCount}`;
        params.push(endDate);
      }

      if (currency) {
        paramCount++;
        query += ` AND currency = $${paramCount}`;
        params.push(currency);
      }

      query += ` GROUP BY currency ORDER BY currency`;

      const result = await client.query(query, params);

      const summary = result.rows.reduce((acc, row) => {
        acc[row.currency] = {
          total_income: parseFloat(row.total_income) || 0,
          total_expenses: parseFloat(row.total_expenses) || 0,
          net_cash_flow: (parseFloat(row.total_income) || 0) - (parseFloat(row.total_expenses) || 0),
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
    } finally {
      client.release();
    }
  }
}

// Create controller instance
const cotizacionesController = new CotizacionesController();

// Get all cotizaciones entries with filtering and pagination
export const getCotizacionesEntries = cotizacionesController.getEntries.bind(cotizacionesController);

// Get a single cotizaciones entry with attachments
export const getCotizacionesEntry = cotizacionesController.getEntry.bind(cotizacionesController);

// Create a new cotizaciones entry
export const createCotizacionesEntry = cotizacionesController.createEntry.bind(cotizacionesController);

// Update a cotizaciones entry
export const updateCotizacionesEntry = cotizacionesController.updateEntry.bind(cotizacionesController);

// Delete a cotizaciones entry
export const deleteCotizacionesEntry = cotizacionesController.deleteEntry.bind(cotizacionesController);

// Get cotizaciones summary/dashboard data
export const getCotizacionesSummary = cotizacionesController.getSummary.bind(cotizacionesController);