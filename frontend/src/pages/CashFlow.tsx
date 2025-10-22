import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LedgerEntryForm from '../components/LedgerEntryForm';
import LedgerTable from '../components/LedgerTable';
import AttachmentManagerModal from '../components/AttachmentManagerModal';
import { LedgerEntryFormData, LedgerFilters } from '../types';
import { useLedgerMxnEntries, useCreateLedgerMxnEntry, useDeleteLedgerMxnEntry, useMarkLedgerMxnAsRealized } from '../hooks/useLedgerMxnQueries';

const CashFlow = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [filters] = useState<LedgerFilters>({});
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [selectedEntryInternalId, setSelectedEntryInternalId] = useState<string>('');

  // MXN React Query hooks
  const { data: ledgerData, isLoading, error, refetch } = useLedgerMxnEntries(filters);
  const createEntryMutation = useCreateLedgerMxnEntry();
  const deleteEntryMutation = useDeleteLedgerMxnEntry();
  const markAsRealizedMutation = useMarkLedgerMxnAsRealized();

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSubmitEntry = async (formData: LedgerEntryFormData) => {
    try {
      await createEntryMutation.mutateAsync(formData);
      setShowEntryForm(false);
    } catch (error) {
      console.error('Error creating MXN ledger entry:', error);
      // Error handling is done in the mutation hook
    }
  };

  const handleEditEntry = async (entry: any) => {
    // TODO: Implement edit modal/form
    console.log('Edit entry:', entry);
  };

  const handleDeleteEntry = async (entryId: number) => {
    try {
      await deleteEntryMutation.mutateAsync(entryId);
    } catch (error) {
      console.error('Error deleting MXN ledger entry:', error);
      // Error handling is done in the mutation hook
    }
  };

  const handleMarkAsRealized = async (entryId: number) => {
    try {
      await markAsRealizedMutation.mutateAsync(entryId);
    } catch (error) {
      console.error('Error marking MXN ledger entry as realized:', error);
      // Error handling is done in the mutation hook
    }
  };

  const handleViewAttachments = async (entryId: number) => {
    try {
      // Find the entry to get the internal ID
      const entry = ledgerData?.entries.find(e => e.id === entryId);
      if (entry) {
        setSelectedEntryId(entryId);
        setSelectedEntryInternalId(entry.internalId);
        setAttachmentModalOpen(true);
      }
    } catch (error) {
      console.error('Error opening attachment manager:', error);
      alert('Error opening attachment manager.');
    }
  };

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
              <h1 className="text-3xl font-bold text-gray-900">Cash Flow Management</h1>
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

          {/* Action Bar */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                MXN Accounting Ledger
              </h2>
              <p className="text-gray-600">
                View all users' income and expenses in Mexican Pesos
              </p>
            </div>
            <button
              onClick={() => setShowEntryForm(!showEntryForm)}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                showEntryForm 
                  ? 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500' 
                  : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
              }`}
            >
              {showEntryForm ? (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Entry
                </>
              )}
            </button>
          </div>

          {/* Entry Form */}
          {showEntryForm && (
            <LedgerEntryForm
              onSubmit={handleSubmitEntry}
              onCancel={() => setShowEntryForm(false)}
              isLoading={createEntryMutation.isPending}
              currency="MXN"
            />
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error loading ledger data
                  </h3>
                  <p className="mt-2 text-sm text-red-700">
                    {error?.message || 'An unexpected error occurred'}
                  </p>
                  <button
                    onClick={() => refetch()}
                    className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Ledger Table */}
          <LedgerTable
            entries={ledgerData?.entries || []}
            onEditEntry={handleEditEntry}
            onDeleteEntry={handleDeleteEntry}
            onViewAttachments={handleViewAttachments}
            onMarkAsRealized={handleMarkAsRealized}
            currentUserId={user?.id}
            isLoading={isLoading}
          />

        </div>
      </main>

      {/* Attachment Manager Modal */}
      {attachmentModalOpen && selectedEntryId && (
        <AttachmentManagerModal
          entryId={selectedEntryId}
          entryInternalId={selectedEntryInternalId}
          isOpen={attachmentModalOpen}
          onClose={() => setAttachmentModalOpen(false)}
        />
      )}
    </div>
  );
};

export default CashFlow;