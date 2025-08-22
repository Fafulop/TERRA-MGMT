import React from 'react';
import { Document } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface DocumentsTableProps {
  documents: Document[];
  onEdit: (document: Document) => void;
  onDelete: (id: number) => void;
  onViewFiles: (document: Document) => void;
  isLoading?: boolean;
}

const DocumentsTable: React.FC<DocumentsTableProps> = ({
  documents,
  onEdit,
  onDelete,
  onViewFiles,
  isLoading = false
}) => {
  const { user } = useAuth();
  const currentUserId = user?.id;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getUserInitials = (document: Document) => {
    if (document.first_name) {
      return document.first_name[0].toUpperCase();
    }
    return document.username?.[0]?.toUpperCase() || 'U';
  };

  const getUserName = (document: Document) => {
    if (document.first_name && document.last_name) {
      return `${document.first_name} ${document.last_name}`;
    }
    if (document.first_name) {
      return document.first_name;
    }
    return document.username || 'Unknown User';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDocumentIcon = (type?: string) => {
    if (!type) return '📄';
    const lowerType = type.toLowerCase();
    if (lowerType.includes('pdf')) return '📋';
    if (lowerType.includes('doc')) return '📝';
    if (lowerType.includes('xls') || lowerType.includes('sheet')) return '📊';
    if (lowerType.includes('ppt') || lowerType.includes('slide')) return '📊';
    if (lowerType.includes('image') || lowerType.includes('png') || lowerType.includes('jpg')) return '🖼️';
    return '📄';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
          <p className="mt-2 text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 text-center">
          <p className="text-gray-500">No documents found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Document
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Area & Subarea
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type & Version
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Attachments
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.map((document) => (
              <tr key={document.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
                        <span className="text-lg">
                          {getDocumentIcon(document.document_type)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {document.document_name}
                      </div>
                      {document.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {document.description}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {document.area}
                  </div>
                  <div className="text-sm text-gray-500">
                    {document.subarea}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {document.document_type || 'Unknown'}
                  </div>
                  <div className="text-sm text-gray-500">
                    v{document.version}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(document.status)}`}>
                    {document.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="text-sm text-gray-500">
                        {document.attachment_count || 0} files
                      </span>
                    </div>
                    {document.attachment_count && document.attachment_count > 0 && (
                      <button
                        onClick={() => onViewFiles(document)}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                        title="View files"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                      <span className="text-xs font-medium text-gray-600">
                        {getUserInitials(document)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-900">
                      {getUserName(document)}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(document.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {currentUserId === document.user_id ? (
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => onEdit(document)}
                        className="text-teal-600 hover:text-teal-900"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDelete(document.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">View Only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DocumentsTable;