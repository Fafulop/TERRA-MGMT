import { Request, Response } from 'express';
import { Pool } from 'pg';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';

// ============================================================
// ITEM CATEGORIES CRUD
// ============================================================

export const getAllItemCategories = async (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status || 'active';

    const query = `
      SELECT
        ic.*,
        COUNT(p.id) as product_count
      FROM item_categories ic
      LEFT JOIN ceramic_products p ON ic.id = p.item_category_id AND p.status = 'active'
      WHERE ic.status = $1
      GROUP BY ic.id
      ORDER BY ic.name
    `;

    const result = await db.query(query, [status]);

    res.json({
      categories: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching item categories:', error);
    res.status(500).json({ error: 'Failed to fetch item categories' });
  }
};

export const createItemCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Convert to uppercase for consistency
    const upperName = name.trim().toUpperCase();

    const query = `
      INSERT INTO item_categories (name, description, status)
      VALUES ($1, $2, 'active')
      RETURNING *
    `;

    const result = await db.query(query, [upperName, description || null]);

    res.status(201).json({
      category: result.rows[0],
      message: 'Item category created successfully'
    });
  } catch (error: any) {
    console.error('Error creating item category:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: 'Failed to create item category' });
  }
};

export const updateItemCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(name.trim().toUpperCase());
      paramIndex++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(description || null);
      paramIndex++;
    }

    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    const query = `
      UPDATE item_categories
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item category not found' });
    }

    res.json({
      category: result.rows[0],
      message: 'Item category updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating item category:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: 'Failed to update item category' });
  }
};

export const deleteItemCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if category is in use
    const checkQuery = `
      SELECT COUNT(*) as product_count
      FROM ceramic_products
      WHERE item_category_id = $1
    `;

    const checkResult = await db.query(checkQuery, [id]);
    const productCount = parseInt(checkResult.rows[0].product_count);

    if (productCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete category that is in use by products',
        products_using: productCount
      });
    }

    // Delete the category
    const deleteQuery = `
      DELETE FROM item_categories
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(deleteQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item category not found' });
    }

    res.json({
      category: result.rows[0],
      message: 'Item category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting item category:', error);
    res.status(500).json({ error: 'Failed to delete item category' });
  }
};
