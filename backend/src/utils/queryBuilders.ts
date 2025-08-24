/**
 * Utility functions for building common database queries
 * Reduces code duplication across controllers
 */

export interface LedgerQueryFilters {
  entryType?: string;
  bankAccount?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  por_realizar?: string;
}

export interface QueryResult {
  whereClause: string;
  queryParams: any[];
  paramIndex: number;
}

/**
 * Builds WHERE clause and parameters for ledger queries
 */
export const buildLedgerFilters = (
  filters: LedgerQueryFilters,
  startParamIndex: number = 2 // Usually 1 is userId
): QueryResult => {
  let whereClause = '';
  const queryParams: any[] = [];
  let paramIndex = startParamIndex;

  if (filters.entryType && filters.entryType !== 'all') {
    whereClause += ` AND le.entry_type = $${paramIndex}`;
    queryParams.push(filters.entryType);
    paramIndex++;
  }

  if (filters.bankAccount) {
    whereClause += ` AND le.bank_account = $${paramIndex}`;
    queryParams.push(filters.bankAccount);
    paramIndex++;
  }

  if (filters.dateFrom) {
    whereClause += ` AND le.transaction_date >= $${paramIndex}`;
    queryParams.push(filters.dateFrom);
    paramIndex++;
  }

  if (filters.dateTo) {
    whereClause += ` AND le.transaction_date <= $${paramIndex}`;
    queryParams.push(filters.dateTo);
    paramIndex++;
  }

  if (filters.search) {
    whereClause += ` AND (
      le.concept ILIKE $${paramIndex} OR 
      le.internal_id ILIKE $${paramIndex} OR 
      le.bank_movement_id ILIKE $${paramIndex} OR
      le.area ILIKE $${paramIndex} OR
      le.subarea ILIKE $${paramIndex}
    )`;
    queryParams.push(`%${filters.search}%`);
    paramIndex++;
  }

  if (filters.por_realizar && filters.por_realizar !== 'all') {
    const isPorRealizar = filters.por_realizar === 'por_realizar';
    whereClause += ` AND le.por_realizar = $${paramIndex}`;
    queryParams.push(isPorRealizar);
    paramIndex++;
  }

  return {
    whereClause,
    queryParams,
    paramIndex
  };
};

/**
 * Builds the standard ledger entries query with user information
 */
export const buildLedgerEntriesQuery = (
  tableName: string,
  attachmentTableName: string,
  whereClause: string,
  foreignKeyColumn: string = 'ledger_entry_id'
): string => {
  return `
    SELECT 
      le.*,
      le.transaction_date as date,
      le.por_realizar,
      u.username,
      u.first_name,
      u.last_name,
      COUNT(la.id) as attachment_count
    FROM ${tableName} le
    LEFT JOIN ${attachmentTableName} la ON le.id = la.${foreignKeyColumn}
    LEFT JOIN users u ON le.user_id = u.id
    WHERE 1=1 ${whereClause}
    GROUP BY le.id, u.username, u.first_name, u.last_name
    ORDER BY le.transaction_date DESC, le.created_at DESC
  `;
};

/**
 * Builds the standard ledger entry query for a single entry with attachments
 */
export const buildSingleLedgerEntryQuery = (
  tableName: string,
  attachmentTableName: string
): string => {
  return `
    SELECT 
      le.*,
      le.transaction_date as date,
      le.por_realizar,
      u.username,
      u.first_name,
      u.last_name
    FROM ${tableName} le
    LEFT JOIN users u ON le.user_id = u.id
    WHERE le.id = $1
  `;
};

/**
 * Builds the standard summary query for ledger totals
 */
export const buildLedgerSummaryQuery = (
  tableName: string,
  whereClause: string = ''
): string => {
  return `
    SELECT 
      COALESCE(SUM(CASE WHEN entry_type = 'income' THEN amount ELSE 0 END), 0) as total_income,
      COALESCE(SUM(CASE WHEN entry_type = 'expense' THEN ABS(amount) ELSE 0 END), 0) as total_expenses,
      COALESCE(SUM(amount), 0) as net_cash_flow,
      COUNT(*) as total_entries
    FROM ${tableName} le
    WHERE 1=1 ${whereClause}
  `;
};