import { Request, Response } from 'express';
import { Pool } from 'pg';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Generate unique internal ID for contacts
const generateContactId = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `CONT-${timestamp}-${random}`;
};

// Get all contacts (viewable by all users)
export const getContacts = async (req: AuthRequest, res: Response) => {
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
    if (filters.contact_type) {
      whereClause += ` AND c.contact_type = $${paramIndex}`;
      params.push(filters.contact_type);
      paramIndex++;
    }

    if (filters.status) {
      whereClause += ` AND c.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.company) {
      whereClause += ` AND c.company ILIKE $${paramIndex}`;
      params.push(`%${filters.company}%`);
      paramIndex++;
    }

    if (filters.area) {
      whereClause += ` AND c.area ILIKE $${paramIndex}`;
      params.push(`%${filters.area}%`);
      paramIndex++;
    }

    if (filters.subarea) {
      whereClause += ` AND c.subarea ILIKE $${paramIndex}`;
      params.push(`%${filters.subarea}%`);
      paramIndex++;
    }

    if (filters.search) {
      whereClause += ` AND (c.name ILIKE $${paramIndex} OR c.company ILIKE $${paramIndex} OR c.email ILIKE $${paramIndex} OR c.area ILIKE $${paramIndex} OR c.subarea ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Get contacts with user information and attachment count
    const contactsQuery = `
      SELECT 
        c.*,
        u.username,
        u.first_name,
        u.last_name,
        COUNT(ca.id) as attachment_count
      FROM contacts c
      LEFT JOIN contact_attachments ca ON c.id = ca.contact_id
      LEFT JOIN users u ON c.user_id = u.id
      ${whereClause}
      GROUP BY c.id, u.username, u.first_name, u.last_name
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);
    const contactsResult = await db.query(contactsQuery, params);

    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_contacts,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_contacts,
        COUNT(CASE WHEN contact_type = 'client' THEN 1 END) as clients,
        COUNT(CASE WHEN contact_type = 'supplier' THEN 1 END) as suppliers
      FROM contacts c
      ${whereClause}
    `;

    const summaryResult = await db.query(summaryQuery, params.slice(0, -2));

    res.json({
      contacts: contactsResult.rows,
      summary: summaryResult.rows[0],
      pagination: {
        limit,
        offset,
        hasMore: contactsResult.rows.length === limit
      }
    });

  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get a single contact (viewable by all users)
export const getContact = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const contactId = parseInt(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!contactId || isNaN(contactId)) {
      return res.status(400).json({ error: 'Invalid contact ID' });
    }

    const contact = await getContactByIdPublic(contactId);
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(contact);

  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper method to get contact without user restriction
const getContactByIdPublic = async (contactId: number) => {
  const client = await db.connect();
  
  try {
    const query = `
      SELECT 
        c.*,
        u.username,
        u.first_name,
        u.last_name,
        COALESCE(
          json_agg(
            CASE WHEN ca.id IS NOT NULL 
            THEN json_build_object(
              'id', ca.id,
              'fileName', ca.file_name,
              'fileUrl', ca.file_url,
              'fileSize', ca.file_size,
              'fileType', ca.file_type,
              'attachmentType', ca.attachment_type,
              'urlTitle', ca.url_title,
              'createdAt', ca.created_at
            ) END
          ) FILTER (WHERE ca.id IS NOT NULL), '[]'
        ) as attachments
      FROM contacts c
      LEFT JOIN contact_attachments ca ON c.id = ca.contact_id
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
      GROUP BY c.id, u.username, u.first_name, u.last_name
    `;

    const result = await client.query(query, [contactId]);
    return result.rows[0] || null;

  } finally {
    client.release();
  }
};

// Create a new contact
export const createContact = async (req: AuthRequest, res: Response) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    const userId = req.userId;
    const {
      name,
      company,
      position,
      email,
      phone,
      mobile,
      address,
      city,
      state,
      country,
      postal_code,
      contact_type = 'business',
      status = 'active',
      area,
      subarea,
      industry,
      website,
      notes,
      tags = [],
      fileAttachments = []
    } = req.body;

    // Validate required fields
    if (!name) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Name is required' });
    }

    if (!area) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Area is required' });
    }

    if (!subarea) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Subarea is required' });
    }

    // Validate contact type
    const validContactTypes = ['business', 'client', 'supplier', 'partner', 'prospect', 'vendor'];
    if (!validContactTypes.includes(contact_type)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid contact type' });
    }

    // Validate status
    const validStatuses = ['active', 'inactive', 'archived'];
    if (!validStatuses.includes(status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid status' });
    }

    const internalId = generateContactId();

    // Create contact
    const contactQuery = `
      INSERT INTO contacts (
        user_id, internal_id, name, company, position, email, phone, mobile,
        address, city, state, country, postal_code, contact_type, status,
        area, subarea, industry, website, notes, tags
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *
    `;
    
    const contactValues = [
      userId, internalId, name, company, position, email, phone, mobile,
      address, city, state, country, postal_code, contact_type, status,
      area, subarea, industry, website, notes, tags
    ];

    const contactResult = await client.query(contactQuery, contactValues);
    const contact = contactResult.rows[0];

    // Create attachments if provided
    if (fileAttachments && fileAttachments.length > 0) {
      for (const attachment of fileAttachments) {
        const attachmentQuery = `
          INSERT INTO contact_attachments (
            contact_id, file_name, file_url, file_size, 
            file_type, attachment_type, uploaded_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        
        await client.query(attachmentQuery, [
          contact.id,
          attachment.file.name,
          attachment.file.url,
          attachment.file.size,
          attachment.file.type,
          'file',
          userId
        ]);
      }
    }

    await client.query('COMMIT');

    // Fetch the complete contact with attachments
    const completeContact = await getContactByIdPublic(contact.id);
    
    res.status(201).json(completeContact);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating contact:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

// Update a contact (only by owner)
export const updateContact = async (req: AuthRequest, res: Response) => {
  const client = await db.connect();
  
  try {
    const userId = req.userId;
    const contactId = parseInt(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if contact exists and belongs to user
    const checkQuery = 'SELECT id FROM contacts WHERE id = $1 AND user_id = $2';
    const checkResult = await client.query(checkQuery, [contactId, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found or unauthorized' });
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    const updatableFields = [
      'name', 'company', 'position', 'email', 'phone', 'mobile',
      'address', 'city', 'state', 'country', 'postal_code',
      'contact_type', 'status', 'area', 'subarea', 'industry', 'website', 'notes', 'tags'
    ];

    for (const field of updatableFields) {
      if (req.body[field] !== undefined) {
        if (field === 'name' && !req.body[field]) {
          return res.status(400).json({ error: 'Name cannot be empty' });
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
    values.push(contactId, userId);

    const updateQuery = `
      UPDATE contacts
      SET ${updates.join(', ')}
      WHERE id = $${paramCount++} AND user_id = $${paramCount++}
      RETURNING *
    `;

    const result = await client.query(updateQuery, values);
    const updatedContact = await getContactByIdPublic(contactId);

    res.json(updatedContact);

  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

// Delete a contact (only by owner)
export const deleteContact = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const contactId = parseInt(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if contact exists and belongs to user
    const checkQuery = 'SELECT id FROM contacts WHERE id = $1 AND user_id = $2';
    const checkResult = await db.query(checkQuery, [contactId, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found or unauthorized' });
    }

    // Delete contact (attachments will be deleted automatically due to CASCADE)
    const deleteQuery = 'DELETE FROM contacts WHERE id = $1 AND user_id = $2';
    await db.query(deleteQuery, [contactId, userId]);

    res.json({ message: 'Contact deleted successfully' });

  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get contacts summary
export const getContactsSummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const summaryQuery = `
      SELECT 
        COUNT(*) as total_contacts,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_contacts,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_contacts,
        COUNT(CASE WHEN contact_type = 'client' THEN 1 END) as clients,
        COUNT(CASE WHEN contact_type = 'supplier' THEN 1 END) as suppliers,
        COUNT(CASE WHEN contact_type = 'partner' THEN 1 END) as partners,
        COUNT(CASE WHEN contact_type = 'prospect' THEN 1 END) as prospects
      FROM contacts
      WHERE 1=1
    `;

    const result = await db.query(summaryQuery);
    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error fetching contacts summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};