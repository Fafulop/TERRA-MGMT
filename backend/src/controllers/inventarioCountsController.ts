import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Get current inventory (latest count per item)
export const getCurrentInventory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Use the view we created
    const query = `
      SELECT * FROM v_current_inventory
      ORDER BY name ASC
    `;

    const result = await db.query(query);

    // Calculate summary
    const summary = {
      total_items: result.rows.length,
      total_value: result.rows.reduce((sum, item) => sum + (parseFloat(item.total_value) || 0), 0),
      items_with_counts: result.rows.filter(item => item.count_id !== null).length,
      items_without_counts: result.rows.filter(item => item.count_id === null).length
    };

    res.json({
      inventory: result.rows,
      summary
    });
  } catch (error) {
    console.error('Error fetching current inventory:', error);
    res.status(500).json({ error: 'Failed to fetch current inventory' });
  }
};

// Get all counts with filters
export const getCounts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const filters = req.query;
    const limit = parseInt(filters.limit as string) || 50;
    const offset = parseInt(filters.offset as string) || 0;

    let whereClause = `WHERE 1=1`;
    let params: any[] = [];
    let paramIndex = 1;

    // Filter by item_id
    if (filters.item_id) {
      whereClause += ` AND c.item_id = $${paramIndex}`;
      params.push(filters.item_id);
      paramIndex++;
    }

    // Filter by date range
    if (filters.from_date) {
      whereClause += ` AND c.count_date >= $${paramIndex}`;
      params.push(filters.from_date);
      paramIndex++;
    }

    if (filters.to_date) {
      whereClause += ` AND c.count_date <= $${paramIndex}`;
      params.push(filters.to_date);
      paramIndex++;
    }

    // Filter by counted_by
    if (filters.counted_by) {
      whereClause += ` AND c.counted_by = $${paramIndex}`;
      params.push(filters.counted_by);
      paramIndex++;
    }

    // Filter by session
    if (filters.session_id) {
      whereClause += ` AND c.session_id = $${paramIndex}`;
      params.push(filters.session_id);
      paramIndex++;
    }

    const query = `
      SELECT
        c.*,
        i.name as item_name,
        i.internal_id as item_internal_id,
        i.category,
        i.unit,
        u.username as counted_by_username,
        s.session_name
      FROM inventario_counts c
      INNER JOIN inventario_items i ON c.item_id = i.id
      LEFT JOIN users u ON c.counted_by = u.id
      LEFT JOIN count_sessions s ON c.session_id = s.id
      ${whereClause}
      ORDER BY c.count_date DESC, c.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);
    const result = await db.query(query, params);

    res.json({
      counts: result.rows,
      pagination: {
        limit,
        offset,
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('Error fetching counts:', error);
    res.status(500).json({ error: 'Failed to fetch counts' });
  }
};

// Create a single count
export const createCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const {
      item_id,
      count_date,
      quantity,
      notes,
      session_id
    } = req.body;

    // Validation
    if (!item_id || !count_date || quantity === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: item_id, count_date, quantity'
      });
    }

    // Verify item exists
    const itemCheck = await db.query('SELECT id FROM inventario_items WHERE id = $1', [item_id]);
    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const query = `
      INSERT INTO inventario_counts (
        item_id, count_date, quantity, counted_by, notes, session_id
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      item_id,
      count_date,
      quantity,
      userId,
      notes || null,
      session_id || null
    ];

    const result = await db.query(query, values);

    res.status(201).json({
      message: 'Count created successfully',
      count: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating count:', error);
    res.status(500).json({ error: 'Failed to create count' });
  }
};

