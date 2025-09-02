import { Task } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface GanttChartData {
  tasks: Task[];
  dependencies: TaskDependency[];
}

export interface TaskDependency {
  id: number;
  taskId: number;
  dependsOnTaskId: number;
  dependencyType: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
  createdAt: string;
  updatedAt: string;
}

/**
 * Gantt Chart Service
 * Handles API calls for global project management operations
 */
export const ganttService = {
  // Get all tasks with timeline data for Gantt chart (global view)
  async getGanttTasks(token: string): Promise<Task[]> {
    const response = await fetch(`${API_BASE_URL}/gantt/tasks`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Gantt tasks: ${response.statusText}`);
    }

    const data = await response.json();
    return data.tasks;
  },

  // Update task timeline (start/end dates) - any user can update any task
  async updateTaskTimeline(taskId: number, startDate?: string, endDate?: string, token?: string): Promise<any> {
    if (!token) {
      throw new Error('No authentication token provided');
    }

    const response = await fetch(`${API_BASE_URL}/gantt/tasks/${taskId}/timeline`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ startDate, endDate }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to update task timeline: ${response.statusText}`);
    }

    return response.json();
  },

  // Create a task dependency
  async createTaskDependency(
    taskId: number, 
    dependsOnTaskId: number, 
    dependencyType: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish' = 'finish_to_start',
    token?: string
  ): Promise<TaskDependency> {
    if (!token) {
      throw new Error('No authentication token provided');
    }

    const response = await fetch(`${API_BASE_URL}/gantt/dependencies`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ taskId, dependsOnTaskId, dependencyType }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to create task dependency: ${response.statusText}`);
    }

    const data = await response.json();
    return data.dependency;
  },

  // Delete a task dependency
  async deleteTaskDependency(dependencyId: number, token?: string): Promise<void> {
    if (!token) {
      throw new Error('No authentication token provided');
    }

    const response = await fetch(`${API_BASE_URL}/gantt/dependencies/${dependencyId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to delete task dependency: ${response.statusText}`);
    }
  }
};