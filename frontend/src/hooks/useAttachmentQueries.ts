import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ledgerAttachmentsService, AttachmentFormData } from '../services/ledgerAttachments';
import { LedgerAttachment } from '../types';

// Query keys for consistent cache management
export const attachmentKeys = {
  all: ['attachments'] as const,
  forEntry: (entryId: number) => [...attachmentKeys.all, 'entry', entryId] as const,
};

// Hook to get all attachments for a specific ledger entry
export const useAttachments = (entryId: number) => {
  return useQuery({
    queryKey: attachmentKeys.forEntry(entryId),
    queryFn: () => ledgerAttachmentsService.getAttachments(entryId),
    enabled: !!entryId && entryId > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
};

// Hook to create a new attachment (post-creation)
export const useCreateAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId, data }: { entryId: number; data: AttachmentFormData }) =>
      ledgerAttachmentsService.createAttachment(entryId, data),
    onSuccess: (newAttachment, { entryId }) => {
      // Invalidate attachments for this entry
      queryClient.invalidateQueries({ queryKey: attachmentKeys.forEntry(entryId) });

      // Invalidate ledger entries to update attachment count
      queryClient.invalidateQueries({ queryKey: ['ledgerMxn', 'entries'] });
    },
    onError: (error) => {
      console.error('Error creating attachment:', error);
    },
  });
};

// Hook to delete an attachment
export const useDeleteAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ attachmentId, entryId }: { attachmentId: number; entryId: number }) =>
      ledgerAttachmentsService.deleteAttachment(attachmentId),
    onSuccess: (_, { entryId }) => {
      // Invalidate attachments for this entry
      queryClient.invalidateQueries({ queryKey: attachmentKeys.forEntry(entryId) });

      // Invalidate ledger entries to update attachment count
      queryClient.invalidateQueries({ queryKey: ['ledgerMxn', 'entries'] });
    },
    onError: (error) => {
      console.error('Error deleting attachment:', error);
    },
  });
};

// Hook for prefetching attachments
export const useAttachmentPrefetching = () => {
  const queryClient = useQueryClient();

  const prefetchAttachments = (entryId: number) => {
    queryClient.prefetchQuery({
      queryKey: attachmentKeys.forEntry(entryId),
      queryFn: () => ledgerAttachmentsService.getAttachments(entryId),
      staleTime: 1000 * 60 * 5,
    });
  };

  return {
    prefetchAttachments,
  };
};
