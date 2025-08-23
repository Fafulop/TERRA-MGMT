import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CotizacionesEntryForm from '../components/CotizacionesEntryForm';
import CotizacionesTable from '../components/CotizacionesTable';
import { CotizacionesEntryFormData, CotizacionesFilters } from '../services/cotizaciones';
import { 
  useCotizacionesEntries, 
  useCreateCotizacionesEntry, 
  useUpdateCotizacionesEntry, 
  useDeleteCotizacionesEntry 
} from '../hooks/useCotizacionesQueries';

const Cotizaciones = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [filters, setFilters] = useState<CotizacionesFilters>({});

  // React Query hooks
  const { data: cotizacionesData, isLoading, error, refetch } = useCotizacionesEntries(filters);
  const createEntryMutation = useCreateCotizacionesEntry();
  const deleteEntryMutation = useDeleteCotizacionesEntry();

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSubmitEntry = async (formData: CotizacionesEntryFormData) => {
    try {
      await createEntryMutation.mutateAsync(formData);
      setShowEntryForm(false);
    } catch (error) {
      console.error('Error creating cotizaciones entry:', error);
      // Error handling is done in the mutation hook
    }
  };

  const handleEditEntry = async (entry: any) => {
    // TODO: Implement edit modal/form
    console.log('Edit cotizaciones entry:', entry);
  };

  const handleDeleteEntry = async (entryId: number) => {
    if (window.confirm('Are you sure you want to delete this cotización entry?')) {
      try {
        await deleteEntryMutation.mutateAsync(entryId);
      } catch (error) {
        console.error('Error deleting cotizaciones entry:', error);
        // Error handling is done in the mutation hook
      }
    }
  };

  const handleViewAttachments = async (entryId: number) => {
    try {
      // Fetch the full entry with attachments
      const response = await fetch(`http://localhost:5000/api/cotizaciones/${entryId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const entry = await response.json();
        if (entry.attachments && entry.attachments.length > 0) {
          // Open each attachment in a new tab
          entry.attachments.forEach((att: any, index: number) => {
            setTimeout(() => {
              window.open(att.fileUrl, '_blank');
            }, index * 100); // Stagger multiple file opens
          });
        } else {
          alert('No attachments found for this entry.');
        }
      } else {
        console.error('Failed to fetch entry details');
        alert('Failed to load attachments.');
      }
    } catch (error) {
      console.error('Error fetching attachments:', error);
      alert('Error loading attachments.');
    }
  };

  // Calculate summary by currency
  const summaryByCurrency = cotizacionesData?.summary || {};
  const totalUSD = summaryByCurrency.USD || { total_income: 0, total_expenses: 0, net_cash_flow: 0, total_entries: 0 };
  const totalMXN = summaryByCurrency.MXN || { total_income: 0, total_expenses: 0, net_cash_flow: 0, total_entries: 0 };

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
              <h1 className="text-3xl font-bold text-gray-900">Cotizaciones Management</h1>
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
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* USD Summary */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">🇺🇸</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">USD Net Flow</dt>
                      <dd className={`text-lg font-medium ${totalUSD.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${Math.abs(totalUSD.net_cash_flow).toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* MXN Summary */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">🇲🇽</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">MXN Net Flow</dt>
                      <dd className={`text-lg font-medium ${totalMXN.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${Math.abs(totalMXN.net_cash_flow).toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Entries */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">📊</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Entries</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {totalUSD.total_entries + totalMXN.total_entries}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Multi-Currency Indicator */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">💱</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Multi-Currency</dt>
                      <dd className="text-lg font-medium text-blue-600">
                        USD & MXN
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Cotizaciones Ledger</h2>
              <p className="text-gray-600">View all quotes and quotations from all users in USD and MXN currencies</p>
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
                  Add Cotización
                </>
              )}
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  value={filters.currency || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, currency: e.target.value as 'USD' | 'MXN' || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Currencies</option>
                  <option value="USD">🇺🇸 USD</option>
                  <option value="MXN">🇲🇽 MXN</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entry Type
                </label>
                <select
                  value={filters.entry_type || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, entry_type: e.target.value as 'income' | 'expense' || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="income">💰 Income</option>
                  <option value="expense">💸 Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area
                </label>
                <input
                  type="text"
                  value={filters.area || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, area: e.target.value || undefined }))}
                  placeholder="Filter by area..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subarea
                </label>
                <input
                  type="text"
                  value={filters.subarea || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, subarea: e.target.value || undefined }))}
                  placeholder="Filter by subarea..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Entry Form */}
          {showEntryForm && (
            <CotizacionesEntryForm
              onSubmit={handleSubmitEntry}
              onCancel={() => setShowEntryForm(false)}
              isLoading={createEntryMutation.isPending}
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
                    Error loading cotizaciones data
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

          {/* Cotizaciones Table */}
          <CotizacionesTable
            entries={cotizacionesData?.entries as any[] || []}
            onEditEntry={handleEditEntry}
            onDeleteEntry={handleDeleteEntry}
            onViewAttachments={handleViewAttachments}
            currentUserId={user?.id}
            isLoading={isLoading}
          />

        </div>
      </main>
    </div>
  );
};

export default Cotizaciones;