# Database Table Editing Guide

This guide explains the step-by-step process to safely edit existing database tables in the RINO-1 project.

## Overview

When you need to add new columns or modify existing database tables, follow this systematic approach to ensure data integrity and maintain consistency across the entire application stack.

## Step-by-Step Process

### 1. Plan Your Changes

Before making any changes, clearly define:
- **What columns/fields you want to add**
- **Data types and constraints**
- **Default values for existing records**
- **Whether fields should be required (NOT NULL)**
- **Impact on existing functionality**

### 2. Update Database Schema

#### Option A: Create Migration SQL File
```sql
-- Example: Add new columns
ALTER TABLE your_table_name 
ADD COLUMN IF NOT EXISTS new_column_1 VARCHAR(255),
ADD COLUMN IF NOT EXISTS new_column_2 TEXT;

-- Update existing records with default values
UPDATE your_table_name 
SET new_column_1 = 'Default Value', new_column_2 = 'Default Description' 
WHERE new_column_1 IS NULL OR new_column_2 IS NULL;

-- Make columns NOT NULL if required
ALTER TABLE your_table_name 
ALTER COLUMN new_column_1 SET NOT NULL,
ALTER COLUMN new_column_2 SET NOT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_your_table_new_column_1 ON your_table_name(new_column_1);
CREATE INDEX IF NOT EXISTS idx_your_table_new_column_2 ON your_table_name(new_column_2);
```

#### Option B: Add Migration Endpoint
Add a new migration endpoint to `backend/src/routes/migrate.ts`:

