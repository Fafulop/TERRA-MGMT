import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Get all count sessions
export const getCountSessions = async (req: AuthRequest, res: Response) => {
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

    // Filter by status
    if (filters.status) {
      whereClause += ` AND s.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    // Filter by date range
    if (filters.from_date) {
      whereClause += ` AND s.count_date >= $${paramIndex}`;
      params.push(filters.from_date);
      paramIndex++;
    }

    if (filters.to_date) {
      whereClause += ` AND s.count_date <= $${paramIndex}`;
      params.push(filters.to_date);
      paramIndex++;
    }

    const query = `
      SELECT
        s.*,
        u.username as counted_by_username,
        COUNT(c.id) as counts_in_session
      FROM count_sessions s
      LEFT JOIN users u ON s.counted_by = u.id
      LEFT JOIN inventario_counts c ON c.session_id = s.id
      ${whereClause}
      GROUP BY s.id, u.username
      ORDER BY s.count_date DESC, s.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);
    const result = await db.query(query, params);

    res.json({
      sessions: result.rows,
      pagination: {
        limit,
        offset,
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('Error fetching count sessions:', error);
    res.status(500).json({ error: 'Failed to fetch count sessions' });
  }
};

// Get a single count session with its counts
export const getCountSession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get session details
    const sessionQuery = `
      SELECT
        s.*,
        u.username as counted_by_username
      FROM count_sessions s
      LEFT JOIN users u ON s.counted_by = u.id
      WHERE s.id = $1
    `;

    const sessionResult = await db.query(sessionQuery, [id]);

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Count session not found' });
    }

    // Get counts in this session
    const countsQuery = `
      SELECT
        c.*,
        i.name as item_name,
        i.internal_id as item_internal_id,
        i.category,
        i.unit
      FROM inventario_counts c
      INNER JOIN inventario_items i ON c.item_id = i.id
      WHERE c.session_id = $1
      ORDER BY i.name ASC
    `;

    const countsResult = await db.query(countsQuery, [id]);

    res.json({
      session: sessionResult.rows[0],
      counts: countsResult.rows
    });
  } catch (error) {
    console.error('Error fetching count session:', error);
    res.status(500).json({ error: 'Failed to fetch count session' });
  }
};

// Create a new count session
export const createCountSession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const {
      session_name,
      count_date,
      notes
    } = req.body;

    // Validation
    if (!count_date) {
      return res.status(400).json({
        error: 'Missing required field: count_date'
      });
    }

    const query = `
      INSERT INTO count_sessions (
        session_name, count_date, counted_by, notes, status
      )
      VALUES ($1, $2, $3, $4, 'in_progress')
      RETURNING *
    `;

    const values = [
      session_name || `Count Session - ${new Date(count_date).toLocaleDateString()}`,
      count_date,
      userId,
      notes || null
    ];

    const result = await db.query(query, values);

    res.status(201).json({
      message: 'Count session created successfully',
      session: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating count session:', error);
    res.status(500).json({ error: 'Failed to create count session' });
  }
};

// Update a count session
export const updateCountSession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const {
      session_name,
      count_date,
      notes,
      status
    } = req.body;

    // Check if session exists
    const checkQuery = 'SELECT * FROM count_sessions WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Count session not found' });
    }

    const query = `
      UPDATE count_sessions
      SET
        session_name = COALESCE($1, session_name),
        count_date = COALESCE($2, count_date),
        notes = COALESCE($3, notes),
        status = COALESCE($4, status),
        completed_at = CASE WHEN $4 = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
      WHERE id = $5
      RETURNING *
    `;

    const values = [session_name, count_date, notes, status, id];
    const result = await db.query(query, values);

    res.json({
      message: 'Count session updated successfully',
      session: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating count session:', error);
    res.status(500).json({ error: 'Failed to update count session' });
  }
};

// Complete a count session
export const completeCountSession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if session exists
    const checkQuery = 'SELECT * FROM count_sessions WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Count session not found' });
    }

    const query = `
      UPDATE count_sessions
      SET
        status = 'completed',
        completed_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(query, [id]);

    res.json({
      message: 'Count session completed successfully',
      session: result.rows[0]
    });
  } catch (error) {
    console.error('Error completing count session:', error);
    res.status(500).json({ error: 'Failed to complete count session' });
  }
};

// Delete a count session
export const deleteCountSession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if session exists
    const checkQuery = 'SELECT * FROM count_sessions WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Count session not found' });
    }

    // Note: Counts linked to this session will have session_id set to NULL (ON DELETE SET NULL)
    const deleteQuery = 'DELETE FROM count_sessions WHERE id = $1';
    await db.query(deleteQuery, [id]);

    res.json({ message: 'Count session deleted successfully' });
  } catch (error) {
    console.error('Error deleting count session:', error);
    res.status(500).json({ error: 'Failed to delete count session' });
  }
};
