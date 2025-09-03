import { Pool } from 'pg';

// Database utility functions to eliminate code duplication and schema inconsistencies

let pool: Pool;

export const setDatabasePool = (databasePool: Pool) => {
  pool = databasePool;
};

// Check if a column exists in a table (centralized function)
export const checkColumnExists = async (tableName: string, columnName: string): Promise<boolean> => {
  try {
    const result = await pool.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = $1 AND column_name = $2`,
      [tableName, columnName]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error(`Error checking if column ${columnName} exists in ${tableName}:`, error);
    return false;
  }
};

// Check multiple columns at once (more efficient)
export const checkMultipleColumnsExist = async (
  tableName: string, 
  columnNames: string[]
): Promise<Record<string, boolean>> => {
  try {
    const result = await pool.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = $1 AND column_name = ANY($2)`,
      [tableName, columnNames]
    );
    
    const existingColumns = new Set(result.rows.map(row => row.column_name));
    const columnStatus: Record<string, boolean> = {};
    
    columnNames.forEach(columnName => {
      columnStatus[columnName] = existingColumns.has(columnName);
    });
    
    return columnStatus;
  } catch (error) {
    console.error(`Error checking columns in ${tableName}:`, error);
    // Return all false if there's an error
    const columnStatus: Record<string, boolean> = {};
    columnNames.forEach(columnName => {
      columnStatus[columnName] = false;
    });
    return columnStatus;
  }
};

// Specific function for subtask columns with proper typing
export const checkSubtaskColumnsExist = async (): Promise<{
  status: boolean;
  assignee: boolean;
  reference_type: boolean;
  reference_id: boolean;
  reference_name: boolean;
  start_date: boolean;
  end_date: boolean;
}> => {
  const columns = ['status', 'assignee', 'reference_type', 'reference_id', 'reference_name', 'start_date', 'end_date'];
  const result = await checkMultipleColumnsExist('subtasks', columns);
  
  return {
    status: result.status || false,
    assignee: result.assignee || false,
    reference_type: result.reference_type || false,
    reference_id: result.reference_id || false,
    reference_name: result.reference_name || false,
    start_date: result.start_date || false,
    end_date: result.end_date || false,
  };
};

// Standardized error handling
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleDatabaseError = (error: any, operation: string) => {
  console.error(`Database error during ${operation}:`, error);
  
  // PostgreSQL specific error codes
  if (error.code === '23505') {
    throw new AppError('Duplicate entry', 409, 'DUPLICATE_ENTRY');
  } else if (error.code === '23503') {
    throw new AppError('Referenced record not found', 404, 'FOREIGN_KEY_VIOLATION');
  } else if (error.code === '23502') {
    throw new AppError('Required field missing', 400, 'NOT_NULL_VIOLATION');
  } else if (error.code === '22P02') {
    throw new AppError('Invalid data format', 400, 'INVALID_INPUT');
  } else {
    throw new AppError('Database operation failed', 500, 'DATABASE_ERROR');
  }
};