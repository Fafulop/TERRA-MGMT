import { Request, Response } from 'express';
import pool from '../config/database';

// Get all products
export const getProducts = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        p.*,
        t.name as tipo_name,
        s.size_cm,
        c.capacity_ml,
        e.color as esmalte_color,
        e.hex_code as esmalte_hex_code,
        u.username as created_by_name
      FROM produccion_products p
      LEFT JOIN produccion_tipo t ON p.tipo_id = t.id
      LEFT JOIN produccion_size s ON p.size_id = s.id
      LEFT JOIN produccion_capacity c ON p.capacity_id = c.id
      LEFT JOIN produccion_esmalte_color e ON p.esmalte_color_id = e.id
      LEFT JOIN users u ON p.created_by = u.id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// Get single product
export const getProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT
        p.*,
        t.name as tipo_name,
        s.size_cm,
        c.capacity_ml,
        e.color as esmalte_color,
        e.hex_code as esmalte_hex_code,
        u.username as created_by_name
      FROM produccion_products p
      LEFT JOIN produccion_tipo t ON p.tipo_id = t.id
      LEFT JOIN produccion_size s ON p.size_id = s.id
      LEFT JOIN produccion_capacity c ON p.capacity_id = c.id
      LEFT JOIN produccion_esmalte_color e ON p.esmalte_color_id = e.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

// Create product
export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      name,
      tipo_id,
      size_id,
      capacity_id,
      esmalte_color_id,
      peso_crudo,
      costo_mano_obra,
      cantidad_esmalte,
      costo_esmalte,
      costo_horneado,
      notes
    } = req.body;

    const userId = (req as any).user?.id || 1; // Default to user 1 if not authenticated

    if (!name || !tipo_id) {
      return res.status(400).json({ error: 'Name and Tipo are required fields' });
    }

    const result = await pool.query(
      `INSERT INTO produccion_products (
        name, tipo_id, size_id, capacity_id, esmalte_color_id,
        peso_crudo, costo_mano_obra, cantidad_esmalte, costo_esmalte, costo_horneado,
        notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        name,
        tipo_id,
        size_id,
        capacity_id,
        esmalte_color_id,
        peso_crudo || null,
        costo_mano_obra || null,
        cantidad_esmalte || null,
        costo_esmalte || null,
        costo_horneado || null,
        notes || null,
        userId
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

// Update product
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      tipo_id,
      size_id,
      capacity_id,
      esmalte_color_id,
      peso_crudo,
      costo_mano_obra,
      cantidad_esmalte,
      costo_esmalte,
      costo_horneado,
      notes
    } = req.body;

    const result = await pool.query(
      `UPDATE produccion_products SET
        name = COALESCE($1, name),
        tipo_id = COALESCE($2, tipo_id),
        size_id = COALESCE($3, size_id),
        capacity_id = COALESCE($4, capacity_id),
        esmalte_color_id = COALESCE($5, esmalte_color_id),
        peso_crudo = COALESCE($6, peso_crudo),
        costo_mano_obra = COALESCE($7, costo_mano_obra),
        cantidad_esmalte = COALESCE($8, cantidad_esmalte),
        costo_esmalte = COALESCE($9, costo_esmalte),
        costo_horneado = COALESCE($10, costo_horneado),
        notes = COALESCE($11, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *`,
      [
        name,
        tipo_id,
        size_id,
        capacity_id,
        esmalte_color_id,
        peso_crudo,
        costo_mano_obra,
        cantidad_esmalte,
        costo_esmalte,
        costo_horneado,
        notes,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// Delete product
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM produccion_products WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};
