import { Task, TaskFormData, Comment, CommentFormData } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const taskService = {
  // Create a new task
  createTask: async (taskData: TaskFormData, token: string): Promise<Task> => {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(taskData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create task');
    }

    const result = await response.json();
    return result.task;
  },

  // Get all tasks
  getTasks: async (token: string): Promise<Task[]> => {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch tasks');
    }

    const result = await response.json();
    return result.tasks;
  },

  // Get a specific task by ID
  getTaskById: async (taskId: number, token: string): Promise<Task> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch task');
    }

    const result = await response.json();
    return result.task;
  },

  // Update a task
  updateTask: async (taskId: number, taskData: Partial<TaskFormData & { status: string }>, token: string): Promise<Task> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(taskData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update task');
    }

    const result = await response.json();
    return result.task;
  },

  // Delete a task
  deleteTask: async (taskId: number, token: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete task');
    }
  }
};

export const commentService = {
  // Get all comments for a task
  getTaskComments: async (taskId: number, token: string): Promise<Comment[]> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/comments`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch comments');
    }

    const result = await response.json();
    return result.comments;
  },

  // Create a new comment for a task
  createTaskComment: async (taskId: number, commentData: CommentFormData, token: string): Promise<Comment> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(commentData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create comment');
    }

    const result = await response.json();
    return result.comment;
  },

  // Update a comment
  updateTaskComment: async (taskId: number, commentId: number, commentData: CommentFormData, token: string): Promise<Comment> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/comments/${commentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(commentData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update comment');
    }

    const result = await response.json();
    return result.comment;
  },

  // Delete a comment
  deleteTaskComment: async (taskId: number, commentId: number, token: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete comment');
    }
  }
};