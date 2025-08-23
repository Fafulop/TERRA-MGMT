/**
 * Utility functions for common formatting operations
 * Reduces code duplication across components
 */

/**
 * Formats currency values consistently across the application
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  const currencyConfig = {
    USD: { currency: 'USD', locale: 'en-US' },
    MXN: { currency: 'MXN', locale: 'es-MX' }
  };

  const config = currencyConfig[currency as keyof typeof currencyConfig] || currencyConfig.USD;

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency
  }).format(amount);
};

/**
 * Formats date values consistently across the application
 */
export const formatDate = (dateString: string, options?: Intl.DateTimeFormatOptions): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  const formatOptions = { ...defaultOptions, ...options };

  return new Date(dateString).toLocaleDateString('en-US', formatOptions);
};

/**
 * Formats date and time together
 */
export const formatDateTime = (dateString: string): string => {
  return formatDate(dateString, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formats file sizes in human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Formats user display name consistently
 */
export const formatUserName = (user: {
  firstName?: string | null;
  lastName?: string | null;
  username?: string;
}): string => {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  
  if (user.firstName) {
    return user.firstName;
  }
  
  if (user.username) {
    return user.username;
  }
  
  return 'Unknown User';
};

/**
 * Formats user initials for avatars
 */
export const getUserInitials = (user: {
  firstName?: string | null;
  lastName?: string | null;
  username?: string;
}): string => {
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  
  if (user.firstName) {
    return user.firstName[0].toUpperCase();
  }
  
  if (user.username) {
    return user.username[0].toUpperCase();
  }
  
  return 'U';
};

/**
 * Truncates text to specified length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Capitalizes the first letter of a string
 */
export const capitalize = (str: string): string => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Formats entry type for display
 */
export const formatEntryType = (entryType: string): string => {
  return entryType === 'income' ? 'Income' : 'Expense';
};

/**
 * Gets CSS classes for entry type styling
 */
export const getEntryTypeClasses = (entryType: string): string => {
  return entryType === 'income' 
    ? 'bg-green-100 text-green-800'
    : 'bg-red-100 text-red-800';
};

/**
 * Gets CSS classes for priority styling
 */
export const getPriorityClasses = (priority: string): string => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Gets CSS classes for status styling
 */
export const getStatusClasses = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'inactive':
      return 'bg-gray-100 text-gray-800';
    case 'archived':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};