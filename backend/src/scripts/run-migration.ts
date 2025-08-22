import { readFileSync } from 'fs';
import { join } from 'path';
import db from '../config/database';

async function runMigration() {
  const client = await db.connect();
  
  try {
    console.log('Starting migration to add area and subarea to cotizaciones_entries...');
    
    const sqlPath = join(__dirname, '../config/alter-cotizaciones-add-area-subarea.sql');
    const sql = readFileSync(sqlPath, 'utf-8');
    
    // Split by semicolon and run each statement
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim().substring(0, 50) + '...');
        await client.query(statement.trim());
      }
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await db.end();
  }
}

// Run if called directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Migration script finished.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

export default runMigration;