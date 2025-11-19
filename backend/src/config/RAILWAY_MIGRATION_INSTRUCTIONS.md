# Railway Database Migration Instructions

This guide explains how to update your Railway PostgreSQL database with the new produccion tables.

## What's Being Added

This migration adds the complete produccion (production) management system:

### Tables Created:
1. **produccion_tipo** - Product types
2. **produccion_size** - Product sizes (in cm)
3. **produccion_capacity** - Product capacities (in ml)
4. **produccion_esmalte_color** - Glaze colors
5. **produccion_products** - Production products catalog
6. **produccion_inventory** - Current inventory levels by stage
7. **produccion_inventory_movements** - Inventory movement history

### Modifications:
- Makes several product fields optional (size, capacity, color)
- Adds stage field (CRUDO, SANCOCHADO, ESMALTADO)
- Adds peso_esmaltado and costo_pasta fields

## How to Run the Migration on Railway

### Option 1: Using Railway CLI (Recommended)

1. **Install Railway CLI** (if not already installed):
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Link to your project**:
   ```bash
   railway link
   ```

4. **Run the migration**:
   ```bash
   railway run psql -f backend/src/config/railway-update-produccion-tables.sql
   ```

### Option 2: Using Railway Dashboard

1. **Go to your Railway project dashboard**
2. **Click on your PostgreSQL database service**
3. **Click on "Data" tab or "Query" tab**
4. **Copy the entire contents** of `railway-update-produccion-tables.sql`
5. **Paste into the query editor**
6. **Run the query**

### Option 3: Using a PostgreSQL Client (like pgAdmin, DBeaver, or psql)

1. **Get your Railway database credentials**:
   - Go to Railway dashboard → Your PostgreSQL service → Variables
   - Copy the DATABASE_URL or individual credentials

2. **Connect using psql**:
   ```bash
   psql "your-railway-database-url"
   ```

3. **Run the migration file**:
   ```sql
   \i backend/src/config/railway-update-produccion-tables.sql
   ```

   Or copy and paste the SQL content directly.

## Verification

After running the migration, verify it was successful by checking if the tables exist:

```sql
-- Check if produccion tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_name LIKE 'produccion_%'
ORDER BY table_name;
```

You should see 7 tables:
- produccion_capacity
- produccion_esmalte_color
- produccion_inventory
- produccion_inventory_movements
- produccion_products
- produccion_size
- produccion_tipo

## Important Notes

- ✅ **Safe to run multiple times** - The script uses `IF NOT EXISTS` and conditional logic
- ✅ **No data loss** - Only adds new tables and columns, doesn't delete anything
- ✅ **Production ready** - Includes proper indexes, constraints, and comments
- ⚠️ **Requires existing tables** - Assumes base tables (users) already exist

## Troubleshooting

### Error: "relation users does not exist"
**Solution**: Run the base `init-db.sql` first to create the users table.

### Error: "constraint already exists"
**Solution**: This is normal and can be ignored. The script handles duplicate constraints gracefully.

### Error: "permission denied"
**Solution**: Ensure you're connected with a user that has CREATE TABLE permissions.

## Next Steps

After the migration completes:
1. Test the produccion page at `/produccion`
2. Verify you can create product types, sizes, colors, and products
3. Test the inventory management features

## Rollback (if needed)

If you need to remove the produccion tables:

```sql
-- WARNING: This will delete all produccion data!
DROP TABLE IF EXISTS produccion_inventory_movements CASCADE;
DROP TABLE IF EXISTS produccion_inventory CASCADE;
DROP TABLE IF EXISTS produccion_products CASCADE;
DROP TABLE IF EXISTS produccion_esmalte_color CASCADE;
DROP TABLE IF EXISTS produccion_capacity CASCADE;
DROP TABLE IF EXISTS produccion_size CASCADE;
DROP TABLE IF EXISTS produccion_tipo CASCADE;
DROP FUNCTION IF EXISTS update_produccion_updated_at() CASCADE;
```

---

**File**: `backend/src/config/railway-update-produccion-tables.sql`
**Created**: 2025-11-18
**Version**: 1.0
