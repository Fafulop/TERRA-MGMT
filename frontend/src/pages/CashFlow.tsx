import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LedgerEntryForm from '../components/LedgerEntryForm';
import LedgerTable from '../components/LedgerTable';
import AttachmentManagerModal from '../components/AttachmentManagerModal';
import LedgerEntryEditModal from '../components/LedgerEntryEditModal';
import { LedgerEntry, LedgerEntryFormData, LedgerFilters } from '../types';
import { useLedgerMxnEntries, useCreateLedgerMxnEntry, useUpdateLedgerMxnEntry, useDeleteLedgerMxnEntry, useMarkLedgerMxnAsRealized } from '../hooks/useLedgerMxnQueries';

const CashFlow = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'resumen' | 'movimientos'>('resumen');
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [filters] = useState<LedgerFilters>({});
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [selectedEntryInternalId, setSelectedEntryInternalId] = useState<string>('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);

  // MXN React Query hooks
  const { data: ledgerData, isLoading, error, refetch } = useLedgerMxnEntries(filters);
  const createEntryMutation = useCreateLedgerMxnEntry();
  const updateEntryMutation = useUpdateLedgerMxnEntry();
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

  const handleEditEntry = async (entry: LedgerEntry) => {
    setSelectedEntry(entry);
    setEditModalOpen(true);
  };

  const handleUpdateEntry = async (id: number, formData: Partial<LedgerEntryFormData>) => {
    try {
      await updateEntryMutation.mutateAsync({ id, data: formData });
      setEditModalOpen(false);
      setSelectedEntry(null);
    } catch (error) {
      console.error('Error updating MXN ledger entry:', error);
      // Error handling is done in the mutation hook
    }
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

  // Helper function to filter entries by date range
  const getFilteredEntries = () => {
    if (!ledgerData?.entries) return [];

    let filtered = [...ledgerData.entries];

    if (dateFrom) {
      filtered = filtered.filter(entry => new Date(entry.date) >= new Date(dateFrom));
    }

    if (dateTo) {
      filtered = filtered.filter(entry => new Date(entry.date) <= new Date(dateTo));
    }

    return filtered;
  };

  // Helper function to group entries by area and subarea
  const getGroupedData = (entryType: 'income' | 'expense') => {
    const filtered = getFilteredEntries().filter(e => e.entryType === entryType);

    // Group by area -> subarea
    const grouped: Record<string, Record<string, number>> = {};

    filtered.forEach(entry => {
      if (!grouped[entry.area]) {
        grouped[entry.area] = {};
      }
      if (!grouped[entry.area][entry.subarea]) {
        grouped[entry.area][entry.subarea] = 0;
      }
      grouped[entry.area][entry.subarea] += entry.amount;
    });

    return grouped;
  };

  // Calculate totals
  const calculateAreaTotal = (areaData: Record<string, number>) => {
    return Object.values(areaData).reduce((sum, amount) => sum + amount, 0);
  };

  const calculateGrandTotal = (entryType: 'income' | 'expense') => {
    const grouped = getGroupedData(entryType);
    return Object.values(grouped).reduce((sum, areaData) =>
      sum + calculateAreaTotal(areaData), 0
    );
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

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('resumen')}
                className={`${
                  activeTab === 'resumen'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                RESUMEN
              </button>
              <button
                onClick={() => setActiveTab('movimientos')}
                className={`${
                  activeTab === 'movimientos'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                MOVIMIENTOS
              </button>
            </nav>
          </div>

          {/* Resumen Tab */}
          {activeTab === 'resumen' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Resumen</h2>
                <p className="text-gray-600">Vista general del flujo de efectivo por área y subárea</p>
              </div>

              {/* Date Range Filters */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Rango de Fechas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
                      Desde
                    </label>
                    <input
                      type="date"
                      id="dateFrom"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
                      Hasta
                    </label>
                    <input
                      type="date"
                      id="dateTo"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => {
                      setDateFrom('');
                      setDateTo('');
                    }}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>

              {/* Income Section */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <svg className="h-6 w-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <h3 className="text-xl font-bold text-gray-900">INGRESOS</h3>
                </div>

                {Object.entries(getGroupedData('income')).map(([area, subareas]) => (
                  <div key={area} className="mb-6 last:mb-0">
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{area}</h4>
                    </div>

                    {Object.entries(subareas).map(([subarea, amount]) => (
                      <div key={subarea} className="flex justify-between items-center py-2 px-6 border-b border-gray-200">
                        <span className="text-gray-700">{subarea}</span>
                        <span className="font-medium text-gray-900">${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    ))}

                    <div className="flex justify-between items-center py-3 px-6 bg-green-100 font-bold">
                      <span className="text-gray-900">Total {area}</span>
                      <span className="text-green-700">${calculateAreaTotal(subareas).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                ))}

                {Object.keys(getGroupedData('income')).length === 0 && (
                  <p className="text-gray-500 text-center py-4">No hay ingresos en el rango seleccionado</p>
                )}

                <div className="mt-6 pt-4 border-t-2 border-green-500">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900">TOTAL INGRESOS</span>
                    <span className="text-2xl font-bold text-green-600">${calculateGrandTotal('income').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Expenses Section */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <svg className="h-6 w-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                  <h3 className="text-xl font-bold text-gray-900">GASTOS</h3>
                </div>

                {Object.entries(getGroupedData('expense')).map(([area, subareas]) => (
                  <div key={area} className="mb-6 last:mb-0">
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{area}</h4>
                    </div>

                    {Object.entries(subareas).map(([subarea, amount]) => (
                      <div key={subarea} className="flex justify-between items-center py-2 px-6 border-b border-gray-200">
                        <span className="text-gray-700">{subarea}</span>
                        <span className="font-medium text-gray-900">${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    ))}

                    <div className="flex justify-between items-center py-3 px-6 bg-red-100 font-bold">
                      <span className="text-gray-900">Total {area}</span>
                      <span className="text-red-700">${calculateAreaTotal(subareas).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                ))}

                {Object.keys(getGroupedData('expense')).length === 0 && (
                  <p className="text-gray-500 text-center py-4">No hay gastos en el rango seleccionado</p>
                )}

                <div className="mt-6 pt-4 border-t-2 border-red-500">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900">TOTAL GASTOS</span>
                    <span className="text-2xl font-bold text-red-600">${calculateGrandTotal('expense').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Balance Summary */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="h-8 w-8 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="text-2xl font-bold text-gray-900">BALANCE NETO</span>
                  </div>
                  <span className={`text-3xl font-bold ${calculateGrandTotal('income') - calculateGrandTotal('expense') >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${(calculateGrandTotal('income') - calculateGrandTotal('expense')).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Movimientos Tab */}
          {activeTab === 'movimientos' && (
            <div className="space-y-6">
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
          )}

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

      {/* Edit Entry Modal */}
      {editModalOpen && selectedEntry && (
        <LedgerEntryEditModal
          entry={selectedEntry}
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedEntry(null);
          }}
          onSubmit={handleUpdateEntry}
          isLoading={updateEntryMutation.isPending}
        />
      )}
    </div>
  );
};

export default CashFlow;