import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { attachmentService } from '../services/tasks';
import { Attachment } from '../types';

interface AttachmentListProps {
  taskId?: number;
  commentId?: number;
}

const AttachmentList = ({ taskId, commentId }: AttachmentListProps) => {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();

  const { data: attachments = [], isLoading, error } = useQuery({
    queryKey: taskId ? ['task-attachments', taskId] : ['comment-attachments', commentId],
    queryFn: () => {
      if (taskId) {
        return attachmentService.getTaskAttachments(taskId, token!);
      } else if (commentId) {
        return attachmentService.getCommentAttachments(commentId, token!);
      }
      throw new Error('Either taskId or commentId must be provided');
    },
    enabled: !!token && (!!taskId || !!commentId),
    refetchOnWindowFocus: false
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: number) => attachmentService.deleteAttachment(attachmentId, token!),
    onSuccess: () => {
      if (taskId) {
        queryClient.invalidateQueries({ queryKey: ['task-attachments', taskId] });
      } else if (commentId) {
        queryClient.invalidateQueries({ queryKey: ['comment-attachments', commentId] });
      }
    }
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (attachment: Attachment) => {
    if (attachment.attachmentType === 'url') {
      return (
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m0 0l1.102-1.102a4 4 0 005.656-5.656l-4-4a4 4 0 00-5.656 0l-1.102 1.102" />
        </svg>
      );
    }

    const fileType = attachment.fileType?.toLowerCase() || '';
    if (fileType.includes('image')) {
      return (
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }

    if (fileType.includes('pdf')) {
      return (
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }

    return (
      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  const getDisplayName = (attachment: Attachment) => {
    const { uploadedBy } = attachment;
    if (uploadedBy.firstName || uploadedBy.lastName) {
      return `${uploadedBy.firstName || ''} ${uploadedBy.lastName || ''}`.trim();
    }
    return uploadedBy.username;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleDelete = (attachmentId: number) => {
    if (window.confirm('Are you sure you want to delete this attachment?')) {
      deleteAttachmentMutation.mutate(attachmentId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-5 h-5 bg-gray-300 rounded"></div>
            <div className="flex-1">
              <div className="w-32 h-4 bg-gray-300 rounded mb-1"></div>
              <div className="w-24 h-3 bg-gray-300 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-3">
        <p className="text-red-800 text-sm">Error loading attachments: {error.message}</p>
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a2 2 0 00-2.828-2.828z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9L9 6l6-6 3 3-6 6z" />
        </svg>
        <p className="text-sm">No attachments yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {getFileIcon(attachment)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <a
                  href={attachment.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 truncate"
                  title={attachment.fileName}
                >
                  {attachment.attachmentType === 'url' ? 
                    (attachment.urlTitle || attachment.fileName) : 
                    attachment.fileName
                  }
                </a>
                {attachment.fileSize && (
                  <span className="text-xs text-gray-500">
                    ({formatFileSize(attachment.fileSize)})
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>by {getDisplayName(attachment)}</span>
                <span>•</span>
                <span>{formatDateTime(attachment.createdAt)}</span>
              </div>
            </div>
          </div>
          
          {user?.username === attachment.uploadedBy.username && (
            <button
              onClick={() => handleDelete(attachment.id)}
              disabled={deleteAttachmentMutation.isPending}
              className="ml-2 text-gray-400 hover:text-red-600 p-1"
              title="Delete attachment"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default AttachmentList;