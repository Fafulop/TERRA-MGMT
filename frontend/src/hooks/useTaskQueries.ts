import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { taskService, commentService, attachmentService } from '../services/tasks';
import { Comment, Attachment } from '../types';

// Custom hook for prefetching task details
export const useTaskPrefetching = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const prefetchTaskDetail = (taskId: number) => {
    if (!token) return;

    // Prefetch task details
    queryClient.prefetchQuery({
      queryKey: ['task', taskId],
      queryFn: () => taskService.getTaskById(taskId, token),
      staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Prefetch related data
    queryClient.prefetchQuery({
      queryKey: ['task-comments', taskId],
      queryFn: () => commentService.getTaskComments(taskId, token),
      staleTime: 1000 * 60 * 2, // 2 minutes
    });

    queryClient.prefetchQuery({
      queryKey: ['task-attachments', taskId],
      queryFn: () => attachmentService.getTaskAttachments(taskId, token),
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  const prefetchTaskList = () => {
    if (!token) return;

    queryClient.prefetchQuery({
      queryKey: ['tasks'],
      queryFn: () => taskService.getTasks(token),
      staleTime: 1000 * 60 * 3, // 3 minutes
    });
  };

  return {
    prefetchTaskDetail,
    prefetchTaskList
  };
};

// Enhanced task detail hook that fetches all related data
export const useTaskWithRelatedData = (taskId: number) => {
  const { token } = useAuth();

  return useQueries({
    queries: [
      {
        queryKey: ['task', taskId],
        queryFn: () => taskService.getTaskById(taskId, token!),
        enabled: !!token && !!taskId,
        staleTime: 1000 * 60 * 5,
        retry: 2,
      },
      {
        queryKey: ['task-comments', taskId],
        queryFn: () => commentService.getTaskComments(taskId, token!),
        enabled: !!token && !!taskId,
        staleTime: 1000 * 60 * 2,
        retry: 2,
      },
      {
        queryKey: ['task-attachments', taskId],
        queryFn: () => attachmentService.getTaskAttachments(taskId, token!),
        enabled: !!token && !!taskId,
        staleTime: 1000 * 60 * 5,
        retry: 2,
      }
    ]
  });
};

// Optimized single task hook for simpler use cases
export const useTaskOptimized = (taskId: number) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['task', taskId],
    queryFn: () => taskService.getTaskById(taskId, token!),
    enabled: !!token && !!taskId && taskId > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Optimized tasks list hook with background updates
export const useTasksOptimized = () => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['tasks'],
    queryFn: () => taskService.getTasks(token!),
    enabled: !!token,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 60 * 5, // Background refresh every 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Hook for optimized comment queries with automatic dependencies
export const useCommentsOptimized = (taskId: number) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: () => commentService.getTaskComments(taskId, token!),
    enabled: !!token && !!taskId,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    retry: 2,
    // Automatically refetch when task is updated
    select: (data: Comment[]) => {
      // Sort comments by creation date for consistent display
      return data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
  });
};

// Hook for optimized attachment queries
export const useAttachmentsOptimized = (taskId?: number, commentId?: number) => {
  const { token } = useAuth();
  const queryKey = taskId ? ['task-attachments', taskId] : ['comment-attachments', commentId];

  return useQuery({
    queryKey,
    queryFn: () => {
      if (taskId) {
        return attachmentService.getTaskAttachments(taskId, token!);
      } else if (commentId) {
        return attachmentService.getCommentAttachments(commentId, token!);
      }
      return Promise.resolve([]);
    },
    enabled: !!token && (!!taskId || !!commentId),
    staleTime: 1000 * 60 * 5,
    retry: 2,
    select: (data: Attachment[]) => {
      // Group attachments by type for better display
      return data.reduce((acc, attachment) => {
        if (!acc[attachment.attachmentType]) {
          acc[attachment.attachmentType] = [];
        }
        acc[attachment.attachmentType].push(attachment);
        return acc;
      }, {} as Record<'file' | 'url', Attachment[]>);
    }
  });
};