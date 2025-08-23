/**
 * Utility functions for consistent error handling across controllers
 */

export interface ErrorResponse {
  status: number;
  message: string;
  code?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Handles common database errors and returns appropriate HTTP responses
 */
export const handleDatabaseError = (error: any): ErrorResponse => {
  // PostgreSQL unique constraint violation
  if (error.code === '23505') {
    return {
      status: 409,
      message: 'Resource already exists',
      code: 'DUPLICATE_ENTRY'
    };
  }

  // PostgreSQL foreign key constraint violation
  if (error.code === '23503') {
    return {
      status: 400,
      message: 'Invalid reference to related resource',
      code: 'FOREIGN_KEY_VIOLATION'
    };
  }

  // PostgreSQL not null constraint violation
  if (error.code === '23502') {
    return {
      status: 400,
      message: 'Required field is missing',
      code: 'MISSING_REQUIRED_FIELD'
    };
  }

  // PostgreSQL check constraint violation
  if (error.code === '23514') {
    return {
      status: 400,
      message: 'Invalid data provided',
      code: 'INVALID_DATA'
    };
  }

  // Default to internal server error
  console.error('Unhandled database error:', error);
  return {
    status: 500,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR'
  };
};

/**
 * Handles authentication errors
 */
export const handleAuthError = (message: string = 'Authentication required'): ErrorResponse => {
  return {
    status: 401,
    message,
    code: 'AUTH_REQUIRED'
  };
};

/**
 * Handles validation errors
 */
export const handleValidationError = (errors: ValidationError[]): ErrorResponse => {
  const message = errors.map(err => `${err.field}: ${err.message}`).join(', ');
  return {
    status: 400,
    message: `Validation error: ${message}`,
    code: 'VALIDATION_ERROR'
  };
};

/**
 * Handles not found errors
 */
export const handleNotFoundError = (resource: string = 'Resource'): ErrorResponse => {
  return {
    status: 404,
    message: `${resource} not found`,
    code: 'NOT_FOUND'
  };
};

/**
 * Sends standardized error response
 */
export const sendErrorResponse = (res: any, error: ErrorResponse) => {
  res.status(error.status).json({
    error: error.message,
    code: error.code,
    timestamp: new Date().toISOString()
  });
};