import { Request, Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Get all facturas for a specific ledger entry
export const getFacturasForEntry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { entryId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify ledger entry exists
    const entryCheck = await db.query(
      'SELECT id FROM ledger_entries_mxn WHERE id = $1',
      [entryId]
    );

    if (entryCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Ledger entry not found' });
    }

    // Get all facturas for this entry with uploader info
    const query = `
      SELECT
        lf.*,
        u.username,
        u.first_name,
        u.last_name
      FROM ledger_facturas_mxn lf
      LEFT JOIN users u ON lf.uploaded_by = u.id
      WHERE lf.ledger_entry_id = $1
      ORDER BY lf.created_at DESC
    `;

    const result = await db.query(query, [entryId]);

    // Map to camelCase for frontend
    const facturas = result.rows.map((row: any) => ({
      id: row.id,
      ledgerEntryId: row.ledger_entry_id,
      fileName: row.file_name,
      fileUrl: row.file_url,
      fileSize: row.file_size,
      fileType: row.file_type,
      folio: row.folio,
      uuid: row.uuid,
      rfcEmisor: row.rfc_emisor,
      rfcReceptor: row.rfc_receptor,
      total: row.total ? parseFloat(row.total) : null,
      subtotal: row.subtotal ? parseFloat(row.subtotal) : null,
      iva: row.iva ? parseFloat(row.iva) : null,
      fechaTimbrado: row.fecha_timbrado,
      notes: row.notes,
      uploadedBy: {
        username: row.username,
        firstName: row.first_name,
        lastName: row.last_name
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json(facturas);
  } catch (error) {
    console.error('Error fetching facturas:', error);
    res.status(500).json({ error: 'Failed to fetch facturas' });
  }
};

// Create a new factura for a ledger entry
export const createFactura = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { entryId } = req.params;
    const {
      file,
      folio,
      uuid,
      rfcEmisor,
      rfcReceptor,
      total,
      subtotal,
      iva,
      fechaTimbrado,
      notes
    } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Validate required fields
    if (!file || !file.name || !file.url) {
      return res.status(400).json({ error: 'File information is required' });
    }

    // Verify user owns the ledger entry
    const entryCheck = await db.query(
      'SELECT user_id FROM ledger_entries_mxn WHERE id = $1',
      [entryId]
    );

    if (entryCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Ledger entry not found' });
    }

    if (entryCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'You can only add facturas to your own entries' });
    }

    // Validate file type (should be PDF or XML)
    const validTypes = ['application/pdf', 'text/xml', 'application/xml'];
    if (file.type && !validTypes.includes(file.type)) {
      return res.status(400).json({
        error: 'Invalid file type. Only PDF and XML files are allowed for facturas'
      });
    }

    // Check if UUID already exists (if provided)
    if (uuid) {
      const uuidCheck = await db.query(
        'SELECT id FROM ledger_facturas_mxn WHERE uuid = $1',
        [uuid]
      );
      if (uuidCheck.rows.length > 0) {
        return res.status(400).json({
          error: 'A factura with this UUID already exists',
          existingId: uuidCheck.rows[0].id
        });
      }
    }

    // Insert factura
    const insertQuery = `
      INSERT INTO ledger_facturas_mxn (
        ledger_entry_id,
        file_name,
        file_url,
        file_size,
        file_type,
        folio,
        uuid,
        rfc_emisor,
        rfc_receptor,
        total,
        subtotal,
        iva,
        fecha_timbrado,
        notes,
        uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const values = [
      entryId,
      file.name,
      file.url,
      file.size || null,
      file.type || null,
      folio || null,
      uuid || null,
      rfcEmisor || null,
      rfcReceptor || null,
      total || null,
      subtotal || null,
      iva || null,
      fechaTimbrado || null,
      notes || null,
      userId
    ];

    const result = await db.query(insertQuery, values);
    const factura = result.rows[0];

    // Get user info for response
    const userQuery = await db.query(
      'SELECT username, first_name, last_name FROM users WHERE id = $1',
      [userId]
    );
    const user = userQuery.rows[0];

    // Map to camelCase for frontend
    const mappedFactura = {
      id: factura.id,
      ledgerEntryId: factura.ledger_entry_id,
      fileName: factura.file_name,
      fileUrl: factura.file_url,
      fileSize: factura.file_size,
      fileType: factura.file_type,
      folio: factura.folio,
      uuid: factura.uuid,
      rfcEmisor: factura.rfc_emisor,
      rfcReceptor: factura.rfc_receptor,
      total: factura.total ? parseFloat(factura.total) : null,
      subtotal: factura.subtotal ? parseFloat(factura.subtotal) : null,
      iva: factura.iva ? parseFloat(factura.iva) : null,
      fechaTimbrado: factura.fecha_timbrado,
      notes: factura.notes,
      uploadedBy: {
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name
      },
      createdAt: factura.created_at,
      updatedAt: factura.updated_at
    };

    res.status(201).json(mappedFactura);
  } catch (error) {
    console.error('Error creating factura:', error);
    res.status(500).json({ error: 'Failed to create factura' });
  }
};

// Update a factura (owner only)
export const updateFactura = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const {
      folio,
      uuid,
      rfcEmisor,
      rfcReceptor,
      total,
      subtotal,
      iva,
      fechaTimbrado,
      notes
    } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if factura exists and user owns it
    const checkQuery = `
      SELECT lf.id, lf.ledger_entry_id, le.user_id
      FROM ledger_facturas_mxn lf
      JOIN ledger_entries_mxn le ON lf.ledger_entry_id = le.id
      WHERE lf.id = $1
    `;
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Factura not found' });
    }

    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'You can only update your own facturas' });
    }

    // Check if UUID is being changed and if it already exists
    if (uuid) {
      const uuidCheck = await db.query(
        'SELECT id FROM ledger_facturas_mxn WHERE uuid = $1 AND id != $2',
        [uuid, id]
      );
      if (uuidCheck.rows.length > 0) {
        return res.status(400).json({
          error: 'A factura with this UUID already exists'
        });
      }
    }

    // Update factura
    const updateQuery = `
      UPDATE ledger_facturas_mxn
      SET
        folio = $1,
        uuid = $2,
        rfc_emisor = $3,
        rfc_receptor = $4,
        total = $5,
        subtotal = $6,
        iva = $7,
        fecha_timbrado = $8,
        notes = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
    `;

    const values = [
      folio || null,
      uuid || null,
      rfcEmisor || null,
      rfcReceptor || null,
      total || null,
      subtotal || null,
      iva || null,
      fechaTimbrado || null,
      notes || null,
      id
    ];

    const result = await db.query(updateQuery, values);
    const factura = result.rows[0];

    // Get user info for response
    const userQuery = await db.query(
      'SELECT username, first_name, last_name FROM users WHERE id = $1',
      [factura.uploaded_by]
    );
    const user = userQuery.rows[0];

    // Map to camelCase for frontend
    const mappedFactura = {
      id: factura.id,
      ledgerEntryId: factura.ledger_entry_id,
      fileName: factura.file_name,
      fileUrl: factura.file_url,
      fileSize: factura.file_size,
      fileType: factura.file_type,
      folio: factura.folio,
      uuid: factura.uuid,
      rfcEmisor: factura.rfc_emisor,
      rfcReceptor: factura.rfc_receptor,
      total: factura.total ? parseFloat(factura.total) : null,
      subtotal: factura.subtotal ? parseFloat(factura.subtotal) : null,
      iva: factura.iva ? parseFloat(factura.iva) : null,
      fechaTimbrado: factura.fecha_timbrado,
      notes: factura.notes,
      uploadedBy: {
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name
      },
      createdAt: factura.created_at,
      updatedAt: factura.updated_at
    };

    res.json(mappedFactura);
  } catch (error) {
    console.error('Error updating factura:', error);
    res.status(500).json({ error: 'Failed to update factura' });
  }
};

// Delete a factura (owner only)
export const deleteFactura = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if factura exists and user owns the ledger entry
    const checkQuery = `
      SELECT lf.id, le.user_id
      FROM ledger_facturas_mxn lf
      JOIN ledger_entries_mxn le ON lf.ledger_entry_id = le.id
      WHERE lf.id = $1
    `;
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Factura not found' });
    }

    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'You can only delete your own facturas' });
    }

    // Delete factura
    await db.query('DELETE FROM ledger_facturas_mxn WHERE id = $1', [id]);

    res.json({ message: 'Factura deleted successfully' });
  } catch (error) {
    console.error('Error deleting factura:', error);
    res.status(500).json({ error: 'Failed to delete factura' });
  }
};
