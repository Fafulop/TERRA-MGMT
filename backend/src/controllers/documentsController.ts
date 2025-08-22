import { Request, Response } from 'express';
import { Pool } from 'pg';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Generate unique internal ID for documents
const generateDocumentId = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `DOC-${timestamp}-${random}`;
};

// Get all documents (viewable by all users)
export const getDocuments = async (req: AuthRequest, res: Response) => {
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
    if (filters.status) {
      whereClause += ` AND d.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.area) {
      whereClause += ` AND d.area ILIKE $${paramIndex}`;
      params.push(`%${filters.area}%`);
      paramIndex++;
    }

    if (filters.subarea) {
      whereClause += ` AND d.subarea ILIKE $${paramIndex}`;
      params.push(`%${filters.subarea}%`);
      paramIndex++;
    }

    if (filters.document_type) {
      whereClause += ` AND d.document_type ILIKE $${paramIndex}`;
      params.push(`%${filters.document_type}%`);
      paramIndex++;
    }

    if (filters.search) {
      whereClause += ` AND (d.document_name ILIKE $${paramIndex} OR d.description ILIKE $${paramIndex} OR d.area ILIKE $${paramIndex} OR d.subarea ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Get documents with user information and attachment count
    const documentsQuery = `
      SELECT 
        d.*,
        u.username,
        u.first_name,
        u.last_name,
        COUNT(da.id) as attachment_count
      FROM documents d
      LEFT JOIN document_attachments da ON d.id = da.document_id
      LEFT JOIN users u ON d.user_id = u.id
      ${whereClause}
      GROUP BY d.id, u.username, u.first_name, u.last_name
      ORDER BY d.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);
    const documentsResult = await db.query(documentsQuery, params);

    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_documents,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_documents,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_documents,
        COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived_documents
      FROM documents d
      ${whereClause}
    `;

    const summaryResult = await db.query(summaryQuery, params.slice(0, -2));

    res.json({
      documents: documentsResult.rows,
      summary: summaryResult.rows[0],
      pagination: {
        limit,
        offset,
        hasMore: documentsResult.rows.length === limit
      }
    });

  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get a single document with all details
const getDocumentWithDetails = async (documentId: number) => {
  const client = await db.connect();
  
  try {
    const query = `
      SELECT 
        d.*,
        u.username,
        u.first_name,
        u.last_name,
        json_agg(
          json_build_object(
            'id', da.id,
            'fileName', da.file_name,
            'fileUrl', da.file_url,
            'fileSize', da.file_size,
            'fileType', da.file_type,
            'attachmentType', da.attachment_type,
            'urlTitle', da.url_title,
            'createdAt', da.created_at,
            'uploadedBy', json_build_object(
              'username', up.username,
              'firstName', up.first_name,
              'lastName', up.last_name
            )
          )
        ) FILTER (WHERE da.id IS NOT NULL) as attachments
      FROM documents d
      LEFT JOIN document_attachments da ON d.id = da.document_id
      LEFT JOIN users up ON da.uploaded_by = up.id
      LEFT JOIN users u ON d.user_id = u.id
      WHERE d.id = $1
      GROUP BY d.id, u.username, u.first_name, u.last_name
    `;

    const result = await client.query(query, [documentId]);
    return result.rows[0] || null;

  } finally {
    client.release();
  }
};

// Get a single document by ID
export const getDocument = async (req: AuthRequest, res: Response) => {
  try {
    const documentId = parseInt(req.params.id);

    if (isNaN(documentId)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    const document = await getDocumentWithDetails(documentId);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);

  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new document
export const createDocument = async (req: AuthRequest, res: Response) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    const userId = req.userId;
    const {
      document_name,
      area,
      subarea,
      description,
      document_type,
      version = '1.0',
      status = 'active',
      tags = [],
      fileAttachments = []
    } = req.body;

    // Validate required fields
    if (!document_name) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Document name is required' });
    }

    if (!area) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Area is required' });
    }

    if (!subarea) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Subarea is required' });
    }

    // Validate that at least one attachment is provided
    if (!fileAttachments || fileAttachments.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'At least one file attachment is required' });
    }

    // Validate status
    const validStatuses = ['active', 'archived', 'draft'];
    if (!validStatuses.includes(status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid status' });
    }

    const internalId = generateDocumentId();

    // Create document
    const documentQuery = `
      INSERT INTO documents (
        user_id, internal_id, document_name, area, subarea, description,
        document_type, version, status, tags
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const documentValues = [
      userId, internalId, document_name, area, subarea, description,
      document_type, version, status, tags
    ];

    const documentResult = await client.query(documentQuery, documentValues);
    const document = documentResult.rows[0];

    // Create attachments
    for (const attachment of fileAttachments) {
      const attachmentQuery = `
        INSERT INTO document_attachments (
          document_id, file_name, file_url, file_size, 
          file_type, attachment_type, uploaded_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      
      await client.query(attachmentQuery, [
        document.id,
        attachment.file.name,
        attachment.file.url || attachment.file.fileUrl,
        attachment.file.size,
        attachment.file.type,
        'file',
        userId
      ]);
    }

    await client.query('COMMIT');

    // Get the complete document with attachments
    const completeDocument = await getDocumentWithDetails(document.id);
    res.status(201).json(completeDocument);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

// Update a document (only by owner)
export const updateDocument = async (req: AuthRequest, res: Response) => {
  const client = await db.connect();
  
  try {
    const userId = req.userId;
    const documentId = parseInt(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if document exists and belongs to user
    const checkQuery = 'SELECT id FROM documents WHERE id = $1 AND user_id = $2';
    const checkResult = await client.query(checkQuery, [documentId, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found or unauthorized' });
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    const updatableFields = [
      'document_name', 'area', 'subarea', 'description', 'document_type',
      'version', 'status', 'tags'
    ];

    for (const field of updatableFields) {
      if (req.body[field] !== undefined) {
        if (field === 'document_name' && !req.body[field]) {
          return res.status(400).json({ error: 'Document name cannot be empty' });
        }
        if (field === 'area' && !req.body[field]) {
          return res.status(400).json({ error: 'Area cannot be empty' });
        }
        if (field === 'subarea' && !req.body[field]) {
          return res.status(400).json({ error: 'Subarea cannot be empty' });
        }
        updates.push(`${field} = $${paramCount++}`);
        values.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(documentId, userId);

    const updateQuery = `
      UPDATE documents
      SET ${updates.join(', ')}
      WHERE id = $${paramCount++} AND user_id = $${paramCount++}
      RETURNING *
    `;

    const result = await client.query(updateQuery, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found or unauthorized' });
    }

    // Get the complete document with attachments
    const completeDocument = await getDocumentWithDetails(documentId);
    res.json(completeDocument);

  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

// Delete a document (only by owner)
export const deleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const documentId = parseInt(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if document exists and belongs to user, then delete
    const deleteQuery = 'DELETE FROM documents WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await db.query(deleteQuery, [documentId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found or unauthorized' });
    }

    res.status(204).send();

  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get documents summary
export const getDocumentsSummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const summaryQuery = `
      SELECT 
        COUNT(*) as total_documents,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_documents,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_documents,
        COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived_documents,
        COUNT(DISTINCT area) as total_areas,
        COUNT(DISTINCT subarea) as total_subareas
      FROM documents
    `;

    const result = await db.query(summaryQuery);
    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error fetching documents summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};