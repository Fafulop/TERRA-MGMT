import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Generate unique internal ID for inventory items
const generateItemId = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `ITEM-${timestamp}-${random}`;
};

// Get all items (catalog)
export const getItems = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const filters = req.query;
    const limit = parseInt(filters.limit as string) || 100;
    const offset = parseInt(filters.offset as string) || 0;

    let whereClause = `WHERE 1=1`;
    let params: any[] = [];
    let paramIndex = 1;

    // Apply filters
    if (filters.category) {
      whereClause += ` AND i.category = $${paramIndex}`;
      params.push(filters.category);
      paramIndex++;
    }

    if (filters.status) {
      whereClause += ` AND i.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.area) {
      whereClause += ` AND i.area ILIKE $${paramIndex}`;
      params.push(`%${filters.area}%`);
      paramIndex++;
    }

    if (filters.subarea) {
      whereClause += ` AND i.subarea ILIKE $${paramIndex}`;
      params.push(`%${filters.subarea}%`);
      paramIndex++;
    }

    if (filters.search) {
      whereClause += ` AND (i.name ILIKE $${paramIndex} OR i.description ILIKE $${paramIndex} OR i.category ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Get items with creator information
    const itemsQuery = `
      SELECT
        i.*,
        u.username as created_by_username,
        u.first_name,
        u.last_name
      FROM inventario_items i
      LEFT JOIN users u ON i.created_by = u.id
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);
    const itemsResult = await db.query(itemsQuery, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM inventario_items i
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    res.json({
      items: itemsResult.rows,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
};

// Get a single item by ID
export const getItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const query = `
      SELECT
        i.*,
        u.username as created_by_username,
        u.first_name,
        u.last_name
      FROM inventario_items i
      LEFT JOIN users u ON i.created_by = u.id
      WHERE i.id = $1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
};

// Create a new item
export const createItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const {
      name,
      description,
      category,
      unit,
      cost_per_unit,
      area,
      subarea,
      notes,
      tags
    } = req.body;

    // Validation
    if (!name || !category || !unit) {
      return res.status(400).json({
        error: 'Missing required fields: name, category, unit'
      });
    }

    const internal_id = generateItemId();

    const query = `
      INSERT INTO inventario_items (
        created_by, internal_id, name, description, category, unit,
        cost_per_unit, area, subarea, notes, tags
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      userId,
      internal_id,
      name,
      description || null,
      category,
      unit,
      cost_per_unit || null,
      area || null,
      subarea || null,
      notes || null,
      tags || null
    ];

    const result = await db.query(query, values);

    res.status(201).json({
      message: 'Item created successfully',
      item: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
};

// Update an item
export const updateItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const {
      name,
      description,
      category,
      unit,
      cost_per_unit,
      area,
      subarea,
      notes,
      tags,
      status
    } = req.body;

    // Check if item exists
    const checkQuery = 'SELECT * FROM inventario_items WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const query = `
      UPDATE inventario_items
      SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        unit = COALESCE($4, unit),
        cost_per_unit = COALESCE($5, cost_per_unit),
        area = COALESCE($6, area),
        subarea = COALESCE($7, subarea),
        notes = COALESCE($8, notes),
        tags = COALESCE($9, tags),
        status = COALESCE($10, status)
      WHERE id = $11
      RETURNING *
    `;

    const values = [
      name,
      description,
      category,
      unit,
      cost_per_unit,
      area,
      subarea,
      notes,
      tags,
      status,
      id
    ];

    const result = await db.query(query, values);

    res.json({
      message: 'Item updated successfully',
      item: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
};

// Toggle item active/inactive status
export const toggleItemStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if item exists
    const checkQuery = 'SELECT * FROM inventario_items WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const currentStatus = checkResult.rows[0].status;
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    const query = `
      UPDATE inventario_items
      SET status = $1
      WHERE id = $2
      RETURNING *
    `;

    const result = await db.query(query, [newStatus, id]);

    res.json({
      message: `Item marked as ${newStatus}`,
      item: result.rows[0]
    });
  } catch (error) {
    console.error('Error toggling item status:', error);
    res.status(500).json({ error: 'Failed to toggle item status' });
  }
};

// Keep old function name for compatibility but use new logic
export const deleteItem = toggleItemStatus;

// Permanently delete an item (hard delete)
export const permanentlyDeleteItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if item exists
    const checkQuery = 'SELECT * FROM inventario_items WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check if item has any counts associated with it
    const countsQuery = 'SELECT COUNT(*) as count FROM inventario_counts WHERE item_id = $1';
    const countsResult = await db.query(countsQuery, [id]);
    const hasAssociatedCounts = parseInt(countsResult.rows[0].count) > 0;

    if (hasAssociatedCounts) {
      return res.status(400).json({
        error: 'Cannot delete item with associated inventory counts. Please set to inactive instead.',
        has_counts: true
      });
    }

    // Permanently delete the item
    const deleteQuery = 'DELETE FROM inventario_items WHERE id = $1 RETURNING *';
    const result = await db.query(deleteQuery, [id]);

    res.json({
      message: 'Item permanently deleted',
      item: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
};

// Get item count history
export const getItemHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const query = `
      SELECT
        c.*,
        u.username as counted_by_username,
        s.session_name,
        s.status as session_status
      FROM inventario_counts c
      LEFT JOIN users u ON c.counted_by = u.id
      LEFT JOIN count_sessions s ON c.session_id = s.id
      WHERE c.item_id = $1
      ORDER BY c.count_date DESC, c.created_at DESC
    `;

    const result = await db.query(query, [id]);

    res.json({
      item_id: id,
      counts: result.rows,
      total_counts: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching item history:', error);
    res.status(500).json({ error: 'Failed to fetch item history' });
  }
};
