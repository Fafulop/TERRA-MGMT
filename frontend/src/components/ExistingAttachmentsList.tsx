import React from 'react';
import { LedgerAttachment } from '../types';
import { useDeleteAttachment } from '../hooks/useAttachmentQueries';

interface ExistingAttachmentsListProps {
  attachments: LedgerAttachment[];
  entryId: number;
}

const ExistingAttachmentsList: React.FC<ExistingAttachmentsListProps> = ({
  attachments,
  entryId,
}) => {
  const deleteAttachmentMutation = useDeleteAttachment();

  const handleDelete = (attachmentId: number, fileName: string) => {
    if (window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      deleteAttachmentMutation.mutate({ attachmentId, entryId });
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(2)} KB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (attachments.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a2 2 0 00-2.828-2.828z" />
        </svg>
        <p className="text-gray-500 font-medium">No file attachments yet</p>
        <p className="text-sm text-gray-400 mt-1">Add files using the form below</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {/* File Icon */}
              <div className="flex-shrink-0">
                <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {attachment.fileName}
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  {formatFileSize(attachment.fileSize)}
                </p>
                {attachment.uploadedBy && (
                  <p className="text-xs text-gray-400 mt-1">
                    Uploaded by{' '}
                    <span className="font-medium">
                      {attachment.uploadedBy.firstName && attachment.uploadedBy.lastName
                        ? `${attachment.uploadedBy.firstName} ${attachment.uploadedBy.lastName}`
                        : attachment.uploadedBy.username}
                    </span>
                    {' '}on {formatDate(attachment.createdAt)}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 ml-4">
              <a
                href={attachment.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
              >
                View
              </a>
              <button
                onClick={() => handleDelete(attachment.id, attachment.fileName)}
                disabled={deleteAttachmentMutation.isPending}
                className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteAttachmentMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExistingAttachmentsList;
