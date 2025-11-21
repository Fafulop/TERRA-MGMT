const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('Starting migration: Adding VENDIDOS column...');

    // Add vendidos column
    await client.query(`
      ALTER TABLE produccion_inventory
      ADD COLUMN IF NOT EXISTS vendidos INTEGER DEFAULT 0 NOT NULL;
    `);
    console.log('✓ Added vendidos column');

    // Add check constraint to ensure vendidos is never negative
    await client.query(`
      ALTER TABLE produccion_inventory
      DROP CONSTRAINT IF EXISTS produccion_inventory_vendidos_non_negative;
    `);
    await client.query(`
      ALTER TABLE produccion_inventory
      ADD CONSTRAINT produccion_inventory_vendidos_non_negative
      CHECK (vendidos >= 0);
    `);
    console.log('✓ Added vendidos check constraint');

    // Update comment
    await client.query(`
      COMMENT ON COLUMN produccion_inventory.vendidos IS 'Total units sold (from delivered and paid ecommerce orders)';
    `);
    console.log('✓ Updated column comment');

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
