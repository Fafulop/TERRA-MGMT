import { Request, Response } from 'express';
import pool from '../config/database';

export interface AuthRequest extends Request {
  userId?: number;
}

export interface Area {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Subarea {
  id: number;
  area_id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface AreaWithSubareas extends Area {
  subareas: Subarea[];
}

export interface AreaFormData {
  name: string;
  description?: string;
}

export interface SubareaFormData {
  area_id: number;
  name: string;
  description?: string;
}

export interface AreaContent {
  tasks: any[];
  personalTasks: any[];
  cotizaciones: any[];
  contacts: any[];
  ledgerEntries: any[];
  ledgerEntriesMxn: any[];
  documents: any[];
}

export interface AreaContentSummary {
  area: string;
  subarea?: string;
  content: AreaContent;
  counts: {
    tasks: number;
    personalTasks: number;
    cotizaciones: number;
    contacts: number;
    ledgerEntries: number;
    ledgerEntriesMxn: number;
    documents: number;
    total: number;
  };
}

class AreasController {
  // Get all areas with their subareas
  async getAreas(req: AuthRequest, res: Response) {
    try {
      // Get all areas
      const areasResult = await pool.query(`
        SELECT id, name, description, created_at, updated_at 
        FROM areas 
        ORDER BY name ASC
      `);

      // Get all subareas
      const subareasResult = await pool.query(`
        SELECT id, area_id, name, description, created_at, updated_at 
        FROM subareas 
        ORDER BY area_id ASC, name ASC
      `);

      // Group subareas by area_id
      const subareasByArea: { [key: number]: Subarea[] } = {};
      subareasResult.rows.forEach((subarea: Subarea) => {
        if (!subareasByArea[subarea.area_id]) {
          subareasByArea[subarea.area_id] = [];
        }
        subareasByArea[subarea.area_id].push(subarea);
      });

      // Combine areas with their subareas
      const areasWithSubareas: AreaWithSubareas[] = areasResult.rows.map((area: Area) => ({
        ...area,
        subareas: subareasByArea[area.id] || []
      }));

      res.json({
        success: true,
        areas: areasWithSubareas
      });
    } catch (error) {
      console.error('Error fetching areas:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch areas',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get single area with its subareas
  async getAreaById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Get area
      const areaResult = await pool.query(`
        SELECT id, name, description, created_at, updated_at 
        FROM areas 
        WHERE id = $1
      `, [id]);

      if (areaResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Area not found'
        });
      }

      // Get subareas for this area
      const subareasResult = await pool.query(`
        SELECT id, area_id, name, description, created_at, updated_at 
        FROM subareas 
        WHERE area_id = $1
        ORDER BY name ASC
      `, [id]);

      const areaWithSubareas: AreaWithSubareas = {
        ...areaResult.rows[0],
        subareas: subareasResult.rows
      };

      res.json({
        success: true,
        area: areaWithSubareas
      });
    } catch (error) {
      console.error('Error fetching area:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch area',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Create new area
  async createArea(req: AuthRequest, res: Response) {
    try {
      const { name, description }: AreaFormData = req.body;

      // Validate required fields
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Area name is required'
        });
      }

      // Check if area name already exists
      const existingArea = await pool.query(
        'SELECT id FROM areas WHERE name = $1',
        [name.trim()]
      );

      if (existingArea.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Area with this name already exists'
        });
      }

      // Insert new area
      const result = await pool.query(`
        INSERT INTO areas (name, description)
        VALUES ($1, $2)
        RETURNING id, name, description, created_at, updated_at
      `, [name.trim(), description?.trim() || null]);

      const newArea: AreaWithSubareas = {
        ...result.rows[0],
        subareas: []
      };

