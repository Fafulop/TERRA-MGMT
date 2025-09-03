import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { ganttService } from '../services/gantt';
import { subtaskService } from '../services/subtasks';

export const useGanttMutations = (onSuccess?: { resetTaskForm?: () => void; resetSubtaskForm?: () => void }) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  // Update task timeline mutation (Gantt-specific)
  const updateTaskDatesMutation = useMutation({
    mutationFn: ({ taskId, startDate, endDate }: { taskId: number; startDate: string | null; endDate: string | null }) =>
      ganttService.updateTaskTimeline(taskId, startDate, endDate, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gantt-tasks'] });
      onSuccess?.resetTaskForm?.();
    },
    onError: (error: any) => {
      console.error('Error updating task timeline:', error);
      alert('Failed to update task timeline. Please try again.');
    }
  });

  // Create subtask mutation
  const createSubtaskMutation = useMutation({
    mutationFn: ({ taskId, subtaskData }: { taskId: number; subtaskData: any }) =>
      subtaskService.createSubtask(taskId, subtaskData, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks'] });
      queryClient.invalidateQueries({ queryKey: ['subtask-counts'] });
      onSuccess?.resetSubtaskForm?.();
    },
    onError: (error: any) => {
      console.error('Error creating subtask:', error);
      alert(error.message || 'Failed to create subtask. Please try again.');
    }
  });

  // Update subtask status mutation
  const updateSubtaskStatusMutation = useMutation({
    mutationFn: ({ subtaskId, status, currentSubtask }: { 
      subtaskId: number; 
      status: 'pending' | 'completed'; 
      currentSubtask: {
        name: string;
        description: string;
        assignee: string;
        referenceType: string;
        referenceId?: number;
        referenceName: string;
        startDate: string;
        endDate: string;
      }
    }) =>
      subtaskService.updateSubtask(subtaskId, { 
        ...currentSubtask, 
        status 
      }, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks'] });
      queryClient.invalidateQueries({ queryKey: ['subtask-counts'] });
    },
    onError: (error: any) => {
      console.error('Error updating subtask status:', error);
      alert('Failed to update subtask status. Please try again.');
    }
  });

  // Delete subtask mutation
  const deleteSubtaskMutation = useMutation({
    mutationFn: (subtaskId: number) => subtaskService.deleteSubtask(subtaskId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks'] });
      queryClient.invalidateQueries({ queryKey: ['subtask-counts'] });
    },
    onError: (error: any) => {
      console.error('Error deleting subtask:', error);
      alert('Failed to delete subtask. Please try again.');
    }
  });

  return {
    updateTaskDatesMutation,
    createSubtaskMutation,
    updateSubtaskStatusMutation,
    deleteSubtaskMutation,
  };
};