import { Request, Response } from 'express';
import { Pool } from 'pg';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';

// ============================================================
// STAGE 1: CRUDO (RAW) - Initial Input
// ============================================================

export const addToStage1 = async (req: AuthRequest, res: Response) => {
  const client = await db.connect();

  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { product_id, size_id, quantity, notes } = req.body;

    if (!product_id || !size_id || !quantity || quantity <= 0) {
      return res.status(400).json({
        error: 'Product ID, size ID, and positive quantity are required'
      });
    }

    await client.query('BEGIN');

    // 1. Create transaction record
    const transactionQuery = `
      INSERT INTO stage_transactions (
        from_stage, to_stage, product_id, size_id,
        quantity_input, quantity_deducted, notes, created_by
      )
      VALUES (NULL, 1, $1, $2, $3, 0, $4, $5)
      RETURNING *
    `;

    const transactionResult = await client.query(transactionQuery, [
      product_id,
      size_id,
      quantity,
      notes || null,
      userId
    ]);

    // 2. Update or insert into stage_1_inventory
    const inventoryQuery = `
      INSERT INTO stage_1_inventory (product_id, size_id, quantity, updated_by)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (product_id, size_id)
      DO UPDATE SET
        quantity = stage_1_inventory.quantity + EXCLUDED.quantity,
        last_updated = CURRENT_TIMESTAMP,
        updated_by = EXCLUDED.updated_by
      RETURNING *
    `;

    const inventoryResult = await client.query(inventoryQuery, [
      product_id,
      size_id,
      quantity,
      userId
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      transaction: transactionResult.rows[0],
      inventory: inventoryResult.rows[0],
      message: 'Successfully added to Stage 1 (Crudo)'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding to Stage 1:', error);
    res.status(500).json({ error: 'Failed to add to Stage 1' });
  } finally {
    client.release();
  }
};

// ============================================================
// STAGE 1 → STAGE 2: SANCOCHADO (LOW HEAT OVEN)
// ============================================================

export const transitionStage1To2 = async (req: AuthRequest, res: Response) => {
  const client = await db.connect();

  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { product_id, size_id, quantity_input, quantity_deducted, notes } = req.body;

    // Validation
    if (!product_id || !size_id || !quantity_input || !quantity_deducted) {
      return res.status(400).json({
        error: 'Product ID, size ID, quantity input (OUT), and quantity deducted (IN) are required'
      });
    }

    if (quantity_input < 0 || quantity_deducted < 0) {
      return res.status(400).json({
        error: 'Quantities must be positive'
      });
    }

    if (quantity_input > quantity_deducted) {
      return res.status(400).json({
        error: 'Quantity OUT cannot be greater than quantity IN'
      });
    }

    await client.query('BEGIN');

    // 1. Check if enough inventory in Stage 1
    const checkQuery = `
      SELECT quantity
      FROM stage_1_inventory
      WHERE product_id = $1 AND size_id = $2
    `;

    const checkResult = await client.query(checkQuery, [product_id, size_id]);

    if (checkResult.rows.length === 0 || checkResult.rows[0].quantity < quantity_deducted) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Insufficient inventory in Stage 1',
        available: checkResult.rows[0]?.quantity || 0,
        required: quantity_deducted
      });
    }

    // 2. Create transaction record (triggers will auto-calculate loss)
    const transactionQuery = `
      INSERT INTO stage_transactions (
        from_stage, to_stage, product_id, size_id,
        quantity_input, quantity_deducted, notes, created_by
      )
      VALUES (1, 2, $1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const transactionResult = await client.query(transactionQuery, [
      product_id,
      size_id,
      quantity_input,
      quantity_deducted,
      notes || null,
      userId
    ]);

    // 3. Deduct from Stage 1
    const deductStage1Query = `
      UPDATE stage_1_inventory
      SET quantity = quantity - $1,
          last_updated = CURRENT_TIMESTAMP,
          updated_by = $2
      WHERE product_id = $3 AND size_id = $4
      RETURNING *
    `;

    const stage1Result = await client.query(deductStage1Query, [
      quantity_deducted,
      userId,
      product_id,
      size_id
    ]);

    // 4. Add to Stage 2
    const addStage2Query = `
      INSERT INTO stage_2_inventory (product_id, size_id, quantity, updated_by)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (product_id, size_id)
      DO UPDATE SET
        quantity = stage_2_inventory.quantity + EXCLUDED.quantity,
        last_updated = CURRENT_TIMESTAMP,
        updated_by = EXCLUDED.updated_by
      RETURNING *
    `;

    const stage2Result = await client.query(addStage2Query, [
      product_id,
      size_id,
      quantity_input,
      userId
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      transaction: transactionResult.rows[0],
      stage1_inventory: stage1Result.rows[0],
      stage2_inventory: stage2Result.rows[0],
      message: 'Successfully transitioned from Stage 1 to Stage 2 (Sancochado)'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error transitioning Stage 1 to 2:', error);
    res.status(500).json({ error: 'Failed to transition to Stage 2' });
  } finally {
    client.release();
  }
};

// ============================================================
// STAGE 2 → STAGE 3: ESMALTADO (HIGH HEAT OVEN)
// ============================================================

export const transitionStage2To3 = async (req: AuthRequest, res: Response) => {
  const client = await db.connect();

  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const {
      product_id,
      size_id,
      enamel_color_id,
      quantity_input,
      quantity_deducted,
      notes
    } = req.body;

    // Validation
    if (!product_id || !size_id || !enamel_color_id || !quantity_input || !quantity_deducted) {
      return res.status(400).json({
        error: 'Product ID, size ID, enamel color ID, quantity input (OUT), and quantity deducted (IN) are required'
      });
    }

    if (quantity_input < 0 || quantity_deducted < 0) {
      return res.status(400).json({
        error: 'Quantities must be positive'
      });
    }

    if (quantity_input > quantity_deducted) {
      return res.status(400).json({
        error: 'Quantity OUT cannot be greater than quantity IN'
      });
    }

    await client.query('BEGIN');

    // 1. Check if enough inventory in Stage 2
    const checkQuery = `
      SELECT quantity
      FROM stage_2_inventory
      WHERE product_id = $1 AND size_id = $2
    `;

    const checkResult = await client.query(checkQuery, [product_id, size_id]);

    if (checkResult.rows.length === 0 || checkResult.rows[0].quantity < quantity_deducted) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Insufficient inventory in Stage 2',
        available: checkResult.rows[0]?.quantity || 0,
        required: quantity_deducted
      });
    }

    // 2. Create transaction record (triggers will auto-calculate loss)
    const transactionQuery = `
      INSERT INTO stage_transactions (
        from_stage, to_stage, product_id, size_id, enamel_color_id,
        quantity_input, quantity_deducted, notes, created_by
      )
      VALUES (2, 3, $1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const transactionResult = await client.query(transactionQuery, [
      product_id,
      size_id,
      enamel_color_id,
      quantity_input,
      quantity_deducted,
      notes || null,
      userId
    ]);

    // 3. Deduct from Stage 2
    const deductStage2Query = `
      UPDATE stage_2_inventory
      SET quantity = quantity - $1,
          last_updated = CURRENT_TIMESTAMP,
          updated_by = $2
      WHERE product_id = $3 AND size_id = $4
      RETURNING *
    `;

    const stage2Result = await client.query(deductStage2Query, [
      quantity_deducted,
      userId,
      product_id,
      size_id
    ]);

    // 4. Add to Stage 3
    const addStage3Query = `
      INSERT INTO stage_3_inventory (product_id, size_id, enamel_color_id, quantity, updated_by)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (product_id, size_id, enamel_color_id)
      DO UPDATE SET
        quantity = stage_3_inventory.quantity + EXCLUDED.quantity,
        last_updated = CURRENT_TIMESTAMP,
        updated_by = EXCLUDED.updated_by
      RETURNING *
    `;

    const stage3Result = await client.query(addStage3Query, [
      product_id,
      size_id,
      enamel_color_id,
      quantity_input,
      userId
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      transaction: transactionResult.rows[0],
      stage2_inventory: stage2Result.rows[0],
      stage3_inventory: stage3Result.rows[0],
      message: 'Successfully transitioned from Stage 2 to Stage 3 (Esmaltado)'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error transitioning Stage 2 to 3:', error);
    res.status(500).json({ error: 'Failed to transition to Stage 3' });
  } finally {
    client.release();
  }
};

// ============================================================
// GET CURRENT INVENTORY BY STAGE
// ============================================================

export const getStage1Inventory = async (req: AuthRequest, res: Response) => {
  try {
    const query = `
      SELECT
        i.*,
        p.name as product_name,
        s.size_name,
        s.size_code,
        u.username as updated_by_username
      FROM stage_1_inventory i
      JOIN ceramic_products p ON i.product_id = p.id
      JOIN ceramic_sizes s ON i.size_id = s.id
      LEFT JOIN users u ON i.updated_by = u.id
      WHERE p.status = 'active' AND s.status = 'active' AND i.quantity > 0
      ORDER BY p.name, s.size_order, s.size_name
    `;

    const result = await db.query(query);

    const totalQuantity = result.rows.reduce((sum, row) => sum + parseFloat(row.quantity), 0);

    res.json({
      inventory: result.rows,
      summary: {
        total_items: result.rows.length,
        total_quantity: totalQuantity
      }
    });
  } catch (error) {
    console.error('Error fetching Stage 1 inventory:', error);
    res.status(500).json({ error: 'Failed to fetch Stage 1 inventory' });
  }
};

export const getStage2Inventory = async (req: AuthRequest, res: Response) => {
  try {
    const query = `
      SELECT
        i.*,
        p.name as product_name,
        s.size_name,
        s.size_code,
        u.username as updated_by_username
      FROM stage_2_inventory i
      JOIN ceramic_products p ON i.product_id = p.id
      JOIN ceramic_sizes s ON i.size_id = s.id
      LEFT JOIN users u ON i.updated_by = u.id
      WHERE p.status = 'active' AND s.status = 'active' AND i.quantity > 0
      ORDER BY p.name, s.size_order, s.size_name
    `;

    const result = await db.query(query);

    const totalQuantity = result.rows.reduce((sum, row) => sum + parseFloat(row.quantity), 0);

    res.json({
      inventory: result.rows,
      summary: {
        total_items: result.rows.length,
        total_quantity: totalQuantity
      }
    });
  } catch (error) {
    console.error('Error fetching Stage 2 inventory:', error);
    res.status(500).json({ error: 'Failed to fetch Stage 2 inventory' });
  }
};

export const getStage3Inventory = async (req: AuthRequest, res: Response) => {
  try {
    const query = `
      SELECT
        i.*,
        p.name as product_name,
        s.size_name,
        s.size_code,
        c.color_name,
        c.color_code,
        c.hex_code,
        u.username as updated_by_username
      FROM stage_3_inventory i
      JOIN ceramic_products p ON i.product_id = p.id
      JOIN ceramic_sizes s ON i.size_id = s.id
      JOIN ceramic_enamel_colors c ON i.enamel_color_id = c.id
      LEFT JOIN users u ON i.updated_by = u.id
      WHERE p.status = 'active' AND s.status = 'active' AND c.status = 'active' AND i.quantity > 0
      ORDER BY p.name, s.size_order, s.size_name, c.color_name
    `;

    const result = await db.query(query);

    const totalQuantity = result.rows.reduce((sum, row) => sum + parseFloat(row.quantity), 0);

    res.json({
      inventory: result.rows,
      summary: {
        total_items: result.rows.length,
        total_quantity: totalQuantity
      }
    });
  } catch (error) {
    console.error('Error fetching Stage 3 inventory:', error);
    res.status(500).json({ error: 'Failed to fetch Stage 3 inventory' });
  }
};

// ============================================================
// GET TRANSACTION HISTORY
// ============================================================

export const getTransactionHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { from_stage, to_stage, product_id, limit = 50, offset = 0 } = req.query;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (from_stage !== undefined) {
      whereClause += ` AND t.from_stage ${from_stage === 'null' ? 'IS NULL' : `= $${paramIndex}`}`;
      if (from_stage !== 'null') {
        params.push(from_stage);
        paramIndex++;
      }
    }

    if (to_stage) {
      whereClause += ` AND t.to_stage = $${paramIndex}`;
      params.push(to_stage);
      paramIndex++;
    }

    if (product_id) {
      whereClause += ` AND t.product_id = $${paramIndex}`;
      params.push(product_id);
      paramIndex++;
    }

    params.push(limit, offset);

    const query = `
      SELECT
        t.*,
        p.name as product_name,
        s.size_name,
        c.color_name,
        u.username as created_by_username,
        u.first_name,
        u.last_name
      FROM stage_transactions t
      JOIN ceramic_products p ON t.product_id = p.id
      JOIN ceramic_sizes s ON t.size_id = s.id
      LEFT JOIN ceramic_enamel_colors c ON t.enamel_color_id = c.id
      LEFT JOIN users u ON t.created_by = u.id
      ${whereClause}
      ORDER BY t.transaction_date DESC, t.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await db.query(query, params);

    const countQuery = `
      SELECT COUNT(*)
      FROM stage_transactions t
      ${whereClause}
    `;

    const countResult = await db.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);

    res.json({
      transactions: result.rows,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total,
        hasMore: parseInt(offset as string) + result.rows.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
};

// ============================================================
// GET LOSS ANALYSIS
// ============================================================

export const getLossAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    const query = `
      SELECT * FROM v_loss_analysis
      ORDER BY transition, product_name, size_name
    `;

    const result = await db.query(query);

    res.json({
      loss_analysis: result.rows
    });
  } catch (error) {
    console.error('Error fetching loss analysis:', error);
    res.status(500).json({ error: 'Failed to fetch loss analysis' });
  }
};