```typescript
router.post('/your-migration-name', async (req, res) => {
  try {
    console.log('Starting migration...');
    
    // Step 1: Add columns
    await pool.query(`
      ALTER TABLE your_table_name 
      ADD COLUMN IF NOT EXISTS new_column VARCHAR(255)
    `);
    
    // Step 2: Update existing records
    const updateResult = await pool.query(`
      UPDATE your_table_name 
      SET new_column = 'Default Value' 
      WHERE new_column IS NULL
    `);
    
    // Step 3: Add constraints
    await pool.query(`
      ALTER TABLE your_table_name 
      ALTER COLUMN new_column SET NOT NULL
    `);
    
    // Step 4: Add indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_your_table_new_column ON your_table_name(new_column)
    `);
    
    res.status(200).json({ 
      message: 'Migration completed successfully!',
      records_updated: updateResult.rowCount
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ 
      error: 'Migration failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
```

### 3. Update Backend Types and Interfaces

#### Update TypeScript Interfaces
In your controller file (e.g., `backend/src/controllers/yourController.ts`):

```typescript
// Update form data interface
interface YourFormData extends BaseFormData {
  existing_field: string;
  new_column_1: string;  // Add new fields
  new_column_2: string;
}

// Update entry interface if using separate types
interface YourEntry extends BaseEntry {
  existing_field: string;
  new_column_1: string;  // Add new fields
  new_column_2: string;
}
```

#### Update Validation Logic
```typescript
protected validateEntryData(data: YourFormData): void {
  // Existing validations...
  
  // Add new field validations
  if (!data.new_column_1 || !data.new_column_1.trim()) {
    throw new Error('New column 1 is required');
  }
  
  if (!data.new_column_2 || !data.new_column_2.trim()) {
    throw new Error('New column 2 is required');
  }
}
```

#### Add Filtering Support (Optional)
```typescript
// In your getEntries method, add new filter conditions
if (filters.new_column_1) {
  whereClause += ` AND e.new_column_1 ILIKE $${paramIndex}`;
  params.push(`%${filters.new_column_1}%`);
  paramIndex++;
}
```

### 4. Update Frontend Service Types

In your service file (e.g., `frontend/src/services/yourService.ts`):

```typescript
// Update interfaces
export interface YourEntry extends BaseEntry {
  existing_field: string;
  new_column_1: string;  // Add new fields
  new_column_2: string;
}

export interface YourEntryFormData extends BaseFormData {
  existing_field: string;
  new_column_1: string;  // Add new fields
  new_column_2: string;
}

export interface YourFilters extends BaseFilters {
  existing_filter?: string;
  new_column_1?: string;  // Add new filter options
  new_column_2?: string;
}
```

### 5. Update Frontend Form Component

In your form component (e.g., `frontend/src/components/YourEntryForm.tsx`):

#### Update State
```typescript
const [formData, setFormData] = useState<YourEntryFormData>({
  // Existing fields...
  new_column_1: initialData?.new_column_1 || '',
  new_column_2: initialData?.new_column_2 || '',
});
```

#### Add Validation
```typescript
const validateForm = () => {
  const newErrors: Record<string, string> = {};
  
  // Existing validations...
  
  if (!formData.new_column_1.trim()) {
    newErrors.new_column_1 = 'Field 1 is required';
  }
  
  if (!formData.new_column_2.trim()) {
    newErrors.new_column_2 = 'Field 2 is required';
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

#### Add Form Fields
```jsx
{/* New Field 1 */}
<div>
  <label htmlFor="new_column_1" className="block text-sm font-medium text-gray-700 mb-1">
    New Field 1 *
  </label>
  <input
    type="text"
    id="new_column_1"
    value={formData.new_column_1}
    onChange={(e) => handleChange('new_column_1', e.target.value)}
    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      errors.new_column_1 ? 'border-red-500' : ''
    }`}
    placeholder="Enter value for field 1"
    disabled={isLoading}
  />
  {errors.new_column_1 && <p className="text-red-500 text-xs mt-1">{errors.new_column_1}</p>}
</div>
```

### 6. Update Table/Display Component

In your table component (e.g., `frontend/src/components/YourTable.tsx`):

#### Add Table Headers
```jsx
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  New Field 1
</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  New Field 2
</th>
```

#### Add Table Data
```jsx
<td className="px-6 py-4 whitespace-nowrap">
  <div className="text-sm font-medium text-gray-900">
    {entry.new_column_1}
  </div>
  <div className="text-sm text-gray-500">
    {entry.new_column_2}
  </div>
</td>
```

### 7. Update Main Page (Optional - Add Filters)

In your main page component (e.g., `frontend/src/pages/YourPage.tsx`):

```jsx
{/* Add filter inputs */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    New Field 1
  </label>
  <input
    type="text"
    value={filters.new_column_1 || ''}
    onChange={(e) => setFilters(prev => ({ ...prev, new_column_1: e.target.value || undefined }))}
    placeholder="Filter by new field 1..."
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  />
</div>
```

## 8. Execute the Migration

### Option A: Run SQL Directly
Connect to your PostgreSQL database and execute your SQL migration script.

### Option B: Use Migration Endpoint
```bash
# Using PowerShell
Invoke-RestMethod -Uri "http://localhost:5000/api/migrate/your-migration-name" -Method POST

# Using curl
curl -X POST http://localhost:5000/api/migrate/your-migration-name
```

### Option C: Use Migration Script
```bash
npx ts-node backend/src/scripts/run-migration.ts
```

## 9. Test the Changes

1. **Verify Database Changes**: Check that columns were added and existing data was updated
2. **Test API Endpoints**: Use Postman or similar to test CRUD operations
3. **Test Frontend**: Create, edit, view, and filter records using the new fields
4. **Test Validation**: Ensure required field validation works on both frontend and backend

## Example: Adding Area and Subarea to Cotizaciones

Here's a real example from our recent cotizaciones table update:

### Migration Endpoint
```typescript
router.post('/add-area-subarea-cotizaciones', async (req, res) => {
  try {
    // Add columns
    await pool.query(`
      ALTER TABLE cotizaciones_entries 
      ADD COLUMN IF NOT EXISTS area VARCHAR(255),
      ADD COLUMN IF NOT EXISTS subarea VARCHAR(255)
    `);
    
    // Update existing records
    await pool.query(`
      UPDATE cotizaciones_entries 
      SET area = 'General', subarea = 'Miscellaneous' 
      WHERE area IS NULL OR subarea IS NULL
    `);
    
    // Make required
    await pool.query(`
      ALTER TABLE cotizaciones_entries 
      ALTER COLUMN area SET NOT NULL,
      ALTER COLUMN subarea SET NOT NULL
    `);
    
    // Add indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_cotizaciones_entries_area ON cotizaciones_entries(area),
      CREATE INDEX IF NOT EXISTS idx_cotizaciones_entries_subarea ON cotizaciones_entries(subarea)
    `);
    
    res.json({ message: 'Migration completed successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Execute Migration
```bash
Invoke-RestMethod -Uri "http://localhost:5000/api/migrate/add-area-subarea-cotizaciones" -Method POST
```

## Best Practices

1. **Always Backup**: Create a database backup before running migrations
2. **Test Locally First**: Run migrations on development environment first
3. **Use Transactions**: Wrap complex migrations in database transactions
4. **Handle Existing Data**: Always provide default values for new required fields
5. **Add Indexes**: Add database indexes for fields that will be filtered or sorted
6. **Validate on Both Ends**: Implement validation on both frontend and backend
7. **Update Documentation**: Update API documentation and type definitions
8. **Test Thoroughly**: Test all CRUD operations after migration

## Common Issues and Solutions

### Issue: Column Already Exists Error
**Solution**: Use `ADD COLUMN IF NOT EXISTS` in your ALTER TABLE statements

### Issue: Cannot Add NOT NULL Column
**Solution**: Add the column as nullable first, update existing records, then set NOT NULL

### Issue: Frontend Type Errors
**Solution**: Update all TypeScript interfaces and ensure form state includes new fields

### Issue: Validation Errors
**Solution**: Make sure both frontend and backend validation are updated consistently

## Files to Update Checklist

- [ ] Database migration script or endpoint
- [ ] Backend controller interfaces and validation
- [ ] Frontend service type definitions
- [ ] Form component state and validation
- [ ] Table/display component
- [ ] Main page filters (if applicable)
- [ ] Test the migration
- [ ] Test CRUD operations
- [ ] Update documentation