import express from 'express';
import db from '../config/database';

const router = express.Router();

// Migration endpoint to add area and subarea columns
router.post('/add-area-subarea-cotizaciones', async (req, res) => {
  const client = await db.connect();
  
  try {
    console.log('Starting migration to add area and subarea to cotizaciones_entries...');
    
    // Step 1: Add the columns
    await client.query(`
      ALTER TABLE cotizaciones_entries 
      ADD COLUMN IF NOT EXISTS area VARCHAR(255),
      ADD COLUMN IF NOT EXISTS subarea VARCHAR(255)
    `);
    console.log('✓ Added columns area and subarea');
    
    // Step 2: Update existing records with default values
    await client.query(`
      UPDATE cotizaciones_entries 
      SET area = 'General', subarea = 'Miscellaneous' 
      WHERE area IS NULL OR subarea IS NULL
    `);
    console.log('✓ Updated existing records with default values');
    
    // Step 3: Make columns NOT NULL
    await client.query(`
      ALTER TABLE cotizaciones_entries 
      ALTER COLUMN area SET NOT NULL,
      ALTER COLUMN subarea SET NOT NULL
    `);
    console.log('✓ Set columns as NOT NULL');
    
    // Step 4: Add indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_cotizaciones_entries_area ON cotizaciones_entries(area)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_cotizaciones_entries_subarea ON cotizaciones_entries(subarea)
    `);
    console.log('✓ Added indexes for performance');
    
    console.log('Migration completed successfully!');
    res.json({ 
      success: true, 
      message: 'Migration completed successfully! Area and subarea columns added to cotizaciones_entries.' 
    });
    
  } catch (error) {
    console.error('Migration failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Migration failed', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  } finally {
    client.release();
  }
});

export default router;