import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { ganttService } from '../services/gantt';
import { subtaskService } from '../services/subtasks';
import { Subtask } from '../types';

export const useGanttData = (expandedTasks: Set<number>) => {
  const { user, token } = useAuth();

  // Get all tasks for Gantt (global view)
  const { data: tasks, isLoading: tasksLoading, error: tasksError } = useQuery({
    queryKey: ['gantt-tasks'],
    queryFn: () => ganttService.getGanttTasks(token!),
    enabled: !!token && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get subtask counts for all tasks (so we know which ones to show expand buttons for)
  const { data: subtaskCounts } = useQuery({
    queryKey: ['subtask-counts'],
    queryFn: async () => {
      if (!tasks || tasks.length === 0) return {};
      
      const taskIds = tasks.map(task => task.id);
      try {
        // Try to get counts from batch endpoint
        const result = await subtaskService.getBatchSubtasks(taskIds, token!);
        const counts: Record<number, number> = {};
        for (const [taskId, subtasks] of Object.entries(result)) {
          counts[parseInt(taskId)] = subtasks.length;
        }
        return counts;
      } catch (error) {
        console.error('Failed to get subtask counts:', error);
        return {};
      }
    },
    enabled: !!token && !!tasks && tasks.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get subtasks for all expanded tasks - Using batch fetching to fix N+1 problem
  const expandedTasksArray = Array.from(expandedTasks);
  const { data: allSubtasks, isLoading: subtasksLoading } = useQuery({
    queryKey: ['subtasks', expandedTasksArray],
    queryFn: async () => {
      if (expandedTasksArray.length === 0) return {};
      
      try {
        // Use batch API to fetch all subtasks in one request instead of N individual requests
        return await subtaskService.getBatchSubtasks(expandedTasksArray, token!);
      } catch (error) {
        console.error('Batch subtasks failed, falling back to individual requests:', error);
        // Fallback to individual requests if batch fails
        const subtaskPromises = expandedTasksArray.map(taskId => 
          subtaskService.getSubtasksByTaskId(taskId, token!)
        );
        const results = await Promise.all(subtaskPromises);
        
        // Create a map of taskId -> subtasks
        const subtaskMap: Record<number, Subtask[]> = {};
        expandedTasksArray.forEach((taskId, index) => {
          subtaskMap[taskId] = results[index];
        });
        return subtaskMap;
      }
    },
    enabled: !!token && expandedTasksArray.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Get reference data for subtask dropdowns
  const { data: referenceData } = useQuery({
    queryKey: ['task-subtask-references'],
    queryFn: () => subtaskService.getTasksAndSubtasksForReference(token!),
    enabled: !!token,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    tasks: tasks || [],
    allSubtasks: allSubtasks || {},
    subtaskCounts: subtaskCounts || {},
    referenceData: referenceData || [],
    tasksLoading,
    subtasksLoading,
    tasksError,
  };
};