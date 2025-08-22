import React from 'react';
import { Document, DocumentAttachment } from '../types';

interface DocumentFilesModalProps {
  document: Document | null;
  onClose: () => void;
}

const DocumentFilesModal: React.FC<DocumentFilesModalProps> = ({ document, onClose }) => {
  if (!document) return null;

  const handleDownloadFile = (attachment: DocumentAttachment) => {
    // In a real application, this would handle secure file download
    // For now, we'll open the file URL in a new tab
    window.open(attachment.fileUrl, '_blank');
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return '📄';
    const lowerType = fileType.toLowerCase();
    if (lowerType.includes('pdf')) return '📋';
    if (lowerType.includes('doc')) return '📝';
    if (lowerType.includes('xls') || lowerType.includes('sheet')) return '📊';
    if (lowerType.includes('ppt') || lowerType.includes('slide')) return '📊';
    if (lowerType.includes('image') || lowerType.includes('png') || lowerType.includes('jpg')) return '🖼️';
    return '📄';
  };

  const formatFileSize = (size?: number) => {
    if (!size) return 'Unknown size';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    return `${Math.round(size / (1024 * 1024))} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Document Files: {document.document_name}
            </h3>
            <p className="text-sm text-gray-600">
              {document.area} → {document.subarea}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Files List */}
        <div className="space-y-3">
          {document.attachments && document.attachments.length > 0 ? (
            document.attachments.map((attachment) => (
              <div key={attachment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {getFileIcon(attachment.fileType)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {attachment.fileName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatFileSize(attachment.fileSize)} • Uploaded on {formatDate(attachment.createdAt)}
                      </div>
                      {attachment.uploadedBy && (
                        <div className="text-xs text-gray-400">
                          by {attachment.uploadedBy.username}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDownloadFile(attachment)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      title="Download/View file"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Open
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No files</h3>
              <p className="mt-1 text-sm text-gray-500">This document has no attached files.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentFilesModal;