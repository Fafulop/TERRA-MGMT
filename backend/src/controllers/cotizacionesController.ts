import { BaseFinancialController, BaseFinancialFormData } from './BaseFinancialController';
import db from '../config/database';
import { generateCotizacionId } from '../utils/idGenerator';

interface CotizacionesFormData extends BaseFinancialFormData {
  currency: 'USD' | 'MXN';
}

class CotizacionesController extends BaseFinancialController {
  constructor() {
    super(db, 'cotizaciones_entries', 'cotizaciones_attachments', 'cotizacion_entry_id', generateCotizacionId);
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
    if (!data.amount || !data.currency || !data.concept || !data.bank_account || !data.entry_type || !data.transaction_date) {
      throw new Error('Validation error: Missing required fields: amount, currency, concept, bank_account, entry_type, transaction_date');
    }

    if (!['USD', 'MXN'].includes(data.currency)) {
      throw new Error('Validation error: Currency must be USD or MXN');
    }

    if (!['income', 'expense'].includes(data.entry_type)) {
      throw new Error('Validation error: Entry type must be income or expense');
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

  // Get cotizaciones summary with currency grouping
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
        WHERE user_id = $1
      `;

      const params: any[] = [userId];
      let paramCount = 1;

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