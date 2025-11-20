const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const connectionString = process.env.DATABASE_PUBLIC_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_PUBLIC_URL environment variable not set');
    console.log('Run: railway link');
    console.log('Then: railway variables');
    process.exit(1);
  }

  console.log('🚀 Starting MERMA migration to Railway...\n');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Railway database\n');

    // Read the migration file
    const sqlPath = path.join(__dirname, 'backend/src/config/produccion-add-merma-movement-type.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Executing migration: produccion-add-merma-movement-type.sql\n');

    // Execute the migration
    await client.query(sql);

    console.log('✅ Migration executed successfully!\n');

    // Verify the constraint was updated
    console.log('🔍 Verifying MERMA movement type was added...\n');

    const result = await client.query(`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints
      WHERE constraint_name LIKE '%movement_type%'
      AND constraint_schema = 'public';
    `);

    console.log('Constraint found:');
    result.rows.forEach(row => {
      console.log(`  - ${row.constraint_name}`);
      console.log(`    ${row.check_clause}\n`);
    });

    // Check if MERMA is in the constraint
    const hasMerma = result.rows.some(row =>
      row.check_clause && row.check_clause.includes('MERMA')
    );

    if (hasMerma) {
      console.log('✅ MERMA movement type successfully added to constraint!');
    } else {
      console.log('⚠️  MERMA not found in constraint. Please verify manually.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

runMigration().catch(console.error);
