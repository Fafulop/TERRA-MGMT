import { Request, Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Get all attachments for a specific ledger entry
export const getAttachmentsForEntry = async (req: AuthRequest, res: Response) => {
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

    // Get all attachments for this entry with uploader info
    const query = `
      SELECT
        la.*,
        u.username,
        u.first_name,
        u.last_name
      FROM ledger_attachments_mxn la
      LEFT JOIN users u ON la.uploaded_by = u.id
      WHERE la.ledger_entry_id = $1
      ORDER BY la.created_at DESC
    `;

    const result = await db.query(query, [entryId]);

    // Map to camelCase for frontend
    const attachments = result.rows.map((row: any) => ({
      id: row.id,
      ledgerEntryId: row.ledger_entry_id,
      fileName: row.file_name,
      fileUrl: row.file_url,
      fileSize: row.file_size,
      fileType: row.file_type,
      attachmentType: row.attachment_type,
      uploadedBy: {
        id: row.uploaded_by,
        username: row.username,
        firstName: row.first_name,
        lastName: row.last_name
      },
      createdAt: row.created_at
    }));

    res.json(attachments);
  } catch (error) {
    console.error('Error fetching attachments:', error);
    res.status(500).json({ error: 'Failed to fetch attachments' });
  }
};

// Create a new attachment for a ledger entry (post-creation)
export const createAttachment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { entryId } = req.params;
    const { file, title } = req.body;

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
      return res.status(403).json({ error: 'You can only add attachments to your own entries' });
    }

    // Insert attachment
    const insertQuery = `
      INSERT INTO ledger_attachments_mxn (
        ledger_entry_id,
        file_name,
        file_url,
        file_size,
        file_type,
        attachment_type,
        uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      entryId,
      file.name,
      file.url,
      file.size || null,
      file.type || null,
      'file',
      userId
    ];

    const result = await db.query(insertQuery, values);
    const attachment = result.rows[0];

    // Get user info for response
    const userQuery = await db.query(
      'SELECT username, first_name, last_name FROM users WHERE id = $1',
      [userId]
    );
    const user = userQuery.rows[0];

    // Map to camelCase for frontend
    const mappedAttachment = {
      id: attachment.id,
      ledgerEntryId: attachment.ledger_entry_id,
      fileName: attachment.file_name,
      fileUrl: attachment.file_url,
      fileSize: attachment.file_size,
      fileType: attachment.file_type,
      attachmentType: attachment.attachment_type,
      uploadedBy: {
        id: userId,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name
      },
      createdAt: attachment.created_at
    };

    res.status(201).json(mappedAttachment);
  } catch (error) {
    console.error('Error creating attachment:', error);
    res.status(500).json({ error: 'Failed to create attachment' });
  }
};

// Delete an attachment (owner only)
export const deleteAttachment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if attachment exists and user owns the ledger entry
    const checkQuery = `
      SELECT la.id, le.user_id
      FROM ledger_attachments_mxn la
      JOIN ledger_entries_mxn le ON la.ledger_entry_id = le.id
      WHERE la.id = $1
    `;
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'You can only delete attachments from your own entries' });
    }

    // Delete attachment
    await db.query('DELETE FROM ledger_attachments_mxn WHERE id = $1', [id]);

    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
};
