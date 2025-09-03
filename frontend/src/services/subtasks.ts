import { Subtask, SubtaskFormData } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Subtask Service
 * Handles API calls for subtask management within Gantt chart tasks
 */
export const subtaskService = {
  // Get all subtasks for a specific task
  async getSubtasksByTaskId(taskId: number, token: string): Promise<Subtask[]> {
    const response = await fetch(`${API_BASE_URL}/subtasks/task/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch subtasks: ${response.statusText}`);
    }

    const data = await response.json();
    return data.subtasks;
  },

  // Create a new subtask
  async createSubtask(taskId: number, subtaskData: SubtaskFormData, token: string): Promise<Subtask> {
    const response = await fetch(`${API_BASE_URL}/subtasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taskId,
        ...subtaskData,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to create subtask: ${response.statusText}`);
    }

    const data = await response.json();
    return data.subtask;
  },

  // Update an existing subtask
  async updateSubtask(subtaskId: number, subtaskData: SubtaskFormData, token: string): Promise<Subtask> {
    console.log(`Updating subtask ${subtaskId} with data:`, subtaskData);
    console.log('Using token:', token ? 'Token exists' : 'No token');
    
    const response = await fetch(`${API_BASE_URL}/subtasks/${subtaskId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subtaskData),
    });

    console.log('Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Update subtask error:', errorData);
      throw new Error(errorData.error || `Failed to update subtask: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Update subtask response:', data);
    return data.subtask;
  },

  // Delete a subtask
  async deleteSubtask(subtaskId: number, token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/subtasks/${subtaskId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to delete subtask: ${response.statusText}`);
    }
  }
};