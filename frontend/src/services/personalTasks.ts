export interface PersonalTaskFormData {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  area: string;
  subarea: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface PersonalTask {
  id: number;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  area: string;
  subarea: string;
  status: 'pending' | 'in_progress' | 'completed';
  userId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalTasksStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  highPriority: number;
  overdue: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const personalTasksService = {
  // Get all personal tasks for the current user
  getPersonalTasks: async (token: string): Promise<PersonalTask[]> => {
    const response = await fetch(`${API_BASE_URL}/personal-tasks`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch personal tasks');
    }

    const result = await response.json();
    return result.tasks;
  },

  // Get a specific personal task by ID
  getPersonalTaskById: async (taskId: number, token: string): Promise<PersonalTask> => {
    const response = await fetch(`${API_BASE_URL}/personal-tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch personal task');
    }

    const result = await response.json();
    return result.task;
  },

  // Create a new personal task
  createPersonalTask: async (taskData: PersonalTaskFormData, token: string): Promise<PersonalTask> => {
    const response = await fetch(`${API_BASE_URL}/personal-tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create personal task');
    }

    const result = await response.json();
    return result.task;
  },

  // Update an existing personal task
  updatePersonalTask: async (taskId: number, taskData: Partial<PersonalTaskFormData>, token: string): Promise<PersonalTask> => {
    const response = await fetch(`${API_BASE_URL}/personal-tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update personal task');
    }

    const result = await response.json();
    return result.task;
  },

  // Delete a personal task
  deletePersonalTask: async (taskId: number, token: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/personal-tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete personal task');
    }
  },

  // Get personal tasks statistics
  getPersonalTasksStats: async (token: string): Promise<PersonalTasksStats> => {
    const response = await fetch(`${API_BASE_URL}/personal-tasks/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch personal tasks statistics');
    }

    const result = await response.json();
    return result.stats;
  },
};