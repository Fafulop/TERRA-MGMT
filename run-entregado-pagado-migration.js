const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('Starting migration: Adding ENTREGADO_Y_PAGADO status...');

    // Drop the existing CHECK constraint
    await client.query(`
      ALTER TABLE ecommerce_pedidos
      DROP CONSTRAINT IF EXISTS ecommerce_pedidos_status_check;
    `);
    console.log('✓ Dropped old constraint');

    // Add the new CHECK constraint with ENTREGADO_Y_PAGADO
    await client.query(`
      ALTER TABLE ecommerce_pedidos
      ADD CONSTRAINT ecommerce_pedidos_status_check
      CHECK (status IN (
          'PENDING',
          'CONFIRMED',
          'PROCESSING',
          'SHIPPED',
          'DELIVERED',
          'ENTREGADO_Y_PAGADO',
          'CANCELLED'
      ));
    `);
    console.log('✓ Added new constraint with ENTREGADO_Y_PAGADO');

    // Update comment
    await client.query(`
      COMMENT ON COLUMN ecommerce_pedidos.status IS 'Order status: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, ENTREGADO_Y_PAGADO, CANCELLED';
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
