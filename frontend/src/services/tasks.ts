import { Task, TaskFormData, Comment, CommentFormData, Attachment, AttachmentFormData } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Standalone function for compatibility with React Query
export const getTasks = async (): Promise<Task[]> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

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
};

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

export const attachmentService = {
  // Get all attachments for a task
  getTaskAttachments: async (taskId: number, token: string): Promise<Attachment[]> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/attachments`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch task attachments');
    }

    const result = await response.json();
    return result.attachments;
  },

  // Get all attachments for a comment
  getCommentAttachments: async (commentId: number, token: string): Promise<Attachment[]> => {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}/attachments`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch comment attachments');
    }

    const result = await response.json();
    return result.attachments;
  },

  // Create a new attachment for a task
  createTaskAttachment: async (taskId: number, attachmentData: AttachmentFormData, token: string): Promise<Attachment> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/attachments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(attachmentData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create task attachment');
    }

    const result = await response.json();
    return result.attachment;
  },

  // Create a new attachment for a comment
  createCommentAttachment: async (commentId: number, attachmentData: AttachmentFormData, token: string): Promise<Attachment> => {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}/attachments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(attachmentData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create comment attachment');
    }

    const result = await response.json();
    return result.attachment;
  },

  // Delete an attachment
  deleteAttachment: async (attachmentId: number, token: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/attachments/${attachmentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete attachment');
    }
  }
};