// Create multiple counts (batch)
export const createBatchCounts = async (req: AuthRequest, res: Response) => {
  const client = await db.connect();

  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { counts, session_id } = req.body;

    if (!counts || !Array.isArray(counts) || counts.length === 0) {
      return res.status(400).json({ error: 'counts array is required' });
    }

    await client.query('BEGIN');

    const createdCounts = [];

    for (const count of counts) {
      const { item_id, count_date, quantity, notes } = count;

      if (!item_id || !count_date || quantity === undefined) {
        throw new Error('Each count must have item_id, count_date, and quantity');
      }

      const query = `
        INSERT INTO inventario_counts (
          item_id, count_date, quantity, counted_by, notes, session_id
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const values = [
        item_id,
        count_date,
        quantity,
        userId,
        notes || null,
        session_id || null
      ];

      const result = await client.query(query, values);
      createdCounts.push(result.rows[0]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: `${createdCounts.length} counts created successfully`,
      counts: createdCounts
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating batch counts:', error);
    res.status(500).json({ error: 'Failed to create batch counts' });
  } finally {
    client.release();
  }
};

// Update a count
export const updateCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { quantity, notes, count_date } = req.body;

    // Check if count exists
    const checkQuery = 'SELECT * FROM inventario_counts WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Count not found' });
    }

    const query = `
      UPDATE inventario_counts
      SET
        quantity = COALESCE($1, quantity),
        notes = COALESCE($2, notes),
        count_date = COALESCE($3, count_date)
      WHERE id = $4
      RETURNING *
    `;

    const values = [quantity, notes, count_date, id];
    const result = await db.query(query, values);

    res.json({
      message: 'Count updated successfully',
      count: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating count:', error);
    res.status(500).json({ error: 'Failed to update count' });
  }
};

// Delete a count
export const deleteCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if count exists
    const checkQuery = 'SELECT * FROM inventario_counts WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Count not found' });
    }

    const deleteQuery = 'DELETE FROM inventario_counts WHERE id = $1';
    await db.query(deleteQuery, [id]);

    res.json({ message: 'Count deleted successfully' });
  } catch (error) {
    console.error('Error deleting count:', error);
    res.status(500).json({ error: 'Failed to delete count' });
  }
};

// Get counts grouped by date
export const getCountsByDate = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const query = `
      SELECT
        c.count_date,
        COUNT(DISTINCT c.item_id) as items_counted,
        COUNT(c.id) as total_counts,
        SUM(c.quantity * i.cost_per_unit) as total_value,
        array_agg(DISTINCT u.username) as counted_by_users,
        array_agg(DISTINCT s.session_name) FILTER (WHERE s.session_name IS NOT NULL) as sessions
      FROM inventario_counts c
      INNER JOIN inventario_items i ON c.item_id = i.id
      LEFT JOIN users u ON c.counted_by = u.id
      LEFT JOIN count_sessions s ON c.session_id = s.id
      GROUP BY c.count_date
      ORDER BY c.count_date DESC
      LIMIT 50
    `;

    const result = await db.query(query);

    res.json({
      count_dates: result.rows
    });
  } catch (error) {
    console.error('Error fetching counts by date:', error);
    res.status(500).json({ error: 'Failed to fetch counts by date' });
  }
};

// Get detailed counts for a specific date
export const getCountsForDate = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { date } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!date) {
      return res.status(400).json({ error: 'date parameter is required' });
    }

    const query = `
      SELECT
        c.*,
        i.name as item_name,
        i.category as item_category,
        i.unit as item_unit,
        i.cost_per_unit,
        i.description as item_description,
        u.username as counted_by_username,
        s.session_name,
        (c.quantity * i.cost_per_unit) as total_value
      FROM inventario_counts c
      INNER JOIN inventario_items i ON c.item_id = i.id
      LEFT JOIN users u ON c.counted_by = u.id
      LEFT JOIN count_sessions s ON c.session_id = s.id
      WHERE c.count_date = $1
      ORDER BY s.session_name NULLS LAST, i.name
    `;

    const result = await db.query(query, [date]);

    res.json({
      date,
      counts: result.rows,
      total_items: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching counts for date:', error);
    res.status(500).json({ error: 'Failed to fetch counts for date' });
  }
};
