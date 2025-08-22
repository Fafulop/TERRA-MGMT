import React from 'react';
import { CotizacionesEntry } from '../services/cotizaciones';
import { formatCurrencyAmount } from '../utils/currencyConverter';

interface CotizacionesTableProps {
  entries: CotizacionesEntry[];
  onEditEntry: (entry: CotizacionesEntry) => void;
  onDeleteEntry: (entryId: number) => void;
  onViewAttachments: (entryId: number) => void;
  currentUserId?: number;
  isLoading?: boolean;
}

const CotizacionesTable: React.FC<CotizacionesTableProps> = ({
  entries,
  onEditEntry,
  onDeleteEntry,
  onViewAttachments,
  currentUserId,
  isLoading = false
}) => {
  const formatAmount = (amount: number, currency: 'USD' | 'MXN') => {
    return formatCurrencyAmount(Math.abs(amount), currency);
  };

  const getEntryTypeColor = (entryType: 'income' | 'expense') => {
    return entryType === 'income' 
      ? 'text-green-600 bg-green-50' 
      : 'text-red-600 bg-red-50';
  };

  const getCurrencyColor = (currency: 'USD' | 'MXN') => {
    return currency === 'USD' 
      ? 'text-blue-600 bg-blue-50' 
      : 'text-orange-600 bg-orange-50';
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="p-6 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">No cotización entries found</h3>
          <p className="text-sm text-gray-500">Get started by creating your first cotización entry.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Cotizaciones Entries</h3>
        <p className="text-sm text-gray-500">Manage your quotes and quotations in multiple currencies</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount & Currency
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Concept
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bank Account
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Attachments
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(entry.transaction_date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      {entry.internal_id}
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm font-bold text-gray-900">
                      {formatAmount(entry.amount, entry.currency)}
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getCurrencyColor(entry.currency)}`}>
                      {entry.currency === 'USD' ? '🇺🇸 USD' : '🇲🇽 MXN'}
                    </span>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEntryTypeColor(entry.entry_type)}`}>
                    {entry.entry_type === 'income' ? '💰 Income' : '💸 Expense'}
                  </span>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8">
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {entry.first_name ? entry.first_name[0] : entry.username?.[0] || 'U'}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {entry.first_name && entry.last_name 
                          ? `${entry.first_name} ${entry.last_name}`
                          : entry.username || 'Unknown User'
                        }
                      </div>
                      {entry.username && (
                        <div className="text-xs text-gray-500">@{entry.username}</div>
                      )}
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate" title={entry.concept}>
                    {entry.concept}
                  </div>
                  {entry.description && (
                    <div className="text-xs text-gray-500 max-w-xs truncate" title={entry.description}>
                      {entry.description}
                    </div>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{entry.bank_account}</div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  {entry.attachments && entry.attachments.length > 0 ? (
                    <button
                      onClick={() => onViewAttachments(entry.id)}
                      className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      {entry.attachments.length}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">None</span>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    {currentUserId === entry.user_id ? (
                      <>
                        <button
                          onClick={() => onEditEntry(entry)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Edit entry"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDeleteEntry(entry.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete entry"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-400 text-xs">View Only</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CotizacionesTable;