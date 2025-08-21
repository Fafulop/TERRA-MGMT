import express from 'express';
import pool from '../config/database';
import fs from 'fs';
import path from 'path';

const router = express.Router();

router.post('/add-attachments-table', async (req, res) => {
  try {
    // Create task_attachments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS task_attachments (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        file_key VARCHAR(255) NOT NULL,
        content_type VARCHAR(100) NOT NULL,
        file_size INTEGER,
        uploadthing_file_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);
      CREATE INDEX IF NOT EXISTS idx_task_attachments_user_id ON task_attachments(user_id);
      CREATE INDEX IF NOT EXISTS idx_task_attachments_content_type ON task_attachments(content_type);
    `);

    // Create trigger for updated_at
    await pool.query(`
      DROP TRIGGER IF EXISTS update_task_attachments_updated_at ON task_attachments;
      CREATE TRIGGER update_task_attachments_updated_at
          BEFORE UPDATE ON task_attachments
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `);

    res.status(200).json({ 
      message: 'Task attachments table created successfully',
      table: 'task_attachments',
      indexes: ['idx_task_attachments_task_id', 'idx_task_attachments_user_id', 'idx_task_attachments_content_type'],
      triggers: ['update_task_attachments_updated_at']
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ 
      error: 'Failed to create task_attachments table', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/add-comments-table', async (req, res) => {
  try {
    // Create task_comments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS task_comments (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        comment TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
      CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);
      CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(created_at);
    `);

    // Create trigger for updated_at
    await pool.query(`
      DROP TRIGGER IF EXISTS update_task_comments_updated_at ON task_comments;
      CREATE TRIGGER update_task_comments_updated_at
          BEFORE UPDATE ON task_comments
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `);

    res.status(200).json({ 
      message: 'Task comments table created successfully',
      table: 'task_comments',
      indexes: ['idx_task_comments_task_id', 'idx_task_comments_user_id', 'idx_task_comments_created_at'],
      triggers: ['update_task_comments_updated_at']
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ 
      error: 'Failed to create task_comments table', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/add-attachments-table', async (req, res) => {
  try {
    // Create attachments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attachments (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        comment_id INTEGER REFERENCES task_comments(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_url TEXT NOT NULL,
        file_size INTEGER,
        file_type VARCHAR(100),
        attachment_type VARCHAR(20) NOT NULL CHECK (attachment_type IN ('file', 'url')),
        url_title VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT check_attachment_parent CHECK (
          (task_id IS NOT NULL AND comment_id IS NULL) OR 
          (task_id IS NULL AND comment_id IS NOT NULL)
        )
      )
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_attachments_task_id ON attachments(task_id);
      CREATE INDEX IF NOT EXISTS idx_attachments_comment_id ON attachments(comment_id);
      CREATE INDEX IF NOT EXISTS idx_attachments_user_id ON attachments(user_id);
      CREATE INDEX IF NOT EXISTS idx_attachments_created_at ON attachments(created_at);
    `);

    res.status(200).json({ 
      message: 'Attachments table created successfully',
      table: 'attachments',
      indexes: ['idx_attachments_task_id', 'idx_attachments_comment_id', 'idx_attachments_user_id', 'idx_attachments_created_at']
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ 
      error: 'Failed to create attachments table', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/add-task-comment-attachments', async (req, res) => {
  try {
    // Create attachments table for tasks and comments
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attachments (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        comment_id INTEGER REFERENCES task_comments(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_url TEXT NOT NULL,
        file_size INTEGER,
        file_type VARCHAR(100),
        attachment_type VARCHAR(20) NOT NULL CHECK (attachment_type IN ('file', 'url')),
        url_title VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT check_attachment_parent CHECK (
          (task_id IS NOT NULL AND comment_id IS NULL) OR 
          (task_id IS NULL AND comment_id IS NOT NULL)
        )
      )
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_attachments_task_id ON attachments(task_id);
      CREATE INDEX IF NOT EXISTS idx_attachments_comment_id ON attachments(comment_id);
      CREATE INDEX IF NOT EXISTS idx_attachments_user_id ON attachments(user_id);
      CREATE INDEX IF NOT EXISTS idx_attachments_created_at ON attachments(created_at);
    `);

    res.status(200).json({ 
      message: 'Task and comment attachments table created successfully',
      table: 'attachments',
      indexes: ['idx_attachments_task_id', 'idx_attachments_comment_id', 'idx_attachments_user_id', 'idx_attachments_created_at']
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ 
      error: 'Failed to create attachments table', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/add-ledger-tables', async (req, res) => {
  try {
    // Read and execute the ledger migration SQL file
    const sqlPath = path.join(__dirname, '..', 'config', 'add-ledger-tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL migration
    await pool.query(sqlContent);

    res.status(200).json({ 
      message: 'Ledger tables created successfully',
      tables: ['ledger_entries', 'ledger_attachments'],
      indexes: [
        'idx_ledger_entries_user_id',
        'idx_ledger_entries_entry_type', 
        'idx_ledger_entries_transaction_date',
        'idx_ledger_entries_internal_id',
        'idx_ledger_attachments_ledger_entry_id'
      ],
      triggers: ['update_ledger_entries_updated_at']
    });
  } catch (error) {
    console.error('Ledger migration error:', error);
    res.status(500).json({ 
      error: 'Failed to create ledger tables', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/add-mxn-ledger-tables', async (req, res) => {
  try {
    // Read and execute the MXN ledger migration SQL file
    const sqlPath = path.join(__dirname, '..', 'config', 'add-mxn-ledger-tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL migration
    await pool.query(sqlContent);

    res.status(200).json({ 
      message: 'MXN ledger tables created successfully',
      tables: ['ledger_entries_mxn', 'ledger_attachments_mxn'],
      indexes: [
        'idx_ledger_entries_mxn_user_id',
        'idx_ledger_entries_mxn_entry_type', 
        'idx_ledger_entries_mxn_transaction_date',
        'idx_ledger_entries_mxn_internal_id',
        'idx_ledger_attachments_mxn_ledger_entry_id'
      ],
      triggers: ['update_ledger_entries_mxn_updated_at']
    });
  } catch (error) {
    console.error('MXN ledger migration error:', error);
    res.status(500).json({ 
      error: 'Failed to create MXN ledger tables', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/add-cotizaciones-tables', async (req, res) => {
  try {
    // Read and execute the cotizaciones migration SQL file
    const sqlPath = path.join(__dirname, '..', 'config', 'add-cotizaciones-tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL migration
    await pool.query(sqlContent);

    res.status(200).json({ 
      message: 'Cotizaciones tables created successfully',
      tables: ['cotizaciones_entries', 'cotizaciones_attachments'],
      indexes: [
        'idx_cotizaciones_entries_user_id',
        'idx_cotizaciones_entries_currency',
        'idx_cotizaciones_entries_entry_type', 
        'idx_cotizaciones_entries_transaction_date',
        'idx_cotizaciones_entries_internal_id',
        'idx_cotizaciones_attachments_cotizacion_entry_id'
      ],
      triggers: ['update_cotizaciones_entries_updated_at']
    });
  } catch (error) {
    console.error('Cotizaciones migration error:', error);
    res.status(500).json({ 
      error: 'Failed to create cotizaciones tables', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;