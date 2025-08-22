import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDocuments, useCreateDocument, useUpdateDocument, useDeleteDocument, useDocumentsSummary, useDocument } from '../hooks/useDocumentsQueries';
import { Document, DocumentFormData, DocumentFilters } from '../types';
import DocumentForm from '../components/DocumentForm';
import DocumentsTable from '../components/DocumentsTable';
import DocumentFilesModal from '../components/DocumentFilesModal';

const Documentos: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [filters, setFilters] = useState<DocumentFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  const { data: documentsResponse, isLoading, error } = useDocuments({ ...filters, search: searchTerm });
  const { data: summary } = useDocumentsSummary();
  const { data: documentDetails } = useDocument(viewingDocument?.id || 0);
  const createDocumentMutation = useCreateDocument();
  const updateDocumentMutation = useUpdateDocument();
  const deleteDocumentMutation = useDeleteDocument();

  const documents = documentsResponse?.documents || [];

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleCreateDocument = async (data: DocumentFormData) => {
    try {
      await createDocumentMutation.mutateAsync(data);
      setShowForm(false);
    } catch (error) {
      console.error('Error creating document:', error);
    }
  };

  const handleUpdateDocument = async (data: DocumentFormData) => {
    if (!editingDocument) return;
    
    try {
      await updateDocumentMutation.mutateAsync({
        id: editingDocument.id,
        data
      });
      setEditingDocument(null);
      setShowForm(false);
    } catch (error) {
      console.error('Error updating document:', error);
    }
  };

  const handleDeleteDocument = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteDocumentMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
  };

  const handleEditDocument = (document: Document) => {
    setEditingDocument(document);
    setShowForm(true);
  };

  const handleViewFiles = (document: Document) => {
    setViewingDocument(document);
  };

  const handleCloseFilesModal = () => {
    setViewingDocument(null);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingDocument(null);
  };

  const handleFilterChange = (field: keyof DocumentFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value || undefined
    }));
  };

  const isFormLoading = createDocumentMutation.isPending || updateDocumentMutation.isPending;

  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/')}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </button>
                <h1 className="text-3xl font-bold text-gray-900">Documentos Management</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Welcome, {user.username}!</span>
                <button
                  onClick={logout}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <DocumentForm
              onSubmit={editingDocument ? handleUpdateDocument : handleCreateDocument}
              onCancel={handleCancelForm}
              initialData={editingDocument || undefined}
              isLoading={isFormLoading}
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Documentos Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.username}!</span>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          
          {/* Header with Summary Cards */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Documentos</h2>
                <p className="text-gray-600">Manage and organize your business documents</p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Upload Document
              </button>
            </div>

            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{summary.total_documents}</div>
                  <div className="text-sm text-blue-600">Total Documents</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{summary.active_documents}</div>
                  <div className="text-sm text-green-600">Active</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{summary.draft_documents}</div>
                  <div className="text-sm text-yellow-600">Drafts</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{summary.total_areas}</div>
                  <div className="text-sm text-purple-600">Areas</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{summary.total_subareas}</div>
                  <div className="text-sm text-orange-600">Subareas</div>
                </div>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search documents..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area
                </label>
                <input
                  type="text"
                  value={filters.area || ''}
                  onChange={(e) => handleFilterChange('area', e.target.value)}
                  placeholder="Filter by area..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subarea
                </label>
                <input
                  type="text"
                  value={filters.subarea || ''}
                  onChange={(e) => handleFilterChange('subarea', e.target.value)}
                  placeholder="Filter by subarea..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Type
                </label>
                <input
                  type="text"
                  value={filters.document_type || ''}
                  onChange={(e) => handleFilterChange('document_type', e.target.value)}
                  placeholder="Filter by type..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Documents Table */}
          {error ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center py-4">
                <p className="text-red-600">Error loading documents: {error.message}</p>
              </div>
            </div>
          ) : (
            <DocumentsTable
              documents={documents}
              onEdit={handleEditDocument}
              onDelete={handleDeleteDocument}
              onViewFiles={handleViewFiles}
              isLoading={isLoading}
            />
          )}

        </div>
      </main>

      {/* File Viewer Modal */}
      {viewingDocument && (
        <DocumentFilesModal
          document={documentDetails || viewingDocument}
          onClose={handleCloseFilesModal}
        />
      )}
    </div>
  );
};

export default Documentos;