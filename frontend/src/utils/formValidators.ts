/**
 * Utility functions for frontend form validation
 * Reduces code duplication across form components
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates ledger entry form data
 */
export const validateLedgerEntry = (data: {
  amount: number;
  concept: string;
  bankAccount: string;
  entryType: string;
  date: string;
  area: string;
  subarea: string;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  // Amount validation
  if (!data.amount || data.amount === 0) {
    errors.amount = 'Amount is required and cannot be zero';
  } else if (data.amount < 0) {
    errors.amount = 'Amount cannot be negative';
  }

  // Concept validation
  if (!data.concept || data.concept.trim().length === 0) {
    errors.concept = 'Concept is required';
  } else if (data.concept.length > 255) {
    errors.concept = 'Concept cannot exceed 255 characters';
  }

  // Bank Account validation
  if (!data.bankAccount || data.bankAccount.trim().length === 0) {
    errors.bankAccount = 'Bank account is required';
  }

  // Entry Type validation
  if (!data.entryType || !['income', 'expense'].includes(data.entryType)) {
    errors.entryType = 'Please select a valid entry type';
  }

  // Date validation
  if (!data.date) {
    errors.date = 'Date is required';
  } else {
    const dateObj = new Date(data.date);
    if (isNaN(dateObj.getTime())) {
      errors.date = 'Please enter a valid date';
    }
  }

  // Area validation
  if (!data.area || data.area.trim().length === 0) {
    errors.area = 'Area is required';
  }

  // Subarea validation
  if (!data.subarea || data.subarea.trim().length === 0) {
    errors.subarea = 'Subarea is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validates contact form data
 */
export const validateContact = (data: {
  name: string;
  email?: string;
  phone?: string;
  contact_type: string;
  status: string;
  area: string;
  subarea: string;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  // Name validation
  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Name is required';
  } else if (data.name.length > 255) {
    errors.name = 'Name cannot exceed 255 characters';
  }

  // Email validation (if provided)
  if (data.email && data.email.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.email = 'Please enter a valid email address';
    }
  }

  // Phone validation (if provided)
  if (data.phone && data.phone.trim().length > 0) {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(data.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
  }

  // Contact Type validation
  const validContactTypes = ['business', 'client', 'supplier', 'partner', 'prospect', 'vendor'];
  if (!data.contact_type || !validContactTypes.includes(data.contact_type)) {
    errors.contact_type = 'Please select a valid contact type';
  }

  // Status validation
  const validStatuses = ['active', 'inactive', 'archived'];
  if (!data.status || !validStatuses.includes(data.status)) {
    errors.status = 'Please select a valid status';
  }

  // Area validation
  if (!data.area || data.area.trim().length === 0) {
    errors.area = 'Area is required';
  }

  // Subarea validation
  if (!data.subarea || data.subarea.trim().length === 0) {
    errors.subarea = 'Subarea is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validates task form data
 */
export const validateTask = (data: {
  title: string;
  description?: string;
  priority: string;
  dueDate?: string;
  area: string;
  subarea: string;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  // Title validation
  if (!data.title || data.title.trim().length === 0) {
    errors.title = 'Title is required';
  } else if (data.title.length > 255) {
    errors.title = 'Title cannot exceed 255 characters';
  }

  // Description validation (optional but has length limit)
  if (data.description && data.description.length > 1000) {
    errors.description = 'Description cannot exceed 1000 characters';
  }

  // Priority validation
  const validPriorities = ['low', 'medium', 'high'];
  if (!data.priority || !validPriorities.includes(data.priority)) {
    errors.priority = 'Please select a valid priority';
  }

  // Due Date validation (if provided)
  if (data.dueDate && data.dueDate.trim().length > 0) {
    const dateObj = new Date(data.dueDate);
    if (isNaN(dateObj.getTime())) {
      errors.dueDate = 'Please enter a valid due date';
    }
  }

  // Area validation
  if (!data.area || data.area.trim().length === 0) {
    errors.area = 'Area is required';
  }

  // Subarea validation
  if (!data.subarea || data.subarea.trim().length === 0) {
    errors.subarea = 'Subarea is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};