import { Request, Response } from 'express';
import { Pool } from 'pg';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Generate unique internal ID for inventory items
const generateInventarioId = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `INV-${timestamp}-${random}`;
};

// Get all inventory items (viewable by all users)
export const getInventarioItems = async (req: AuthRequest, res: Response) => {
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

    if (filters.location) {
      whereClause += ` AND i.location ILIKE $${paramIndex}`;
      params.push(`%${filters.location}%`);
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
      whereClause += ` AND (i.name ILIKE $${paramIndex} OR i.description ILIKE $${paramIndex} OR i.category ILIKE $${paramIndex} OR i.location ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Get inventory items with user information
    const itemsQuery = `
      SELECT
        i.*,
        u.username,
        u.first_name,
        u.last_name
      FROM inventario_items i
      LEFT JOIN users u ON i.user_id = u.id
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);
    const itemsResult = await db.query(itemsQuery, params);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM inventario_items i
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    // Get summary statistics
    const summaryQuery = `
      SELECT
        COUNT(*) as total_items,
        COUNT(CASE WHEN status = 'in-stock' THEN 1 END) as in_stock,
        COUNT(CASE WHEN status = 'low-stock' THEN 1 END) as low_stock,
        COUNT(CASE WHEN status = 'out-of-stock' THEN 1 END) as out_of_stock,
        COALESCE(SUM(quantity * COALESCE(cost_per_unit, 0)), 0) as total_value,
        COUNT(DISTINCT category) as categories_count
      FROM inventario_items i
      ${whereClause}
    `;

    const summaryResult = await db.query(summaryQuery, params.slice(0, -2));

    res.json({
      items: itemsResult.rows,
      summary: summaryResult.rows[0],
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({ error: 'Failed to fetch inventory items' });
  }
};

// Get a single inventory item by ID
export const getInventarioItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const query = `
      SELECT
        i.*,
        u.username,
        u.first_name,
        u.last_name
      FROM inventario_items i
      LEFT JOIN users u ON i.user_id = u.id
      WHERE i.id = $1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ error: 'Failed to fetch inventory item' });
  }
};

// Create a new inventory item
export const createInventarioItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const {
      name,
      description,
      category,
      quantity,
      unit,
      min_stock,
      location,
      cost_per_unit,
      area,
      subarea,
      notes,
      tags
    } = req.body;

    // Validation
    if (!name || !category || quantity === undefined || !unit || min_stock === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: name, category, quantity, unit, min_stock'
      });
    }

    const internal_id = generateInventarioId();

    const query = `
      INSERT INTO inventario_items (
        user_id, internal_id, name, description, category, quantity, unit,
        min_stock, location, cost_per_unit, area, subarea, notes, tags
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const values = [
      userId,
      internal_id,
      name,
      description || null,
      category,
      quantity,
      unit,
      min_stock,
      location || null,
      cost_per_unit || null,
      area || null,
      subarea || null,
      notes || null,
      tags || null
    ];

    const result = await db.query(query, values);

    res.status(201).json({
      message: 'Inventory item created successfully',
      item: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
};

// Update an inventory item
export const updateInventarioItem = async (req: AuthRequest, res: Response) => {
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
      quantity,
      unit,
      min_stock,
      location,
      cost_per_unit,
      area,
      subarea,
      notes,
      tags
    } = req.body;

    // Check if item exists
    const checkQuery = 'SELECT * FROM inventario_items WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const query = `
      UPDATE inventario_items
      SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        quantity = COALESCE($4, quantity),
        unit = COALESCE($5, unit),
        min_stock = COALESCE($6, min_stock),
        location = COALESCE($7, location),
        cost_per_unit = COALESCE($8, cost_per_unit),
        area = COALESCE($9, area),
        subarea = COALESCE($10, subarea),
        notes = COALESCE($11, notes),
        tags = COALESCE($12, tags)
      WHERE id = $13
      RETURNING *
    `;

    const values = [
      name,
      description,
      category,
      quantity,
      unit,
      min_stock,
      location,
      cost_per_unit,
      area,
      subarea,
      notes,
      tags,
      id
    ];

    const result = await db.query(query, values);

    res.json({
      message: 'Inventory item updated successfully',
      item: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
};

// Delete an inventory item
export const deleteInventarioItem = async (req: AuthRequest, res: Response) => {
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
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const deleteQuery = 'DELETE FROM inventario_items WHERE id = $1';
    await db.query(deleteQuery, [id]);

    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
};

// Get inventory summary
export const getInventarioSummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const query = `
      SELECT
        COUNT(*) as total_items,
        COUNT(CASE WHEN status = 'in-stock' THEN 1 END) as in_stock,
        COUNT(CASE WHEN status = 'low-stock' THEN 1 END) as low_stock,
        COUNT(CASE WHEN status = 'out-of-stock' THEN 1 END) as out_of_stock,
        COALESCE(SUM(quantity * COALESCE(cost_per_unit, 0)), 0) as total_value,
        COUNT(DISTINCT category) as categories_count
      FROM inventario_items
    `;

    const result = await db.query(query);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching inventory summary:', error);
    res.status(500).json({ error: 'Failed to fetch inventory summary' });
  }
};

// Get low stock items
export const getLowStockItems = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const query = `
      SELECT
        i.*,
        u.username,
        u.first_name,
        u.last_name
      FROM inventario_items i
      LEFT JOIN users u ON i.user_id = u.id
      WHERE i.status IN ('low-stock', 'out-of-stock')
      ORDER BY i.status DESC, i.quantity ASC
    `;

    const result = await db.query(query);

    res.json({
      items: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ error: 'Failed to fetch low stock items' });
  }
};

// Adjust quantity only (quick update)
export const adjustQuantity = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { quantity, adjustment_note } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (quantity === undefined) {
      return res.status(400).json({ error: 'Quantity is required' });
    }

    // Check if item exists
    const checkQuery = 'SELECT * FROM inventario_items WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const query = `
      UPDATE inventario_items
      SET quantity = $1
      WHERE id = $2
      RETURNING *
    `;

    const result = await db.query(query, [quantity, id]);

    res.json({
      message: 'Quantity adjusted successfully',
      item: result.rows[0]
    });
  } catch (error) {
    console.error('Error adjusting quantity:', error);
    res.status(500).json({ error: 'Failed to adjust quantity' });
  }
};
