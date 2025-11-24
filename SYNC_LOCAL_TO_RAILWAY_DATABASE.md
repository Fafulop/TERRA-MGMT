# Syncing Local Database Tables to Railway Deployed Database

## Overview

This guide documents the process of synchronizing database tables from a local development environment to a deployed Railway PostgreSQL database. This is necessary when new features are developed locally with database migrations that haven't been run on the production database yet.

## The Problem

**Situation:**
- Local database has new tables and schema changes from recent development
- Backend and frontend code deployed to Railway includes references to these new tables
- Railway PostgreSQL database is missing these tables
- Application fails or features don't work in production because tables don't exist

**What Was Missing:**
All produccion (production management) tables:
- `produccion_tipo` - Product types
- `produccion_size` - Product sizes (cm)
- `produccion_capacity` - Product capacities (ml)
- `produccion_esmalte_color` - Glaze colors
- `produccion_products` - Products catalog with costs and specifications
- `produccion_inventory` - Current inventory levels by stage
- `produccion_inventory_movements` - Inventory movement history

## Solution Process

### Step 1: Identify Missing Tables

**Goal:** Compare local database structure with Railway database to identify what's missing.

**Method:**
1. Review SQL migration files in `backend/src/config/`
2. List all migration files by date to see recent changes:
   ```bash
   ls -lt backend/src/config/*.sql | head -20
   ```

3. Identify table definitions in SQL files:
   ```bash
   cat backend/src/config/*.sql | grep -E "^CREATE TABLE IF NOT EXISTS" | sort -u
   ```

**Findings:**
Recent migrations for produccion system:
- `add-produccion-tables.sql` - Base tables
- `produccion-make-fields-optional.sql` - Schema modifications
- `produccion-add-stage-field.sql` - Added stage column
- `produccion-add-peso-costo-fields.sql` - Added weight/cost fields
- `produccion-add-inventory-tables.sql` - Inventory tracking

### Step 2: Create Consolidated Migration Script

**Goal:** Create a single SQL file that safely runs all missing migrations.

**Created:** `backend/src/config/railway-update-produccion-tables.sql`

**Key Features:**
- ✅ Safe to run multiple times (uses `IF NOT EXISTS`)
- ✅ Handles errors gracefully (uses `DO $$ ... EXCEPTION ... END $$`)
- ✅ Proper order of operations (tables before constraints)
- ✅ Complete with indexes, triggers, and comments
- ✅ No data loss (only adds, never drops)

**Structure:**
```sql
-- STEP 1: Create base tables (tipo, size, capacity, color, products)
-- STEP 2: Make fields optional (ALTER COLUMN DROP NOT NULL)
-- STEP 3: Add stage field (CRUDO, SANCOCHADO, ESMALTADO)
-- STEP 4: Add peso_esmaltado and costo_pasta fields
-- STEP 5: Create inventory tracking tables
```

### Step 3: Create Migration Instructions

**Created:** `backend/src/config/RAILWAY_MIGRATION_INSTRUCTIONS.md`

**Documented three methods:**
1. Railway CLI with psql
2. Railway Dashboard Query interface
3. External PostgreSQL client

### Step 4: Execute Migration on Railway

**Attempted Methods:**

#### ❌ Method 1: Railway Dashboard Query Interface
- **Issue:** User couldn't find Query/Data tab in Railway UI
- **Status:** Interface may vary by Railway version

#### ❌ Method 2: Railway CLI with psql
- **Command:** `railway run psql $DATABASE_URL -f migration.sql`
- **Issue:** psql not installed on Windows
- **Status:** Would work on Linux/Mac with PostgreSQL installed

#### ✅ Method 3: Node.js Script (SUCCESS!)
**Why this worked:**
- Node.js already installed (for backend development)
- `pg` package available in project dependencies
- Can read local SQL file and execute on Railway database
- Cross-platform (works on Windows, Linux, Mac)

**Implementation:**

Created `run-migration.js`:
```javascript
const { Client } = require('pg');
const fs = require('fs');

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_PUBLIC_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  const sql = fs.readFileSync('backend/src/config/railway-update-produccion-tables.sql', 'utf8');
  await client.query(sql);

  // Verify tables created
  const result = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_name LIKE 'produccion_%'
    ORDER BY table_name;
  `);

  console.log('Tables created:', result.rows);
  await client.end();
}
```

**Execution Steps:**
```bash
# 1. Login to Railway
railway login

