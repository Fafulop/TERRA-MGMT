/**
 * Utility functions for common validation logic
 * Reduces code duplication across controllers
 */

export interface LedgerEntryData {
  amount: number;
  concept: string;
  bankAccount: string;
  entryType: 'income' | 'expense';
  date: string;
  area: string;
  subarea: string;
  por_realizar?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validates ledger entry data
 */
export const validateLedgerEntry = (data: Partial<LedgerEntryData>): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Amount validation
  if (data.amount === undefined || data.amount === null) {
    errors.push({ field: 'amount', message: 'Amount is required' });
  } else if (typeof data.amount !== 'number' || isNaN(data.amount)) {
    errors.push({ field: 'amount', message: 'Amount must be a valid number' });
  } else if (data.amount === 0) {
    errors.push({ field: 'amount', message: 'Amount cannot be zero' });
  }

  // Concept validation
  if (!data.concept || typeof data.concept !== 'string') {
    errors.push({ field: 'concept', message: 'Concept is required' });
  } else if (data.concept.trim().length === 0) {
    errors.push({ field: 'concept', message: 'Concept cannot be empty' });
  } else if (data.concept.length > 255) {
    errors.push({ field: 'concept', message: 'Concept cannot exceed 255 characters' });
  }

  // Bank Account validation
  if (!data.bankAccount || typeof data.bankAccount !== 'string') {
    errors.push({ field: 'bankAccount', message: 'Bank account is required' });
  } else if (data.bankAccount.trim().length === 0) {
    errors.push({ field: 'bankAccount', message: 'Bank account cannot be empty' });
  }

  // Entry Type validation
  if (!data.entryType) {
    errors.push({ field: 'entryType', message: 'Entry type is required' });
  } else if (!['income', 'expense'].includes(data.entryType)) {
    errors.push({ field: 'entryType', message: 'Entry type must be either "income" or "expense"' });
  }

  // Date validation
  if (!data.date || typeof data.date !== 'string') {
    errors.push({ field: 'date', message: 'Date is required' });
  } else {
    const dateObj = new Date(data.date);
    if (isNaN(dateObj.getTime())) {
      errors.push({ field: 'date', message: 'Date must be a valid date' });
    }
  }

  // Area validation
  if (!data.area || typeof data.area !== 'string') {
    errors.push({ field: 'area', message: 'Area is required' });
  } else if (data.area.trim().length === 0) {
    errors.push({ field: 'area', message: 'Area cannot be empty' });
  }

  // Subarea validation
  if (!data.subarea || typeof data.subarea !== 'string') {
    errors.push({ field: 'subarea', message: 'Subarea is required' });
  } else if (data.subarea.trim().length === 0) {
    errors.push({ field: 'subarea', message: 'Subarea cannot be empty' });
  }

  // Por realizar validation (optional, but if provided must be boolean)
  if (data.por_realizar !== undefined && typeof data.por_realizar !== 'boolean') {
    errors.push({ field: 'por_realizar', message: 'Por realizar must be a boolean value' });
  }

  return errors;
};

/**
 * Validates numeric ID parameters
 */
export const validateId = (id: any, fieldName: string = 'id'): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  const numericId = parseInt(id);
  if (!id || isNaN(numericId) || numericId <= 0) {
    errors.push({ field: fieldName, message: `${fieldName} must be a valid positive integer` });
  }

  return errors;
};

/**
 * Validates pagination parameters
 */
export const validatePagination = (limit: any, offset: any): { limit: number; offset: number; errors: ValidationError[] } => {
  const errors: ValidationError[] = [];
  
  let validatedLimit = 50; // default
  let validatedOffset = 0; // default

  if (limit !== undefined) {
    const numericLimit = parseInt(limit);
    if (isNaN(numericLimit) || numericLimit <= 0) {
      errors.push({ field: 'limit', message: 'Limit must be a positive integer' });
    } else if (numericLimit > 1000) {
      errors.push({ field: 'limit', message: 'Limit cannot exceed 1000' });
    } else {
      validatedLimit = numericLimit;
    }
  }

  if (offset !== undefined) {
    const numericOffset = parseInt(offset);
    if (isNaN(numericOffset) || numericOffset < 0) {
      errors.push({ field: 'offset', message: 'Offset must be a non-negative integer' });
    } else {
      validatedOffset = numericOffset;
    }
  }

  return {
    limit: validatedLimit,
    offset: validatedOffset,
    errors
  };
};