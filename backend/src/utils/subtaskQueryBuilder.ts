// Standardized query builder for subtasks to eliminate code duplication
export interface SubtaskColumnStatus {
  status: boolean;
  assignee: boolean;
  reference_type: boolean;
  reference_id: boolean;
  reference_name: boolean;
  start_date: boolean;
  end_date: boolean;
}

export const buildSubtaskSelectQuery = (columnStatus: SubtaskColumnStatus): string => {
  const baseColumns = `
    id,
    task_id,
    name,
    description,
    created_at,
    updated_at`;

  const conditionalColumns = [];
  
  if (columnStatus.status) conditionalColumns.push('status');
  if (columnStatus.assignee) conditionalColumns.push('assignee');
  if (columnStatus.reference_type) conditionalColumns.push('reference_type');
  if (columnStatus.reference_id) conditionalColumns.push('reference_id');
  if (columnStatus.reference_name) conditionalColumns.push('reference_name');
  if (columnStatus.start_date) conditionalColumns.push('start_date');
  if (columnStatus.end_date) conditionalColumns.push('end_date');

  const allColumns = baseColumns + (conditionalColumns.length > 0 ? ',\n    ' + conditionalColumns.join(',\n    ') : '');

  return `SELECT ${allColumns} FROM subtasks`;
};

export const buildSubtaskInsertQuery = (columnStatus: SubtaskColumnStatus): { query: string; paramCount: number } => {
  const baseColumns = ['task_id', 'name', 'description'];
  const baseParams = ['$1', '$2', '$3'];
  let paramCounter = 4;

  const conditionalColumns = [];
  const conditionalParams = [];

  if (columnStatus.status) {
    conditionalColumns.push('status');
    conditionalParams.push(`$${paramCounter++}`);
  }
  if (columnStatus.assignee) {
    conditionalColumns.push('assignee');
    conditionalParams.push(`$${paramCounter++}`);
  }
  if (columnStatus.reference_type) {
    conditionalColumns.push('reference_type');
    conditionalParams.push(`$${paramCounter++}`);
  }
  if (columnStatus.reference_id) {
    conditionalColumns.push('reference_id');
    conditionalParams.push(`$${paramCounter++}`);
  }
  if (columnStatus.reference_name) {
    conditionalColumns.push('reference_name');
    conditionalParams.push(`$${paramCounter++}`);
  }
  if (columnStatus.start_date) {
    conditionalColumns.push('start_date');
    conditionalParams.push(`$${paramCounter++}`);
  }
  if (columnStatus.end_date) {
    conditionalColumns.push('end_date');
    conditionalParams.push(`$${paramCounter++}`);
  }

  const allColumns = [...baseColumns, ...conditionalColumns];
  const allParams = [...baseParams, ...conditionalParams];

  const query = `
    INSERT INTO subtasks (${allColumns.join(', ')})
    VALUES (${allParams.join(', ')})
    RETURNING ${buildSubtaskSelectQuery(columnStatus).replace('FROM subtasks', '')}
  `;

  return { query, paramCount: paramCounter - 1 };
};

export const buildSubtaskUpdateQuery = (columnStatus: SubtaskColumnStatus): { query: string; paramCount: number } => {
  const baseUpdates = ['name = $2', 'description = $3'];
  let paramCounter = 4;

  const conditionalUpdates = [];

  if (columnStatus.status) {
    conditionalUpdates.push(`status = $${paramCounter++}`);
  }
  if (columnStatus.assignee) {
    conditionalUpdates.push(`assignee = $${paramCounter++}`);
  }
  if (columnStatus.reference_type) {
    conditionalUpdates.push(`reference_type = $${paramCounter++}`);
  }
  if (columnStatus.reference_id) {
    conditionalUpdates.push(`reference_id = $${paramCounter++}`);
  }
  if (columnStatus.reference_name) {
    conditionalUpdates.push(`reference_name = $${paramCounter++}`);
  }
  if (columnStatus.start_date) {
    conditionalUpdates.push(`start_date = $${paramCounter++}`);
  }
  if (columnStatus.end_date) {
    conditionalUpdates.push(`end_date = $${paramCounter++}`);
  }

  const allUpdates = [...baseUpdates, ...conditionalUpdates];

  const query = `
    UPDATE subtasks 
    SET ${allUpdates.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING ${buildSubtaskSelectQuery(columnStatus).replace('FROM subtasks', '')}
  `;

  return { query, paramCount: paramCounter - 1 };
};