import express, { Request, Response } from 'express';
import pool from '../config/database';
import fs from 'fs';
import path from 'path';
import { authenticateToken } from '../middleware/auth';

interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
  };
}

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

router.post('/add-area-subarea-cotizaciones', async (req, res) => {
  try {
    console.log('Starting migration to add area and subarea to cotizaciones_entries...');
    
    // Step 1: Add the columns
    await pool.query(`
      ALTER TABLE cotizaciones_entries 
      ADD COLUMN IF NOT EXISTS area VARCHAR(255),
      ADD COLUMN IF NOT EXISTS subarea VARCHAR(255)
    `);
    console.log('✓ Added columns area and subarea');
    
    // Step 2: Update existing records with default values
    const updateResult = await pool.query(`
      UPDATE cotizaciones_entries 
      SET area = 'General', subarea = 'Miscellaneous' 
      WHERE area IS NULL OR subarea IS NULL
    `);
    console.log(`✓ Updated ${updateResult.rowCount} existing records with default values`);
    
    // Step 3: Make columns NOT NULL
    await pool.query(`
      ALTER TABLE cotizaciones_entries 
      ALTER COLUMN area SET NOT NULL,
      ALTER COLUMN subarea SET NOT NULL
    `);
    console.log('✓ Set columns as NOT NULL');
    
    // Step 4: Add indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_cotizaciones_entries_area ON cotizaciones_entries(area)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_cotizaciones_entries_subarea ON cotizaciones_entries(subarea)
    `);
    console.log('✓ Added indexes for performance');
    
    console.log('Migration completed successfully!');
    res.status(200).json({ 
      message: 'Cotizaciones area/subarea migration completed successfully!',
      table: 'cotizaciones_entries',
      columns_added: ['area', 'subarea'],
      indexes_added: ['idx_cotizaciones_entries_area', 'idx_cotizaciones_entries_subarea'],
      records_updated: updateResult.rowCount
    });
    
  } catch (error) {
    console.error('Cotizaciones area/subarea migration error:', error);
    res.status(500).json({ 
      error: 'Failed to add area and subarea to cotizaciones_entries', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/add-area-subarea-tasks', async (req, res) => {
  try {
    console.log('Starting migration to add area and subarea to tasks...');
    
    // Step 1: Add the columns
    await pool.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS area VARCHAR(255),
      ADD COLUMN IF NOT EXISTS subarea VARCHAR(255)
    `);
    console.log('✓ Added columns area and subarea');
    
    // Step 2: Update existing records with default values
    const updateResult = await pool.query(`
      UPDATE tasks 
      SET area = 'General', subarea = 'Miscellaneous' 
      WHERE area IS NULL OR subarea IS NULL
    `);
    console.log(`✓ Updated ${updateResult.rowCount} existing records with default values`);
    
    // Step 3: Make columns NOT NULL
    await pool.query(`
      ALTER TABLE tasks 
      ALTER COLUMN area SET NOT NULL,
      ALTER COLUMN subarea SET NOT NULL
    `);
    console.log('✓ Set columns as NOT NULL');
    
    // Step 4: Add indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_area ON tasks(area)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_subarea ON tasks(subarea)
    `);
    console.log('✓ Added indexes for performance');
    
    console.log('Migration completed successfully!');
    res.status(200).json({ 
      message: 'Tasks area/subarea migration completed successfully!',
      table: 'tasks',
      columns_added: ['area', 'subarea'],
      indexes_added: ['idx_tasks_area', 'idx_tasks_subarea'],
      records_updated: updateResult.rowCount
    });
    
  } catch (error) {
    console.error('Tasks area/subarea migration error:', error);
    res.status(500).json({ 
      error: 'Failed to add area and subarea to tasks', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/add-area-subarea-ledger-usd', async (req, res) => {
  try {
    console.log('Starting migration to add area and subarea to USD ledger_entries...');
    
    // Step 1: Add the columns
    await pool.query(`
      ALTER TABLE ledger_entries 
      ADD COLUMN IF NOT EXISTS area VARCHAR(255),
      ADD COLUMN IF NOT EXISTS subarea VARCHAR(255)
    `);
    console.log('✓ Added columns area and subarea to ledger_entries');
    
    // Step 2: Update existing records with default values
    const updateResult = await pool.query(`
      UPDATE ledger_entries 
      SET area = 'General', subarea = 'Miscellaneous' 
      WHERE area IS NULL OR subarea IS NULL
    `);
    console.log(`✓ Updated ${updateResult.rowCount} existing USD ledger records with default values`);
    
    // Step 3: Make columns NOT NULL
    await pool.query(`
      ALTER TABLE ledger_entries 
      ALTER COLUMN area SET NOT NULL,
      ALTER COLUMN subarea SET NOT NULL
    `);
    console.log('✓ Set columns as NOT NULL');
    
    // Step 4: Add indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ledger_entries_area ON ledger_entries(area)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ledger_entries_subarea ON ledger_entries(subarea)
    `);
    console.log('✓ Added indexes for performance');
    
    console.log('USD Ledger area/subarea migration completed successfully!');
    res.status(200).json({ 
      message: 'USD Ledger area/subarea migration completed successfully!',
      table: 'ledger_entries',
      columns_added: ['area', 'subarea'],
      indexes_added: ['idx_ledger_entries_area', 'idx_ledger_entries_subarea'],
      records_updated: updateResult.rowCount
    });
    
  } catch (error) {
    console.error('USD Ledger area/subarea migration error:', error);
    res.status(500).json({ 
      error: 'Failed to add area and subarea to USD ledger_entries', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/add-area-subarea-ledger-mxn', async (req, res) => {
  try {
    console.log('Starting migration to add area and subarea to MXN ledger_entries_mxn...');
    
    // Step 1: Add the columns
    await pool.query(`
      ALTER TABLE ledger_entries_mxn 
      ADD COLUMN IF NOT EXISTS area VARCHAR(255),
      ADD COLUMN IF NOT EXISTS subarea VARCHAR(255)
    `);
    console.log('✓ Added columns area and subarea to ledger_entries_mxn');
    
    // Step 2: Update existing records with default values
    const updateResult = await pool.query(`
      UPDATE ledger_entries_mxn 
      SET area = 'General', subarea = 'Miscellaneous' 
      WHERE area IS NULL OR subarea IS NULL
    `);
    console.log(`✓ Updated ${updateResult.rowCount} existing MXN ledger records with default values`);
    
    // Step 3: Make columns NOT NULL
    await pool.query(`
      ALTER TABLE ledger_entries_mxn 
      ALTER COLUMN area SET NOT NULL,
      ALTER COLUMN subarea SET NOT NULL
    `);
    console.log('✓ Set columns as NOT NULL');
    
    // Step 4: Add indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ledger_entries_mxn_area ON ledger_entries_mxn(area)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ledger_entries_mxn_subarea ON ledger_entries_mxn(subarea)
    `);
    console.log('✓ Added indexes for performance');
    
    console.log('MXN Ledger area/subarea migration completed successfully!');
    res.status(200).json({ 
      message: 'MXN Ledger area/subarea migration completed successfully!',
      table: 'ledger_entries_mxn',
      columns_added: ['area', 'subarea'],
      indexes_added: ['idx_ledger_entries_mxn_area', 'idx_ledger_entries_mxn_subarea'],
      records_updated: updateResult.rowCount
    });
    
  } catch (error) {
    console.error('MXN Ledger area/subarea migration error:', error);
    res.status(500).json({ 
      error: 'Failed to add area and subarea to MXN ledger_entries_mxn', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/create-areas-tables', async (req, res) => {
  try {
    console.log('Starting migration to create areas and subareas tables...');
    
    // Step 1: Create areas table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS areas (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created areas table');
    
    // Step 2: Create subareas table with foreign key to areas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subareas (
        id SERIAL PRIMARY KEY,
        area_id INTEGER NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(area_id, name)
      )
    `);
    console.log('✓ Created subareas table');
    
    // Step 3: Add indexes for performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_areas_name ON areas(name);
      CREATE INDEX IF NOT EXISTS idx_subareas_area_id ON subareas(area_id);
      CREATE INDEX IF NOT EXISTS idx_subareas_name ON subareas(name);
    `);
    console.log('✓ Added indexes for performance');
    
    // Step 4: Add update triggers (check if function exists first)
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    await pool.query(`
      DROP TRIGGER IF EXISTS update_areas_updated_at ON areas;
      CREATE TRIGGER update_areas_updated_at
          BEFORE UPDATE ON areas
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `);
    
    await pool.query(`
      DROP TRIGGER IF EXISTS update_subareas_updated_at ON subareas;
      CREATE TRIGGER update_subareas_updated_at
          BEFORE UPDATE ON subareas
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✓ Added update triggers');
    
    // Step 5: Insert default data
    await pool.query(`
      INSERT INTO areas (name, description) VALUES 
        ('General', 'General purpose area for miscellaneous items'),
        ('Finance', 'Financial operations and accounting'),
        ('Operations', 'Day-to-day business operations'),
        ('Marketing', 'Marketing and promotional activities'),
        ('Human Resources', 'HR and personnel management')
      ON CONFLICT (name) DO NOTHING
    `);
    console.log('✓ Inserted default areas');
    
    await pool.query(`
      INSERT INTO subareas (area_id, name, description) VALUES 
        ((SELECT id FROM areas WHERE name = 'General'), 'Miscellaneous', 'General miscellaneous items'),
        ((SELECT id FROM areas WHERE name = 'Finance'), 'Accounting', 'General accounting tasks'),
        ((SELECT id FROM areas WHERE name = 'Finance'), 'Budgeting', 'Budget planning and management'),
        ((SELECT id FROM areas WHERE name = 'Operations'), 'Administration', 'Administrative tasks'),
        ((SELECT id FROM areas WHERE name = 'Operations'), 'Customer Service', 'Customer support and service'),
        ((SELECT id FROM areas WHERE name = 'Marketing'), 'Digital Marketing', 'Online marketing activities'),
        ((SELECT id FROM areas WHERE name = 'Marketing'), 'Content Creation', 'Content development and management'),
        ((SELECT id FROM areas WHERE name = 'Human Resources'), 'Recruitment', 'Hiring and recruitment processes'),
        ((SELECT id FROM areas WHERE name = 'Human Resources'), 'Training', 'Employee training and development')
      ON CONFLICT (area_id, name) DO NOTHING
    `);
    console.log('✓ Inserted default subareas');
    
    console.log('Areas and subareas tables migration completed successfully!');
    res.status(200).json({ 
      message: 'Areas and subareas tables created successfully!',
      tables: ['areas', 'subareas'],
      indexes: ['idx_areas_name', 'idx_subareas_area_id', 'idx_subareas_name'],
      triggers: ['update_areas_updated_at', 'update_subareas_updated_at'],
      default_areas: ['General', 'Finance', 'Operations', 'Marketing', 'Human Resources'],
      default_subareas_count: 9
    });
    
  } catch (error) {
    console.error('Areas tables migration error:', error);
    res.status(500).json({ 
      error: 'Failed to create areas and subareas tables', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create personal tasks table migration
router.post('/create-personal-tasks-table', async (req: Request, res: Response) => {
  try {
    console.log('Starting personal tasks table migration...');

    // Create personal_tasks table (identical to tasks but conceptually separated)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS personal_tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
        priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        due_date TIMESTAMP WITH TIME ZONE,
        area VARCHAR(255) NOT NULL,
        subarea VARCHAR(255) NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created personal_tasks table');

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_personal_tasks_user_id ON personal_tasks(user_id)
    `);
    console.log('✓ Created index on user_id');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_personal_tasks_status ON personal_tasks(status)
    `);
    console.log('✓ Created index on status');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_personal_tasks_due_date ON personal_tasks(due_date)
    `);
    console.log('✓ Created index on due_date');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_personal_tasks_area ON personal_tasks(area)
    `);
    console.log('✓ Created index on area');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_personal_tasks_subarea ON personal_tasks(subarea)
    `);
    console.log('✓ Created index on subarea');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_personal_tasks_created_at ON personal_tasks(created_at)
    `);
    console.log('✓ Created index on created_at');

    // Create update trigger function if it doesn't exist
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_personal_tasks_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);
    console.log('✓ Created update trigger function');

    // Create trigger for automatic timestamp updates
    await pool.query(`
      DROP TRIGGER IF EXISTS trigger_personal_tasks_updated_at ON personal_tasks
    `);
    
    await pool.query(`
      CREATE TRIGGER trigger_personal_tasks_updated_at
        BEFORE UPDATE ON personal_tasks
        FOR EACH ROW
        EXECUTE FUNCTION update_personal_tasks_updated_at()
    `);
    console.log('✓ Created update trigger');

    // Add table comments for documentation
    await pool.query(`
      COMMENT ON TABLE personal_tasks IS 'Personal tasks - private to each user, only visible to the task owner'
    `);
    await pool.query(`
      COMMENT ON COLUMN personal_tasks.user_id IS 'Owner of the personal task - strict privacy isolation'
    `);
    await pool.query(`
      COMMENT ON COLUMN personal_tasks.area IS 'Area classification using centralized taxonomy'
    `);
    await pool.query(`
      COMMENT ON COLUMN personal_tasks.subarea IS 'Subarea classification using centralized taxonomy'
    `);
    console.log('✓ Added table documentation');

    console.log('Personal tasks table migration completed successfully!');
    res.status(200).json({ 
      message: 'Personal tasks table created successfully!',
      table: 'personal_tasks',
      indexes_added: [
        'idx_personal_tasks_user_id', 
        'idx_personal_tasks_status', 
        'idx_personal_tasks_due_date',
        'idx_personal_tasks_area',
        'idx_personal_tasks_subarea',
        'idx_personal_tasks_created_at'
      ],
      triggers: ['trigger_personal_tasks_updated_at'],
      features: [
        'Strict user isolation - users can only see their own tasks',
        'Same structure as main tasks table',
        'Integrated with Areas/Subareas taxonomy',
        'Full CRUD operations support',
        'Automatic timestamp management'
      ]
    });
    
  } catch (error) {
    console.error('Personal tasks table migration error:', error);
    res.status(500).json({ 
      error: 'Failed to create personal tasks table', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add por_realizar column to ledger tables
router.post('/add-por-realizar-to-ledgers', async (req: Request, res: Response) => {
  try {
    console.log('Starting por_realizar column migration for ledger tables...');

    // Add por_realizar column to ledger_entries (USD)
    await pool.query(`
      ALTER TABLE ledger_entries 
      ADD COLUMN IF NOT EXISTS por_realizar BOOLEAN DEFAULT FALSE
    `);
    console.log('✓ Added por_realizar column to ledger_entries (USD)');

    // Add por_realizar column to ledger_entries_mxn  
    await pool.query(`
      ALTER TABLE ledger_entries_mxn 
      ADD COLUMN IF NOT EXISTS por_realizar BOOLEAN DEFAULT FALSE
    `);
    console.log('✓ Added por_realizar column to ledger_entries_mxn (MXN)');

    // Create indexes for better performance on por_realizar queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ledger_entries_por_realizar ON ledger_entries(por_realizar)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ledger_entries_mxn_por_realizar ON ledger_entries_mxn(por_realizar)
    `);
    console.log('✓ Created performance indexes for por_realizar column');

    // Add column documentation
    await pool.query(`
      COMMENT ON COLUMN ledger_entries.por_realizar IS 'Indicates if this is a future transaction not yet realized - affects total calculations'
    `);
    await pool.query(`
      COMMENT ON COLUMN ledger_entries_mxn.por_realizar IS 'Indicates if this is a future transaction not yet realized - affects total calculations'
    `);
    console.log('✓ Added column documentation');

    console.log('Por realizar column migration completed successfully!');
    res.status(200).json({ 
      message: 'Por realizar feature added to ledger tables successfully!',
      tables_updated: ['ledger_entries', 'ledger_entries_mxn'],
      column_added: 'por_realizar BOOLEAN DEFAULT FALSE',
      indexes_added: ['idx_ledger_entries_por_realizar', 'idx_ledger_entries_mxn_por_realizar'],
      features: [
        'Future transaction tracking - separate from current cash flow',
        'Pending income and expense categorization', 
        'Mark as realized functionality support',
        'Enhanced financial forecasting capabilities'
      ]
    });
    
  } catch (error) {
    console.error('Por realizar migration error:', error);
    res.status(500).json({ 
      error: 'Failed to add por_realizar feature to ledger tables', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Check if por_realizar column exists
router.get('/check-por-realizar-column', async (req: Request, res: Response) => {
  try {
    console.log('Checking por_realizar column in ledger tables...');

    // Check USD ledger table
    const usdResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'ledger_entries' AND column_name = 'por_realizar'
    `);

    // Check MXN ledger table  
    const mxnResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'ledger_entries_mxn' AND column_name = 'por_realizar'
    `);

    // Test actual data query
    const testQuery = await pool.query(`
      SELECT id, por_realizar FROM ledger_entries LIMIT 1
    `);

    res.status(200).json({
      message: 'Por realizar column check completed',
      usd_table_column: usdResult.rows[0] || 'Column not found',
      mxn_table_column: mxnResult.rows[0] || 'Column not found', 
      test_data_query: testQuery.rows[0] || 'No data found',
      column_exists: {
        usd: (usdResult.rowCount || 0) > 0,
        mxn: (mxnResult.rowCount || 0) > 0
      }
    });

  } catch (error) {
    console.error('Column check error:', error);
    res.status(500).json({
      error: 'Failed to check por_realizar column',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add contacts tables migration
router.post('/add-contacts-tables', async (req: Request, res: Response) => {
  try {
    console.log('Starting contacts tables migration...');
    
    // Read and execute the contacts migration SQL file
    const sqlPath = path.join(__dirname, '..', 'config', 'add-contacts-tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL migration
    await pool.query(sqlContent);

    res.status(200).json({ 
      message: 'Contacts tables created successfully!',
      tables: ['contacts', 'contact_attachments'],
      indexes: [
        'idx_contacts_user_id',
        'idx_contacts_internal_id',
        'idx_contacts_name',
        'idx_contacts_company',
        'idx_contacts_email',
        'idx_contacts_contact_type',
        'idx_contacts_status',
        'idx_contacts_created_at',
        'idx_contact_attachments_contact_id',
        'idx_contact_attachments_uploaded_by'
      ],
      triggers: ['trigger_contacts_updated_at']
    });
  } catch (error) {
    console.error('Contacts migration error:', error);
    res.status(500).json({ 
      error: 'Failed to create contacts tables', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add documents tables migration
router.post('/add-documents-tables', async (req: Request, res: Response) => {
  try {
    console.log('Starting documents tables migration...');
    
    // Read and execute the documents migration SQL file
    const sqlPath = path.join(__dirname, '..', 'config', 'add-documents-tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL migration
    await pool.query(sqlContent);

    res.status(200).json({ 
      message: 'Documents tables created successfully!',
      tables: ['documents', 'document_attachments'],
      indexes: [
        'idx_documents_user_id',
        'idx_documents_internal_id',
        'idx_documents_name',
        'idx_documents_area',
        'idx_documents_subarea',
        'idx_documents_status',
        'idx_documents_created_at',
        'idx_document_attachments_document_id',
        'idx_document_attachments_uploaded_by'
      ],
      triggers: ['trigger_documents_updated_at'],
      constraints: ['check_document_name_not_empty', 'check_area_not_empty', 'check_subarea_not_empty']
    });
  } catch (error) {
    console.error('Documents migration error:', error);
    res.status(500).json({ 
      error: 'Failed to create documents tables', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add area and subarea columns to contacts table
router.post('/add-area-subarea-contacts', async (req, res) => {
  try {
    console.log('Starting migration to add area/subarea columns to contacts table...');

    // Add area and subarea columns if they don't exist
    await pool.query(`
      DO $$ 
      BEGIN
          -- Add area column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'contacts' AND column_name = 'area') THEN
              ALTER TABLE contacts ADD COLUMN area VARCHAR(255);
          END IF;
          
          -- Add subarea column if it doesn't exist  
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'contacts' AND column_name = 'subarea') THEN
              ALTER TABLE contacts ADD COLUMN subarea VARCHAR(255);
          END IF;
          
          -- Add area_id column if it doesn't exist (foreign key to areas table)
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'contacts' AND column_name = 'area_id') THEN
              ALTER TABLE contacts ADD COLUMN area_id INTEGER REFERENCES areas(id);
          END IF;
          
          -- Add subarea_id column if it doesn't exist (foreign key to subareas table)
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'contacts' AND column_name = 'subarea_id') THEN
              ALTER TABLE contacts ADD COLUMN subarea_id INTEGER REFERENCES subareas(id);
          END IF;
      END $$;
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_contacts_area ON contacts(area);
      CREATE INDEX IF NOT EXISTS idx_contacts_subarea ON contacts(subarea);
      CREATE INDEX IF NOT EXISTS idx_contacts_area_id ON contacts(area_id);
      CREATE INDEX IF NOT EXISTS idx_contacts_subarea_id ON contacts(subarea_id);
    `);

    console.log('Contacts table area/subarea columns migration completed successfully!');

    res.status(200).json({ 
      message: 'Area and subarea columns added to contacts table successfully!',
      columns_added: ['area', 'subarea', 'area_id', 'subarea_id'],
      indexes_created: ['idx_contacts_area', 'idx_contacts_subarea', 'idx_contacts_area_id', 'idx_contacts_subarea_id']
    });
  } catch (error) {
    console.error('Contacts area/subarea migration error:', error);
    res.status(500).json({ 
      error: 'Failed to add area/subarea columns to contacts table', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clean up documents with fake demo-storage URLs
router.post('/clean-demo-storage-urls', async (req, res) => {
  try {
    console.log('Starting cleanup of documents with fake demo-storage URLs...');

    // First, delete document_attachments with demo-storage URLs
    const deleteAttachmentsResult = await pool.query(`
      DELETE FROM document_attachments 
      WHERE file_url LIKE '%demo-storage.example.com%'
    `);

    // Then delete documents that no longer have any attachments
    const deleteDocumentsResult = await pool.query(`
      DELETE FROM documents 
      WHERE id NOT IN (
        SELECT DISTINCT document_id 
        FROM document_attachments 
        WHERE document_id IS NOT NULL
      )
    `);

    console.log('Demo storage URLs cleanup completed successfully!');

    res.status(200).json({ 
      message: 'Demo storage URLs cleaned up successfully!',
      attachments_deleted: deleteAttachmentsResult.rowCount,
      documents_deleted: deleteDocumentsResult.rowCount
    });
  } catch (error) {
    console.error('Demo storage cleanup error:', error);
    res.status(500).json({ 
      error: 'Failed to clean up demo storage URLs', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add projects tables migration
router.post('/add-projects-tables', async (req: Request, res: Response) => {
  try {
    console.log('Starting projects tables migration...');

    // Read and execute the projects migration SQL file
    const sqlPath = path.join(__dirname, '..', 'config', 'add-projects-tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL migration
    await pool.query(sqlContent);

    res.status(200).json({
      message: 'Projects tables created successfully!',
      tables: ['projects', 'project_tasks'],
      columns_added: ['tasks.start_date'],
      indexes: [
        'idx_projects_user_id',
        'idx_projects_area',
        'idx_projects_status',
        'idx_projects_visibility',
        'idx_projects_dates',
        'idx_project_tasks_project_id',
        'idx_project_tasks_task_id',
        'idx_project_tasks_dates',
        'idx_project_tasks_display_order',
        'idx_tasks_start_date'
      ],
      triggers: ['update_projects_updated_at'],
      features: [
        'Gantt chart project management',
        'Task timeline visualization',
        'Project visibility control (shared/private)',
        'Task start and end date tracking',
        'Project status management'
      ]
    });
  } catch (error) {
    console.error('Projects migration error:', error);
    res.status(500).json({
      error: 'Failed to create projects tables',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add notifications tables migration
router.post('/add-notifications-tables', async (req: Request, res: Response) => {
  try {
    console.log('Starting notifications tables migration...');

    // Read and execute the notifications migration SQL file
    const sqlPath = path.join(__dirname, '..', 'config', 'add-notifications-tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL migration
    await pool.query(sqlContent);

    res.status(200).json({
      message: 'Notifications tables created successfully!',
      tables: ['notifications', 'notification_preferences'],
      indexes: [
        'idx_notifications_user_id',
        'idx_notifications_task_id',
        'idx_notifications_created_at',
        'idx_notifications_is_read'
      ],
      triggers: ['notifications_updated_at', 'notification_preferences_updated_at'],
      features: [
        'Task deadline notifications',
        'User notification preferences',
        'Multiple notification types (deadline_approaching, deadline_today, overdue, new_task, status_change)',
        'Read/unread tracking',
        'Configurable days before deadline alert'
      ]
    });
  } catch (error) {
    console.error('Notifications migration error:', error);
    res.status(500).json({
      error: 'Failed to create notifications tables',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add ledger facturas table for MXN fiscal invoices
router.post('/add-ledger-facturas-mxn', async (req, res) => {
  try {
    const sqlPath = path.join(__dirname, '../config/add-ledger-facturas-mxn.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    await pool.query(sql);

    res.json({
      message: 'Ledger facturas MXN table created successfully',
      table: 'ledger_facturas_mxn',
      description: 'Table for storing Mexican fiscal invoices (facturas) with SAT metadata',
      columns: [
        'id',
        'ledger_entry_id',
        'file_name',
        'file_url',
        'file_size',
        'file_type',
        'folio',
        'uuid',
        'rfc_emisor',
        'rfc_receptor',
        'total',
        'subtotal',
        'iva',
        'fecha_timbrado',
        'uploaded_by',
        'notes',
        'created_at',
        'updated_at'
      ],
      indexes: [
        'idx_ledger_facturas_mxn_ledger_entry_id',
        'idx_ledger_facturas_mxn_uuid',
        'idx_ledger_facturas_mxn_folio',
        'idx_ledger_facturas_mxn_rfc_emisor',
        'idx_ledger_facturas_mxn_uploaded_by'
      ],
      triggers: ['update_ledger_facturas_mxn_updated_at'],
      features: [
        'Store Mexican fiscal invoices (facturas SAT)',
        'Track UUID and folio numbers',
        'Store RFC for emisor and receptor',
        'Track invoice totals, subtotals, and IVA',
        'Timestamp certification date (fecha_timbrado)',
        'Support for PDF and XML facturas',
        'Separate from general attachments for clarity'
      ]
    });
  } catch (error) {
    console.error('Ledger facturas MXN migration error:', error);
    res.status(500).json({
      error: 'Failed to create ledger facturas MXN table',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add produccion tables migration
router.post('/add-produccion-tables', async (req: Request, res: Response) => {
  try {
    console.log('Starting produccion tables migration...');

    const sqlPath = path.join(__dirname, '..', 'config', 'add-produccion-tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    await pool.query(sqlContent);

    res.status(200).json({
      message: 'Produccion tables created successfully!',
      tables: [
        'produccion_tipo',
        'produccion_size',
        'produccion_capacity',
        'produccion_esmalte_color',
        'produccion_products'
      ],
      indexes: [
        'idx_produccion_products_tipo',
        'idx_produccion_products_size',
        'idx_produccion_products_capacity',
        'idx_produccion_products_esmalte',
        'idx_produccion_products_created_by',
        'idx_produccion_products_name'
      ],
      triggers: [
        'trigger_produccion_tipo_updated_at',
        'trigger_produccion_size_updated_at',
        'trigger_produccion_capacity_updated_at',
        'trigger_produccion_esmalte_color_updated_at',
        'trigger_produccion_products_updated_at'
      ],
      features: [
        'Master data tables for Tipo, Size, Capacity, and Esmalte Color',
        'Products catalog with cost tracking',
        'Peso en crudo (raw weight)',
        'Costo mano de obra (labor cost)',
        'Cantidad esmalte (glaze amount)',
        'Costo esmalte (glaze cost)',
        'Costo horneado (firing cost)'
      ]
    });
  } catch (error) {
    console.error('Produccion migration error:', error);
    res.status(500).json({
      error: 'Failed to create produccion tables',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Make produccion fields optional migration
router.post('/produccion-make-fields-optional', async (req: Request, res: Response) => {
  try {
    console.log('Making produccion fields optional...');

    const sqlPath = path.join(__dirname, '..', 'config', 'produccion-make-fields-optional.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    await pool.query(sqlContent);

    res.status(200).json({
      message: 'Produccion fields updated successfully!',
      changes: [
        'size_id is now optional',
        'capacity_id is now optional',
        'esmalte_color_id is now optional'
      ]
    });
  } catch (error) {
    console.error('Produccion fields migration error:', error);
    res.status(500).json({
      error: 'Failed to update produccion fields',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add stage field to produccion products migration
router.post('/produccion-add-stage-field', async (req: Request, res: Response) => {
  try {
    console.log('Adding stage field to produccion products...');

    const sqlPath = path.join(__dirname, '..', 'config', 'produccion-add-stage-field.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    await pool.query(sqlContent);

    res.status(200).json({
      message: 'Stage field added successfully!',
      changes: [
        'stage column added (CRUDO, SANCOCHADO, ESMALTADO)',
        'esmalte_color_id now only allowed for ESMALTADO stage',
        'Default stage is CRUDO'
      ]
    });
  } catch (error) {
    console.error('Stage field migration error:', error);
    res.status(500).json({
      error: 'Failed to add stage field',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/produccion-add-peso-costo-fields', async (req: Request, res: Response) => {
  try {
    console.log('Adding peso_esmaltado and costo_pasta fields to produccion products...');

    const sqlPath = path.join(__dirname, '..', 'config', 'produccion-add-peso-costo-fields.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    await pool.query(sqlContent);

    res.status(200).json({
      message: 'Peso esmaltado and costo pasta fields added successfully!',
      changes: [
        'peso_esmaltado column added (optional)',
        'costo_pasta column added (optional)'
      ]
    });
  } catch (error) {
    console.error('Peso/Costo fields migration error:', error);
    res.status(500).json({
      error: 'Failed to add peso_esmaltado and costo_pasta fields',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/produccion-add-inventory-tables', async (req: Request, res: Response) => {
  try {
    console.log('Adding inventory tables for produccion...');

    const sqlPath = path.join(__dirname, '..', 'config', 'produccion-add-inventory-tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    await pool.query(sqlContent);

    res.status(200).json({
      message: 'Inventory tables created successfully!',
      changes: [
        'produccion_inventory table created',
        'produccion_inventory_movements table created',
        'Indexes and constraints added'
      ]
    });
  } catch (error) {
    console.error('Inventory tables migration error:', error);
    res.status(500).json({
      error: 'Failed to create inventory tables',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/ventas-quotations', async (req: Request, res: Response) => {
  try {
    console.log('Creating ventas quotations tables...');

    const sqlPath = path.join(__dirname, '..', 'config', 'ventas-quotations.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    await pool.query(sqlContent);

    res.status(200).json({
      message: 'Ventas quotations tables created successfully!',
      tables: ['ventas_quotations', 'ventas_quotation_items'],
      functions: ['generate_quotation_number', 'calculate_quotation_item_totals', 'recalculate_quotation_totals'],
      triggers: ['quotation_item_calculate_totals', 'quotation_items_update_totals'],
      indexes: ['idx_ventas_quotations_created_at', 'idx_ventas_quotation_items_quotation_id']
    });
  } catch (error) {
    console.error('Ventas quotations migration error:', error);
    res.status(500).json({
      error: 'Failed to create ventas quotations tables',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;