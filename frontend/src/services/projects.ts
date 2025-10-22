import axios from 'axios';
import type {
  Project,
  ProjectTask,
  ProjectFormData,
  AddTaskToProjectData,
  UpdateProjectTaskData,
  ProjectFilters
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with auth interceptor
const createApiClient = () => {
  const client = axios.create({
    baseURL: `${API_BASE_URL}/projects`,
  });

  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return client;
};

export const projectService = {
  // Get all projects
  getProjects: async (filters?: ProjectFilters): Promise<Project[]> => {
    const client = createApiClient();
    const response = await client.get('/', { params: filters });
    return response.data;
  },

  // Get single project by ID
  getProject: async (id: number): Promise<Project & { tasks: ProjectTask[] }> => {
    const client = createApiClient();
    const response = await client.get(`/${id}`);
    return response.data;
  },

  // Create project
  createProject: async (data: ProjectFormData): Promise<Project> => {
    const client = createApiClient();
    const response = await client.post('/', data);
    return response.data;
  },

  // Update project
  updateProject: async (id: number, data: Partial<ProjectFormData>): Promise<Project> => {
    const client = createApiClient();
    const response = await client.put(`/${id}`, data);
    return response.data;
  },

  // Delete project
  deleteProject: async (id: number): Promise<void> => {
    const client = createApiClient();
    await client.delete(`/${id}`);
  },

  // Get tasks in project
  getProjectTasks: async (projectId: number): Promise<ProjectTask[]> => {
    const client = createApiClient();
    const response = await client.get(`/${projectId}/tasks`);
    return response.data;
  },

  // Add task to project
  addTaskToProject: async (projectId: number, data: AddTaskToProjectData): Promise<ProjectTask> => {
    const client = createApiClient();
    const response = await client.post(`/${projectId}/tasks`, data);
    return response.data;
  },

  // Update project task (dates, status, order)
  updateProjectTask: async (
    projectId: number,
    taskId: number,
    data: UpdateProjectTaskData
  ): Promise<ProjectTask> => {
    const client = createApiClient();
    const response = await client.put(`/${projectId}/tasks/${taskId}`, data);
    return response.data;
  },

  // Remove task from project
  removeTaskFromProject: async (projectId: number, taskId: number): Promise<void> => {
    const client = createApiClient();
    await client.delete(`/${projectId}/tasks/${taskId}`);
  },
};
