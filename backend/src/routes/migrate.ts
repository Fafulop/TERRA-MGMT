import express from 'express';
import pool from '../config/database';

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

export default router;