      res.status(201).json({
        success: true,
        message: 'Area created successfully',
        area: newArea
      });
    } catch (error) {
      console.error('Error creating area:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create area',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Update area
  async updateArea(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, description }: AreaFormData = req.body;

      // Validate required fields
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Area name is required'
        });
      }

      // Check if area exists
      const existingArea = await pool.query(
        'SELECT id FROM areas WHERE id = $1',
        [id]
      );

      if (existingArea.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Area not found'
        });
      }

      // Check if another area with this name exists
      const duplicateArea = await pool.query(
        'SELECT id FROM areas WHERE name = $1 AND id != $2',
        [name.trim(), id]
      );

      if (duplicateArea.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Area with this name already exists'
        });
      }

      // Update area
      const result = await pool.query(`
        UPDATE areas 
        SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING id, name, description, created_at, updated_at
      `, [name.trim(), description?.trim() || null, id]);

      res.json({
        success: true,
        message: 'Area updated successfully',
        area: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating area:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update area',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Delete area (and cascade delete its subareas)
  async deleteArea(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Check if area exists
      const existingArea = await pool.query(
        'SELECT id, name FROM areas WHERE id = $1',
        [id]
      );

      if (existingArea.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Area not found'
        });
      }

      // Check if area is being used in other tables
      const usageChecks = await Promise.all([
        pool.query('SELECT COUNT(*) as count FROM tasks WHERE area = $1', [existingArea.rows[0].name]),
        pool.query('SELECT COUNT(*) as count FROM cotizaciones_entries WHERE area = $1', [existingArea.rows[0].name]),
        pool.query('SELECT COUNT(*) as count FROM ledger_entries WHERE area = $1', [existingArea.rows[0].name]),
        pool.query('SELECT COUNT(*) as count FROM ledger_entries_mxn WHERE area = $1', [existingArea.rows[0].name])
      ]);

      const totalUsage = usageChecks.reduce((sum, check) => sum + parseInt(check.rows[0].count), 0);

      if (totalUsage > 0) {
        return res.status(400).json({
          success: false,
          error: `Cannot delete area "${existingArea.rows[0].name}" because it is being used in ${totalUsage} record(s). Please update those records first.`
        });
      }

      // Delete area (subareas will be cascade deleted)
      await pool.query('DELETE FROM areas WHERE id = $1', [id]);

      res.json({
        success: true,
        message: 'Area deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting area:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete area',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Create new subarea
  async createSubarea(req: AuthRequest, res: Response) {
    try {
      const { area_id, name, description }: SubareaFormData = req.body;

      // Validate required fields
      if (!area_id || !name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Area ID and subarea name are required'
        });
      }

      // Check if area exists
      const areaExists = await pool.query(
        'SELECT id FROM areas WHERE id = $1',
        [area_id]
      );

      if (areaExists.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Area not found'
        });
      }

      // Check if subarea name already exists for this area
      const existingSubarea = await pool.query(
        'SELECT id FROM subareas WHERE area_id = $1 AND name = $2',
        [area_id, name.trim()]
      );

      if (existingSubarea.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Subarea with this name already exists in this area'
        });
      }

      // Insert new subarea
      const result = await pool.query(`
        INSERT INTO subareas (area_id, name, description)
        VALUES ($1, $2, $3)
        RETURNING id, area_id, name, description, created_at, updated_at
      `, [area_id, name.trim(), description?.trim() || null]);

      res.status(201).json({
        success: true,
        message: 'Subarea created successfully',
        subarea: result.rows[0]
      });
    } catch (error) {
      console.error('Error creating subarea:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create subarea',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Update subarea
  async updateSubarea(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { area_id, name, description }: SubareaFormData = req.body;

      // Validate required fields
      if (!area_id || !name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Area ID and subarea name are required'
        });
      }

      // Check if subarea exists
      const existingSubarea = await pool.query(
        'SELECT id FROM subareas WHERE id = $1',
        [id]
      );

      if (existingSubarea.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Subarea not found'
        });
      }

      // Check if area exists
      const areaExists = await pool.query(
        'SELECT id FROM areas WHERE id = $1',
        [area_id]
      );

      if (areaExists.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Area not found'
        });
      }

      // Check if another subarea with this name exists in the same area
      const duplicateSubarea = await pool.query(
        'SELECT id FROM subareas WHERE area_id = $1 AND name = $2 AND id != $3',
        [area_id, name.trim(), id]
      );

      if (duplicateSubarea.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Subarea with this name already exists in this area'
        });
      }

      // Update subarea
      const result = await pool.query(`
        UPDATE subareas 
        SET area_id = $1, name = $2, description = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING id, area_id, name, description, created_at, updated_at
      `, [area_id, name.trim(), description?.trim() || null, id]);

      res.json({
        success: true,
        message: 'Subarea updated successfully',
        subarea: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating subarea:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update subarea',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get all content for a specific area
  async getAreaContent(req: AuthRequest, res: Response) {
    try {
      const { areaName } = req.params;
      const userId = req.userId!;

      // Query all tables for content with this area
      const [
        tasksResult,
        personalTasksResult,
        cotizacionesResult,
        contactsResult,
        ledgerEntriesResult,
        ledgerEntriesMxnResult,
        documentsResult
      ] = await Promise.all([
        pool.query(`
          SELECT id, title, description, status, priority, due_date, area, subarea, created_at, updated_at
          FROM tasks 
          WHERE user_id = $1 AND area = $2
          ORDER BY created_at DESC
        `, [userId, areaName]),
        
        pool.query(`
          SELECT id, title, description, status, priority, due_date, area, subarea, created_at, updated_at
          FROM personal_tasks 
          WHERE user_id = $1 AND area = $2
          ORDER BY created_at DESC
        `, [userId, areaName]),
        
        pool.query(`
          SELECT id, amount, currency, concept, bank_account, entry_type, transaction_date, area, subarea, created_at
          FROM cotizaciones_entries 
          WHERE user_id = $1 AND area = $2
          ORDER BY created_at DESC
        `, [userId, areaName]),
        
        // Check if contacts table has area/subarea columns first
        pool.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'contacts' AND column_name IN ('area', 'subarea')
        `).then(async (colCheck) => {
          if (colCheck.rows.length === 2) {
            return await pool.query(`
              SELECT id, name, company, position, email, phone, contact_type, status, area, subarea, created_at
              FROM contacts 
              WHERE user_id = $1 AND area = $2
              ORDER BY created_at DESC
            `, [userId, areaName]);
          } else {
            return { rows: [] }; // Return empty if columns don't exist
          }
        }),
        
        pool.query(`
          SELECT id, amount, concept, bank_account, entry_type, transaction_date, area, subarea, created_at
          FROM ledger_entries 
          WHERE user_id = $1 AND area = $2
          ORDER BY created_at DESC
        `, [userId, areaName]),
        
        pool.query(`
          SELECT id, amount, concept, bank_account, entry_type, transaction_date, area, subarea, created_at
          FROM ledger_entries_mxn 
          WHERE user_id = $1 AND area = $2
          ORDER BY created_at DESC
        `, [userId, areaName]),
        
        // Check if documents table has area/subarea columns first
        pool.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'documents' AND column_name IN ('area', 'subarea')
        `).then(async (colCheck) => {
          if (colCheck.rows.length === 2) {
            return await pool.query(`
              SELECT id, document_name, document_type, status, area, subarea, created_at
              FROM documents 
              WHERE user_id = $1 AND area = $2
              ORDER BY created_at DESC
            `, [userId, areaName]);
          } else {
            return { rows: [] }; // Return empty if columns don't exist
          }
        })
      ]);

      const content: AreaContent = {
        tasks: tasksResult.rows,
        personalTasks: personalTasksResult.rows,
        cotizaciones: cotizacionesResult.rows,
        contacts: contactsResult.rows,
        ledgerEntries: ledgerEntriesResult.rows,
        ledgerEntriesMxn: ledgerEntriesMxnResult.rows,
        documents: documentsResult.rows
      };

      const counts = {
        tasks: content.tasks.length,
        personalTasks: content.personalTasks.length,
        cotizaciones: content.cotizaciones.length,
        contacts: content.contacts.length,
        ledgerEntries: content.ledgerEntries.length,
        ledgerEntriesMxn: content.ledgerEntriesMxn.length,
        documents: content.documents.length,
        total: content.tasks.length + content.personalTasks.length + content.cotizaciones.length + content.contacts.length + 
               content.ledgerEntries.length + content.ledgerEntriesMxn.length + content.documents.length
      };

      const summary: AreaContentSummary = {
        area: areaName,
        content,
        counts
      };

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error fetching area content:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch area content',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get all content for a specific subarea
  async getSubareaContent(req: AuthRequest, res: Response) {
    try {
      const { areaName, subareaName } = req.params;
      const userId = req.userId!;

      // Query all tables for content with this area and subarea
      const [
        tasksResult,
        personalTasksResult,
        cotizacionesResult,
        contactsResult,
        ledgerEntriesResult,
        ledgerEntriesMxnResult,
        documentsResult
      ] = await Promise.all([
        pool.query(`
          SELECT id, title, description, status, priority, due_date, area, subarea, created_at, updated_at
          FROM tasks 
          WHERE user_id = $1 AND area = $2 AND subarea = $3
          ORDER BY created_at DESC
        `, [userId, areaName, subareaName]),
        
        pool.query(`
          SELECT id, title, description, status, priority, due_date, area, subarea, created_at, updated_at
          FROM personal_tasks 
          WHERE user_id = $1 AND area = $2 AND subarea = $3
          ORDER BY created_at DESC
        `, [userId, areaName, subareaName]),
        
        pool.query(`
          SELECT id, amount, currency, concept, bank_account, entry_type, transaction_date, area, subarea, created_at
          FROM cotizaciones_entries 
          WHERE user_id = $1 AND area = $2 AND subarea = $3
          ORDER BY created_at DESC
        `, [userId, areaName, subareaName]),
        
        // Check if contacts table has area/subarea columns first
        pool.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'contacts' AND column_name IN ('area', 'subarea')
        `).then(async (colCheck) => {
          if (colCheck.rows.length === 2) {
            return await pool.query(`
              SELECT id, name, company, position, email, phone, contact_type, status, area, subarea, created_at
              FROM contacts 
              WHERE user_id = $1 AND area = $2 AND subarea = $3
              ORDER BY created_at DESC
            `, [userId, areaName, subareaName]);
          } else {
            return { rows: [] }; // Return empty if columns don't exist
          }
        }),
        
        pool.query(`
          SELECT id, amount, concept, bank_account, entry_type, transaction_date, area, subarea, created_at
          FROM ledger_entries 
          WHERE user_id = $1 AND area = $2 AND subarea = $3
          ORDER BY created_at DESC
        `, [userId, areaName, subareaName]),
        
        pool.query(`
          SELECT id, amount, concept, bank_account, entry_type, transaction_date, area, subarea, created_at
          FROM ledger_entries_mxn 
          WHERE user_id = $1 AND area = $2 AND subarea = $3
          ORDER BY created_at DESC
        `, [userId, areaName, subareaName]),
        
        // Check if documents table has area/subarea columns first
        pool.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'documents' AND column_name IN ('area', 'subarea')
        `).then(async (colCheck) => {
          if (colCheck.rows.length === 2) {
            return await pool.query(`
              SELECT id, document_name, document_type, status, area, subarea, created_at
              FROM documents 
              WHERE user_id = $1 AND area = $2 AND subarea = $3
              ORDER BY created_at DESC
            `, [userId, areaName, subareaName]);
          } else {
            return { rows: [] }; // Return empty if columns don't exist
          }
        })
      ]);

      const content: AreaContent = {
        tasks: tasksResult.rows,
        personalTasks: personalTasksResult.rows,
        cotizaciones: cotizacionesResult.rows,
        contacts: contactsResult.rows,
        ledgerEntries: ledgerEntriesResult.rows,
        ledgerEntriesMxn: ledgerEntriesMxnResult.rows,
        documents: documentsResult.rows
      };

      const counts = {
        tasks: content.tasks.length,
        personalTasks: content.personalTasks.length,
        cotizaciones: content.cotizaciones.length,
        contacts: content.contacts.length,
        ledgerEntries: content.ledgerEntries.length,
        ledgerEntriesMxn: content.ledgerEntriesMxn.length,
        documents: content.documents.length,
        total: content.tasks.length + content.personalTasks.length + content.cotizaciones.length + content.contacts.length + 
               content.ledgerEntries.length + content.ledgerEntriesMxn.length + content.documents.length
      };

      const summary: AreaContentSummary = {
        area: areaName,
        subarea: subareaName,
        content,
        counts
      };

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error fetching subarea content:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subarea content',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Delete subarea
  async deleteSubarea(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Check if subarea exists
      const existingSubarea = await pool.query(
        'SELECT s.id, s.name, a.name as area_name FROM subareas s JOIN areas a ON s.area_id = a.id WHERE s.id = $1',
        [id]
      );

      if (existingSubarea.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Subarea not found'
        });
      }

      const subarea = existingSubarea.rows[0];

      // Check if subarea is being used in other tables
      const usageChecks = await Promise.all([
        pool.query('SELECT COUNT(*) as count FROM tasks WHERE subarea = $1', [subarea.name]),
        pool.query('SELECT COUNT(*) as count FROM cotizaciones_entries WHERE subarea = $1', [subarea.name]),
        pool.query('SELECT COUNT(*) as count FROM ledger_entries WHERE subarea = $1', [subarea.name]),
        pool.query('SELECT COUNT(*) as count FROM ledger_entries_mxn WHERE subarea = $1', [subarea.name])
      ]);

      const totalUsage = usageChecks.reduce((sum, check) => sum + parseInt(check.rows[0].count), 0);

      if (totalUsage > 0) {
        return res.status(400).json({
          success: false,
          error: `Cannot delete subarea "${subarea.name}" because it is being used in ${totalUsage} record(s). Please update those records first.`
        });
      }

      // Delete subarea
      await pool.query('DELETE FROM subareas WHERE id = $1', [id]);

      res.json({
        success: true,
        message: 'Subarea deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting subarea:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete subarea',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default new AreasController();