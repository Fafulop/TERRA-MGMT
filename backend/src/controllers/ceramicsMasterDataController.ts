import { Request, Response } from 'express';
import { Pool } from 'pg';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';

// ============================================================
// CERAMIC PRODUCTS
// ============================================================

export const getAllProducts = async (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status || 'active';
    const concepto = req.query.concepto as string; // Filter by concepto if provided

    let query = `
      SELECT
        p.*,
        ic.name as item_category_name,
        ec.color_name as enamel_color_name,
        ec.hex_code as enamel_color_hex
      FROM ceramic_products p
      LEFT JOIN item_categories ic ON p.item_category_id = ic.id
      LEFT JOIN ceramic_enamel_colors ec ON p.enamel_color_id = ec.id
      WHERE p.status = $1
    `;

    const params: any[] = [status];

    // Filter by concepto if provided
    if (concepto) {
      params.push(concepto);
      query += ` AND p.concepto = $${params.length}`;
    }

    query += `
      ORDER BY p.name
    `;

    const result = await db.query(query, params);

    res.json({
      products: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      description,
      item_category_id,
      concepto,
      size_cm,
      capacity_ml,
      size_description,
      enamel_color_id
    } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    if (!item_category_id) {
      return res.status(400).json({ error: 'Item category is required' });
    }

    if (!concepto) {
      return res.status(400).json({ error: 'Concepto is required' });
    }

    // Validate concepto value
    const validConceptos = ['CRUDO', 'SANCOCHADO', 'ESMALTADO'];
    if (!validConceptos.includes(concepto)) {
      return res.status(400).json({
        error: 'Invalid concepto value',
        provided: concepto,
        valid: validConceptos
      });
    }

    // If concepto is ESMALTADO, enamel_color_id is required
    if (concepto === 'ESMALTADO' && !enamel_color_id) {
      return res.status(400).json({ error: 'Enamel color is required for ESMALTADO products' });
    }

    // If concepto is not ESMALTADO, enamel_color_id must be null
    if (concepto !== 'ESMALTADO' && enamel_color_id) {
      return res.status(400).json({ error: 'Enamel color is only allowed for ESMALTADO products' });
    }

    const query = `
      INSERT INTO ceramic_products (
        name, description, item_category_id, concepto,
        size_cm, capacity_ml, size_description, enamel_color_id, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
      RETURNING *
    `;

    const result = await db.query(query, [
      name,
      description || null,
      item_category_id,
      concepto,
      size_cm || null,
      capacity_ml || null,
      size_description || null,
      enamel_color_id || null
    ]);

    res.status(201).json({
      product: result.rows[0],
      message: 'Product created successfully'
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Product name already exists' });
    }
    if (error.code === '23503') { // Foreign key violation
      return res.status(400).json({ error: 'Item category or enamel color not found' });
    }
    res.status(500).json({ error: 'Failed to create product' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      status,
      item_category_id,
      concepto,
      size_cm,
      capacity_ml,
      size_description,
      enamel_color_id
    } = req.body;

    // Validate concepto if provided
    if (concepto !== undefined) {
      const validConceptos = ['CRUDO', 'SANCOCHADO', 'ESMALTADO'];
      if (!validConceptos.includes(concepto)) {
        return res.status(400).json({
          error: 'Invalid concepto value',
          provided: concepto,
          valid: validConceptos
        });
      }

      // If concepto is ESMALTADO, enamel_color_id must be provided (or already exist)
      if (concepto === 'ESMALTADO') {
        if (enamel_color_id === undefined) {
          // Check if product already has an enamel_color_id
          const checkQuery = 'SELECT enamel_color_id FROM ceramic_products WHERE id = $1';
          const checkResult = await db.query(checkQuery, [id]);
          if (checkResult.rows.length === 0 || !checkResult.rows[0].enamel_color_id) {
            return res.status(400).json({ error: 'Enamel color is required for ESMALTADO products' });
          }
        } else if (!enamel_color_id) {
          return res.status(400).json({ error: 'Enamel color is required for ESMALTADO products' });
        }
      }

      // If concepto is not ESMALTADO, enamel_color_id should be null
      if (concepto !== 'ESMALTADO' && enamel_color_id) {
        return res.status(400).json({ error: 'Enamel color is only allowed for ESMALTADO products' });
      }
    }

    const query = `
      UPDATE ceramic_products
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          status = COALESCE($3, status),
          item_category_id = COALESCE($4, item_category_id),
          concepto = COALESCE($5, concepto),
          size_cm = COALESCE($6, size_cm),
          capacity_ml = COALESCE($7, capacity_ml),
          size_description = COALESCE($8, size_description),
          enamel_color_id = COALESCE($9, enamel_color_id)
      WHERE id = $10
      RETURNING *
    `;

    const result = await db.query(query, [
      name,
      description,
      status,
      item_category_id,
      concepto,
      size_cm,
      capacity_ml,
      size_description,
      enamel_color_id,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      product: result.rows[0],
      message: 'Product updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Product name already exists' });
    }
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Item category or enamel color not found' });
    }
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// ============================================================
// CERAMIC SIZES - DEPRECATED
// ============================================================
// Size functions have been removed as ceramic_sizes table no longer exists.
// Size information is now stored directly in ceramic_products table
// (size_cm, capacity_ml, size_description).

// ============================================================
// ENAMEL COLORS
// ============================================================

export const getAllColors = async (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status || 'active';

    const query = `
      SELECT *
      FROM ceramic_enamel_colors
      WHERE status = $1
      ORDER BY color_name
    `;

    const result = await db.query(query, [status]);

    res.json({
      colors: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching colors:', error);
    res.status(500).json({ error: 'Failed to fetch colors' });
  }
};

export const createColor = async (req: AuthRequest, res: Response) => {
  try {
    const { color_name, color_code, hex_code } = req.body;

    if (!color_name) {
      return res.status(400).json({ error: 'Color name is required' });
    }

    const query = `
      INSERT INTO ceramic_enamel_colors (color_name, color_code, hex_code, status)
      VALUES ($1, $2, $3, 'active')
      RETURNING *
    `;

    const result = await db.query(query, [
      color_name,
      color_code || null,
      hex_code || '#CCCCCC'
    ]);

    res.status(201).json({
      color: result.rows[0],
      message: 'Color created successfully'
    });
  } catch (error: any) {
    console.error('Error creating color:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Color name already exists' });
    }
    res.status(500).json({ error: 'Failed to create color' });
  }
};

export const updateColor = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { color_name, color_code, hex_code, status } = req.body;

    const query = `
      UPDATE ceramic_enamel_colors
      SET color_name = COALESCE($1, color_name),
          color_code = COALESCE($2, color_code),
          hex_code = COALESCE($3, hex_code),
          status = COALESCE($4, status)
      WHERE id = $5
      RETURNING *
    `;

    const result = await db.query(query, [color_name, color_code, hex_code, status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Color not found' });
    }

    res.json({
      color: result.rows[0],
      message: 'Color updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating color:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Color name already exists' });
    }
    res.status(500).json({ error: 'Failed to update color' });
  }
};
