import { Request, Response } from 'express';
import { Pool } from 'pg';

export interface AuthRequest extends Request {
  userId?: number;
}

export interface BaseFinancialEntry {
  id: number;
  user_id: number;
  internal_id: string;
  amount: number;
  concept: string;
  bank_account: string;
  entry_type: 'income' | 'expense';
  transaction_date: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface BaseFinancialFormData {
  amount: number;
  concept: string;
  bank_account: string;
  entry_type: 'income' | 'expense';
  transaction_date: string;
  description?: string;
  fileAttachments?: Array<{
    file: any;
    title: string;
  }>;
}

export interface BaseFilters {
  entry_type?: 'income' | 'expense';
  bank_account?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}

export abstract class BaseFinancialController {
  protected pool: Pool;
  protected tableName: string;
  protected attachmentTableName: string;
  protected attachmentForeignKey: string;
  protected idGenerator: () => string;

  constructor(
    pool: Pool, 
    tableName: string, 
    attachmentTableName: string,
    attachmentForeignKey: string,
    idGenerator: () => string
  ) {
    this.pool = pool;
    this.tableName = tableName;
    this.attachmentTableName = attachmentTableName;
    this.attachmentForeignKey = attachmentForeignKey;
    this.idGenerator = idGenerator;
  }

  // Abstract method for currency-specific handling
  protected abstract buildCurrencyFilter(filters: any): { whereClause: string; params: any[] };
  protected abstract formatSummaryResponse(rows: any[]): any;
  protected abstract validateEntryData(data: BaseFinancialFormData): void;

  // Common CRUD operations
  async getEntries(req: AuthRequest, res: Response) {
    const client = await this.pool.connect();
    
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const filters = req.query;
      const limit = parseInt(filters.limit as string) || 50;
      const offset = parseInt(filters.offset as string) || 0;

      let whereClause = `WHERE e.user_id = $1`;
      let params: any[] = [userId];
      let paramIndex = 2;

      // Build currency-specific filter
      const currencyFilter = this.buildCurrencyFilter(filters);
      whereClause += currencyFilter.whereClause;
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

      // Get entries with attachments
      const entriesQuery = `
        SELECT 
          e.*,
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
        ${whereClause}
        GROUP BY e.id
        ORDER BY e.transaction_date DESC, e.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);
      const entriesResult = await client.query(entriesQuery, params);

      // Get summary
      const summaryQuery = `
        SELECT 
          SUM(CASE WHEN entry_type = 'income' THEN amount ELSE 0 END) as total_income,
          SUM(CASE WHEN entry_type = 'expense' THEN amount ELSE 0 END) as total_expenses,
          COUNT(*) as total_entries
        FROM ${this.tableName} e
        ${whereClause}
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

  async createEntry(req: AuthRequest, res: Response) {
    const client = await this.pool.connect();
    
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const entryData = req.body;
      
      // Validate entry data
      this.validateEntryData(entryData);

      const { fileAttachments = [], ...baseData } = entryData;
      
      await client.query('BEGIN');

      // Generate internal ID
      const internalId = this.idGenerator();

      // Build insert query dynamically based on table structure
      const columns = Object.keys(baseData).join(', ');
      const placeholders = Object.keys(baseData).map((_, index) => `$${index + 3}`).join(', ');
      const values = Object.values(baseData);

      const insertQuery = `
        INSERT INTO ${this.tableName} (user_id, internal_id, ${columns})
        VALUES ($1, $2, ${placeholders})
        RETURNING *
      `;

      const result = await client.query(insertQuery, [userId, internalId, ...values]);
      const newEntry = result.rows[0];

      // Handle file attachments
      if (fileAttachments.length > 0) {
        for (const attachment of fileAttachments) {
          await client.query(`
            INSERT INTO ${this.attachmentTableName} (
              ${this.attachmentForeignKey}, user_id, file_name, file_url, file_size, 
              file_type, attachment_type
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            newEntry.id,
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

      // Fetch complete entry with attachments
      const completeEntry = await this.getEntryById(newEntry.id, userId);
      
      res.status(201).json(completeEntry);

    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Error creating ${this.tableName} entry:`, error);
      
      if (error instanceof Error && error.message.startsWith('Validation error:')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    } finally {
      client.release();
    }
  }

  async updateEntry(req: AuthRequest, res: Response) {
    const client = await this.pool.connect();
    
    try {
      const userId = req.userId;
      const entryId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!entryId || isNaN(entryId)) {
        return res.status(400).json({ error: 'Invalid entry ID' });
      }

      const updates = req.body;
      
      // Validate entry data
      this.validateEntryData(updates);

      // Build update query dynamically
      const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 3}`)
        .join(', ');
      
      const values = Object.values(updates);

      const updateQuery = `
        UPDATE ${this.tableName} 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;

      const result = await client.query(updateQuery, [entryId, userId, ...values]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      // Fetch complete entry with attachments
      const completeEntry = await this.getEntryById(entryId, userId);
      
      res.json(completeEntry);

    } catch (error) {
      console.error(`Error updating ${this.tableName} entry:`, error);
      
      if (error instanceof Error && error.message.startsWith('Validation error:')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    } finally {
      client.release();
    }
  }

  async deleteEntry(req: AuthRequest, res: Response) {
    const client = await this.pool.connect();
    
    try {
      const userId = req.userId;
      const entryId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!entryId || isNaN(entryId)) {
        return res.status(400).json({ error: 'Invalid entry ID' });
      }

      await client.query('BEGIN');

      // Delete attachments first
      await client.query(`
        DELETE FROM ${this.attachmentTableName} 
        WHERE ${this.attachmentForeignKey} = $1
      `, [entryId]);

      // Delete the entry
      const deleteQuery = `
        DELETE FROM ${this.tableName} 
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;

      const result = await client.query(deleteQuery, [entryId, userId]);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Entry not found' });
      }

      await client.query('COMMIT');
      res.status(204).send();

    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Error deleting ${this.tableName} entry:`, error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  }

  async getEntry(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      const entryId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!entryId || isNaN(entryId)) {
        return res.status(400).json({ error: 'Invalid entry ID' });
      }

      const entry = await this.getEntryById(entryId, userId);
      
      if (!entry) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      res.json(entry);

    } catch (error) {
      console.error(`Error fetching ${this.tableName} entry:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  protected async getEntryById(entryId: number, userId: number) {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT 
          e.*,
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
        WHERE e.id = $1 AND e.user_id = $2
        GROUP BY e.id
      `;

      const result = await client.query(query, [entryId, userId]);
      return result.rows[0] || null;

    } finally {
      client.release();
    }
  }
}