import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../services/projects';
import type {
  Project,
  ProjectTask,
  ProjectFormData,
  AddTaskToProjectData,
  UpdateProjectTaskData,
  ProjectFilters
} from '../types';

// Query keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters?: ProjectFilters) => [...projectKeys.lists(), { filters }] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: number) => [...projectKeys.details(), id] as const,
  tasks: (projectId: number) => [...projectKeys.detail(projectId), 'tasks'] as const,
};

// Fetch all projects
export const useProjects = (filters?: ProjectFilters) => {
  return useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: () => projectService.getProjects(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Fetch single project
export const useProject = (id: number) => {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectService.getProject(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Fetch project tasks
export const useProjectTasks = (projectId: number) => {
  return useQuery({
    queryKey: projectKeys.tasks(projectId),
    queryFn: () => projectService.getProjectTasks(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Create project mutation
export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProjectFormData) => projectService.createProject(data),
    onSuccess: () => {
      // Invalidate and refetch projects list
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
};

// Update project mutation
export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProjectFormData> }) =>
      projectService.updateProject(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific project and lists
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
};

// Delete project mutation
export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => projectService.deleteProject(id),
    onSuccess: () => {
      // Invalidate projects list
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
};

// Add task to project mutation
export const useAddTaskToProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: number; data: AddTaskToProjectData }) =>
      projectService.addTaskToProject(projectId, data),
    onSuccess: (_, variables) => {
      // Invalidate project details and tasks
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.tasks(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      // Also invalidate tasks list since we might have created a new task
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

// Update project task mutation
export const useUpdateProjectTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      taskId,
      data,
    }: {
      projectId: number;
      taskId: number;
      data: UpdateProjectTaskData;
    }) => projectService.updateProjectTask(projectId, taskId, data),
    onSuccess: (_, variables) => {
      // Invalidate project details and tasks
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.tasks(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      // Also invalidate tasks list since status might have changed
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

// Remove task from project mutation
export const useRemoveTaskFromProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, taskId }: { projectId: number; taskId: number }) =>
      projectService.removeTaskFromProject(projectId, taskId),
    onSuccess: (_, variables) => {
      // Invalidate project details and tasks
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.tasks(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
};
