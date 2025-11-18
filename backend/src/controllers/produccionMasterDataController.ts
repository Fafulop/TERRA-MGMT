import { Request, Response } from 'express';
import pool from '../config/database';

// ===== TIPO Controllers =====
export const getTipos = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM produccion_tipo ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tipos:', error);
    res.status(500).json({ error: 'Failed to fetch tipos' });
  }
};

export const createTipo = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await pool.query(
      'INSERT INTO produccion_tipo (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating tipo:', error);
    res.status(500).json({ error: 'Failed to create tipo' });
  }
};

export const deleteTipo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM produccion_tipo WHERE id = $1', [id]);
    res.json({ message: 'Tipo deleted successfully' });
  } catch (error) {
    console.error('Error deleting tipo:', error);
    res.status(500).json({ error: 'Failed to delete tipo' });
  }
};

// ===== SIZE Controllers =====
export const getSizes = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM produccion_size ORDER BY size_cm');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sizes:', error);
    res.status(500).json({ error: 'Failed to fetch sizes' });
  }
};

export const createSize = async (req: Request, res: Response) => {
  try {
    const { size_cm } = req.body;
    if (!size_cm) {
      return res.status(400).json({ error: 'Size in CM is required' });
    }

    const result = await pool.query(
      'INSERT INTO produccion_size (size_cm) VALUES ($1) RETURNING *',
      [size_cm]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating size:', error);
    res.status(500).json({ error: 'Failed to create size' });
  }
};

export const deleteSize = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM produccion_size WHERE id = $1', [id]);
    res.json({ message: 'Size deleted successfully' });
  } catch (error) {
    console.error('Error deleting size:', error);
    res.status(500).json({ error: 'Failed to delete size' });
  }
};

// ===== CAPACITY Controllers =====
export const getCapacities = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM produccion_capacity ORDER BY capacity_ml');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching capacities:', error);
    res.status(500).json({ error: 'Failed to fetch capacities' });
  }
};

export const createCapacity = async (req: Request, res: Response) => {
  try {
    const { capacity_ml } = req.body;
    if (!capacity_ml) {
      return res.status(400).json({ error: 'Capacity in ML is required' });
    }

    const result = await pool.query(
      'INSERT INTO produccion_capacity (capacity_ml) VALUES ($1) RETURNING *',
      [capacity_ml]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating capacity:', error);
    res.status(500).json({ error: 'Failed to create capacity' });
  }
};

export const deleteCapacity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM produccion_capacity WHERE id = $1', [id]);
    res.json({ message: 'Capacity deleted successfully' });
  } catch (error) {
    console.error('Error deleting capacity:', error);
    res.status(500).json({ error: 'Failed to delete capacity' });
  }
};

// ===== ESMALTE COLOR Controllers =====
export const getEsmalteColors = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM produccion_esmalte_color ORDER BY color');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching esmalte colors:', error);
    res.status(500).json({ error: 'Failed to fetch esmalte colors' });
  }
};

export const createEsmalteColor = async (req: Request, res: Response) => {
  try {
    const { color, hex_code } = req.body;
    if (!color) {
      return res.status(400).json({ error: 'Color is required' });
    }

    const result = await pool.query(
      'INSERT INTO produccion_esmalte_color (color, hex_code) VALUES ($1, $2) RETURNING *',
      [color, hex_code || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating esmalte color:', error);
    res.status(500).json({ error: 'Failed to create esmalte color' });
  }
};

export const deleteEsmalteColor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM produccion_esmalte_color WHERE id = $1', [id]);
    res.json({ message: 'Esmalte color deleted successfully' });
  } catch (error) {
    console.error('Error deleting esmalte color:', error);
    res.status(500).json({ error: 'Failed to delete esmalte color' });
  }
};