# 2. Link to project (select TERRA-MGMT → production → Postgres)
railway link

# 3. Get database credentials (automatically set as env vars)
railway variables --json

# 4. Run migration script
node run-migration.js
```

**Result:**
```
✅ Migration completed successfully!

Produccion tables found:
  - produccion_capacity
  - produccion_esmalte_color
  - produccion_inventory
  - produccion_inventory_movements
  - produccion_products
  - produccion_size
  - produccion_tipo
```

## Step-by-Step Guide for Future Migrations

### Prerequisites
- Railway CLI installed: `npm install -g @railway/cli`
- Node.js and npm installed
- `pg` package in your project (should be in dependencies)
- Access to Railway project

### Process

1. **Identify what's missing:**
   ```bash
   # List recent SQL migration files
   ls -lt backend/src/config/*.sql

   # Review what tables they create
   grep "CREATE TABLE" backend/src/config/your-new-migration.sql
   ```

2. **Create consolidated migration script:**
   - Copy relevant SQL from individual migration files
   - Wrap in safe patterns (IF NOT EXISTS, DO $$ blocks)
   - Test locally first!

3. **Login and link to Railway:**
   ```bash
   railway login
   railway link
   # Select: Your workspace → Your project → production → Database service
   ```

4. **Create Node.js migration runner:**
   ```javascript
   // run-migration.js
   const { Client } = require('pg');
   const fs = require('fs');

   async function runMigration() {
     const connectionString = process.env.DATABASE_PUBLIC_URL || 'your-railway-db-url';

     const client = new Client({
       connectionString,
       ssl: { rejectUnauthorized: false }
     });

     await client.connect();

     const sql = fs.readFileSync('./path/to/migration.sql', 'utf8');
     await client.query(sql);

     // Verify
     const result = await client.query('SELECT table_name FROM information_schema.tables WHERE ...');
     console.log('Tables:', result.rows);

     await client.end();
   }

   runMigration().catch(console.error);
   ```

5. **Run the migration:**
   ```bash
   node run-migration.js
   ```

6. **Verify on Railway:**
   ```sql
   -- Check tables exist
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;

   -- Check specific tables
   SELECT table_name FROM information_schema.tables
   WHERE table_name LIKE 'your_prefix_%';
   ```

7. **Test your application:**
   - Visit your deployed app
   - Test the new features
   - Check logs for any database errors

## Important Notes

### ✅ Best Practices

1. **Always use safe SQL patterns:**
   ```sql
   CREATE TABLE IF NOT EXISTS ...
   CREATE INDEX IF NOT EXISTS ...

   -- For ALTER TABLE:
   DO $$
   BEGIN
     ALTER TABLE ... ADD COLUMN ...;
   EXCEPTION
     WHEN duplicate_column THEN NULL;
   END $$;
   ```

2. **Test locally first:**
   - Run the migration on your local database
   - Verify it works correctly
   - Then run on Railway

3. **Keep migration history:**
   - Don't delete old migration files
   - Name files with dates: `YYYY-MM-DD-description.sql`
   - Document what each migration does

4. **Backup before major changes:**
   - Railway provides automatic backups
   - For critical changes, create manual backup first

### ⚠️ Common Pitfalls

1. **Foreign key order matters:**
   - Create referenced tables first
   - Example: Create `users` before `products` if products reference users

2. **NOT NULL constraints:**
   - Can't add NOT NULL column to existing table with data
   - Use defaults or make optional first

3. **Constraint names must be unique:**
   - Use `IF NOT EXISTS` or handle duplicate errors
   - Railway might error if constraint already exists

### 🔧 Troubleshooting

**Problem:** "relation already exists"
- **Solution:** Normal if running script twice, it's idempotent

**Problem:** "psql not found" on Windows
- **Solution:** Use Node.js script method instead

**Problem:** "permission denied"
- **Solution:** Ensure Railway database user has CREATE privileges (default does)

**Problem:** Migration script fails halfway
- **Solution:** Fix error, script is designed to be re-run safely

## Files Created

1. **`backend/src/config/railway-update-produccion-tables.sql`**
   - Complete migration with all produccion tables
   - Safe to run multiple times
   - 286 lines, well-commented

2. **`backend/src/config/RAILWAY_MIGRATION_INSTRUCTIONS.md`**
   - Detailed instructions for running migrations
   - Multiple methods documented
   - Troubleshooting guide included

3. **`run-migration.js`** (temporary)
   - Node.js script to execute SQL on Railway
   - Connects using DATABASE_PUBLIC_URL
   - Verifies tables after creation
   - Deleted after use

## Success Verification

After running the migration, verify with these queries:

```sql
-- List all produccion tables
SELECT table_name,
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_name LIKE 'produccion_%'
ORDER BY table_name;

-- Check table structure
\d produccion_products

-- Verify constraints
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'produccion_products'::regclass;

-- Verify indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'produccion_products';
```

## Conclusion

**Summary:**
- ✅ Identified 5 migration files with 7 new tables
- ✅ Created consolidated, safe migration script
- ✅ Executed successfully on Railway using Node.js
- ✅ Verified all tables created correctly
- ✅ Production app now has all required tables

**Time to complete:** ~30 minutes (including troubleshooting)

**Impact:**
- Produccion features now work in production
- Database schema matches local development
- No data loss or downtime

---

## Sync Log: November 21, 2024

### What Was Synced

New tables and features added to Railway:

1. **Ventas Pedidos System** (`ventas-pedidos.sql`)
   - `ventas_pedidos` - Firm orders created from quotations
   - `ventas_pedido_items` - Line items for orders
   - Functions: `generate_pedido_number()`, `calculate_pedido_item_totals()`, `recalculate_pedido_totals()`
   - Triggers for automatic total calculation

2. **Inventory Allocations** (`ventas-inventory-allocations.sql`)
   - `ventas_pedido_allocations` - Track which inventory items are reserved for which orders
   - Added `apartados` column to `produccion_inventory`
   - Functions: `recalculate_inventory_apartados()`, `update_inventory_apartados()`
   - Triggers for automatic apartados recalculation

3. **Payment Tracking** (`ventas-pedido-payments.sql`)
   - `ventas_pedido_payments` - Links cash flow entries (`ledger_entries_mxn`) to pedidos
   - Functions: `recalculate_pedido_payment_totals()`
   - Triggers for automatic payment status updates (PENDING/PARTIAL/PAID)

### Step-by-Step Process Used

#### Step 1: Identify Recent Migrations
```bash
# List SQL files by date to find recent changes
ls -lt backend/src/config/*.sql | head -20
```

Found these new migrations:
- `ventas-pedido-payments.sql` (Nov 21)
- `ventas-inventory-allocations.sql` (Nov 20)
- `ventas-pedidos.sql` (Nov 20)

#### Step 2: Create Consolidated Migration Script

Created `backend/src/config/railway-sync-2024-11-21.sql` combining all three migrations:
- Safe to run multiple times (uses `IF NOT EXISTS`, `DO $$ ... END $$`)
- Proper order: tables first, then functions, then triggers
- Includes all indexes and comments

#### Step 3: Create Node.js Migration Runner

Created temporary `run-railway-sync.js`:
```javascript
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const connectionString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('ERROR: DATABASE_PUBLIC_URL or DATABASE_URL not set');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const sqlPath = path.join(__dirname, 'backend/src/config/railway-sync-2024-11-21.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  await client.query(sql);

  // Verify tables
  const result = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name LIKE 'ventas_%'
    ORDER BY table_name;
  `);

  console.log('Ventas tables found:');
  result.rows.forEach(row => console.log('  - ' + row.table_name));

  await client.end();
}

runMigration();
```

#### Step 4: Get Railway Database URL

```bash
# Check Railway is linked
railway status
# Output: Project: TERRA-MGMT, Environment: production, Service: Postgres

# Get the public database URL
railway variables --json | grep DATABASE_PUBLIC_URL
```

#### Step 5: Run Migration

```bash
# Set the URL and run the script
DATABASE_PUBLIC_URL="postgresql://postgres:xxx@maglev.proxy.rlwy.net:51438/railway" node run-railway-sync.js
```

**Output:**
```
Connecting to Railway database...
Connected successfully!

Running migration script...
Migration completed successfully!

Ventas tables found:
  - ventas_pedido_allocations
  - ventas_pedido_items
  - ventas_pedido_payments
  - ventas_pedidos
  - ventas_quotation_items
  - ventas_quotations

  apartados column exists in produccion_inventory

=== SYNC COMPLETE ===
```

#### Step 6: Cleanup

```bash
# Remove temporary script
rm run-railway-sync.js
```

The consolidated SQL file `railway-sync-2024-11-21.sql` was kept in `backend/src/config/` for reference.

### Verification

All tables were successfully created:
- `ventas_pedidos` ✓
- `ventas_pedido_items` ✓
- `ventas_pedido_allocations` ✓
- `ventas_pedido_payments` ✓
- `produccion_inventory.apartados` column ✓

---

## Sync Log: November 21, 2024 (Ecommerce System)

### What Was Synced

Complete Ecommerce system with payment tracking and inventory management:

1. **Ecommerce Kits System** (`ecommerce-kits.sql`)
   - `ecommerce_kits` - Product bundles/kits with own pricing and stock
   - `ecommerce_kit_items` - Products that make up each kit
   - `ecommerce_kit_allocations` - Inventory allocations reserved for kit stock
   - Functions: `recalculate_inventory_apartados_with_kits()`, `update_inventory_apartados_from_kit()`
   - Enhanced apartados calculation to include both pedido and kit allocations

2. **Ecommerce Pedidos (Orders)** (`ecommerce-pedidos.sql`)
   - `ecommerce_pedidos` - Customer orders that consume kit stock
   - `ecommerce_pedido_items` - Kits included in each order
   - Functions: `generate_ecommerce_pedido_number()`, `calculate_ecommerce_pedido_item_subtotal()`, `recalculate_ecommerce_pedido_totals()`
   - Pedido numbering format: ECO-YYYYMM-NNNNNN

3. **Payment Tracking for Ecommerce** (`ecommerce-pedido-payments.sql`)
   - `ecommerce_pedido_payments` - Links cash flow (VENTAS ECOMMERCE) to pedidos
   - Added `amount_paid` and `payment_status` columns to `ecommerce_pedidos`
   - Functions: `recalculate_ecommerce_pedido_payment_totals()`
   - Payment statuses: PENDING, PARTIAL, PAID, REFUNDED

4. **Inventory Tracking** (`add-vendidos-column.sql`)
   - Added `vendidos` column to `produccion_inventory`
   - Tracks total units sold (from delivered and paid orders)

5. **Status Enhancements** (`add-entregado-y-pagado-status.sql`, `add-entregado-y-pagado-ventas.sql`)
   - Added `ENTREGADO_Y_PAGADO` (Delivered and Paid) status to both:
     - `ecommerce_pedidos`
     - `ventas_pedidos`

### Migration Process

#### Created Consolidated Script
`backend/src/config/railway-sync-ecommerce-2024-11-21.sql` - 550+ lines combining all ecommerce migrations

#### Execution Steps
```bash
# 1. Railway already linked to TERRA-MGMT/production/Postgres
railway status
# Output: Project: TERRA-MGMT, Environment: production, Service: Postgres

# 2. Created temporary Node.js migration runner
# run-ecommerce-sync.js

# 3. Ran migration with Railway environment variables
railway run /d/node run-ecommerce-sync.js
```

#### Results
```
✅ Migration completed successfully!

Ecommerce tables found:
  ✓ ecommerce_kit_allocations
  ✓ ecommerce_kit_items
  ✓ ecommerce_kits
  ✓ ecommerce_pedido_items
  ✓ ecommerce_pedido_payments
  ✓ ecommerce_pedidos

Inventory updates:
  ✓ vendidos column exists in produccion_inventory

Status constraints:
  ✓ ventas_pedidos status constraint updated (includes ENTREGADO_Y_PAGADO)
  ✓ ecommerce_pedidos status constraint updated (includes ENTREGADO_Y_PAGADO)
```

### Verification

All new tables and columns successfully created on Railway:
- `ecommerce_kits` ✓
- `ecommerce_kit_items` ✓
- `ecommerce_kit_allocations` ✓
- `ecommerce_pedidos` ✓
- `ecommerce_pedido_items` ✓
- `ecommerce_pedido_payments` ✓
- `produccion_inventory.vendidos` column ✓
- Status constraints updated for both ecommerce and ventas ✓

### Impact

- ✅ Full ecommerce system now operational in production
- ✅ Kit-based order management with inventory tracking
- ✅ Payment tracking integrated with cash flow system
- ✅ Sold products tracking (vendidos) for analytics
- ✅ Unified status system across ecommerce and ventas mayoreo

---

**Document created:** 2025-11-18
**Last updated:** 2025-11-21 (Ecommerce Sync)
**Project:** TERRA-MGMT
**Database:** Railway PostgreSQL
**Environment:** Production
