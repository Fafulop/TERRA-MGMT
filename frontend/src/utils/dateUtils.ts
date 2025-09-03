// Date utility functions for Gantt chart
export const calculateDuration = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};

export const getDaysInRange = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = [];
  
  let current = new Date(start);
  
  while (current <= end) {
    days.push({
      date: new Date(current),
      label: current.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
    });
    
    current = new Date(current);
    current.setDate(current.getDate() + 1);
  }
  
  return days;
};

export const validateSubtaskDates = (
  startDate: string,
  endDate: string,
  parentStartDate?: string,
  parentEndDate?: string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      errors.push('Start date cannot be after end date');
    }
    
    if (parentStartDate && parentEndDate) {
      const parentStart = new Date(parentStartDate);
      const parentEnd = new Date(parentEndDate);
      
      if (start < parentStart) {
        errors.push('Subtask start date cannot be before parent task start date');
      }
      
      if (end > parentEnd) {
        errors.push('Subtask end date cannot be after parent task end date');
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const formatDateForInput = (dateString: string): string => {
  return new Date(dateString).toISOString().split('T')[0];
};

export const formatDateForDisplay = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};