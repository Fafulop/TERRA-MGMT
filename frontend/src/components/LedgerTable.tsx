import React, { useState, useMemo } from 'react';
import { LedgerEntry, LedgerFilters } from '../types';

interface LedgerTableProps {
  entries: LedgerEntry[];
  onEditEntry?: (entry: LedgerEntry) => void;
  onDeleteEntry?: (entryId: number) => void;
  onViewAttachments?: (entryId: number) => void;
  currentUserId?: number;
  isLoading?: boolean;
}

const LedgerTable: React.FC<LedgerTableProps> = ({
  entries,
  onEditEntry,
  onDeleteEntry,
  onViewAttachments,
  currentUserId,
  isLoading = false
}) => {
  const [filters, setFilters] = useState<LedgerFilters>({
    entryType: 'all',
    searchTerm: ''
  });
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'concept'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Get unique bank accounts for filter dropdown
  const bankAccounts = useMemo(() => {
    const accounts = [...new Set(entries.map(entry => entry.bankAccount))];
    return accounts.sort();
  }, [entries]);

  // Filter and sort entries
  const filteredAndSortedEntries = useMemo(() => {
    let filtered = entries;

    // Apply filters
    if (filters.entryType && filters.entryType !== 'all') {
      filtered = filtered.filter(entry => entry.entryType === filters.entryType);
    }

    if (filters.bankAccount) {
      filtered = filtered.filter(entry => entry.bankAccount === filters.bankAccount);
    }

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.concept.toLowerCase().includes(searchLower) ||
        entry.internalId.toLowerCase().includes(searchLower) ||
        (entry.bankMovementId && entry.bankMovementId.toLowerCase().includes(searchLower)) ||
        entry.area.toLowerCase().includes(searchLower) ||
        entry.subarea.toLowerCase().includes(searchLower)
      );
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(entry => entry.date >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      filtered = filtered.filter(entry => entry.date <= filters.dateTo!);
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'amount':
          aValue = Math.abs(a.amount);
          bValue = Math.abs(b.amount);
          break;
        case 'concept':
          aValue = a.concept.toLowerCase();
          bValue = b.concept.toLowerCase();
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  }, [entries, filters, sortBy, sortOrder]);

  // Calculate totals
  const totals = useMemo(() => {
    const income = filteredAndSortedEntries
      .filter(entry => entry.entryType === 'income')
      .reduce((sum, entry) => sum + entry.amount, 0);
    
    const expenses = filteredAndSortedEntries
      .filter(entry => entry.entryType === 'expense')
      .reduce((sum, entry) => sum + Math.abs(entry.amount), 0);

    return {
      income,
      expenses,
      netCashFlow: income - expenses
    };
  }, [filteredAndSortedEntries]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSort = (column: 'date' | 'amount' | 'concept') => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (column: 'date' | 'amount' | 'concept') => {
    if (sortBy !== column) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
      </svg>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Entry Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={filters.entryType}
              onChange={(e) => setFilters(prev => ({ ...prev, entryType: e.target.value as any }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          {/* Bank Account Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bank Account
            </label>
            <select
              value={filters.bankAccount || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, bankAccount: e.target.value || undefined }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Accounts</option>
              {bankAccounts.map((account, index) => (
                <option key={`bank-${index}-${account}`} value={account}>{account}</option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value || undefined }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value || undefined }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search concept, area, subarea, ID..."
              value={filters.searchTerm || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">Total Income</p>
            <p className="text-lg font-semibold text-green-600">{formatCurrency(totals.income)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">Total Expenses</p>
            <p className="text-lg font-semibold text-red-600">{formatCurrency(totals.expenses)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">Net Cash Flow</p>
            <p className={`text-lg font-semibold ${totals.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totals.netCashFlow)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">Total Entries</p>
            <p className="text-lg font-semibold text-gray-900">{filteredAndSortedEntries.length}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center space-x-1">
                  <span>Date</span>
                  {getSortIcon('date')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center space-x-1">
                  <span>Amount</span>
                  {getSortIcon('amount')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('concept')}
              >
                <div className="flex items-center space-x-1">
                  <span>Concept</span>
                  {getSortIcon('concept')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Area & Subarea
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bank Account
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Internal ID
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
            {filteredAndSortedEntries.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-lg font-medium text-gray-900 mb-2">No ledger entries found</p>
                    <p className="text-gray-500">Start by adding your first income or expense entry.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAndSortedEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(entry.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      entry.entryType === 'income' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {entry.entryType === 'income' ? 'Income' : 'Expense'}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {entry.firstName ? entry.firstName[0] : entry.username?.[0] || 'U'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {entry.firstName && entry.lastName 
                            ? `${entry.firstName} ${entry.lastName}`
                            : entry.username || 'Unknown User'
                          }
                        </div>
                        {entry.username && (
                          <div className="text-xs text-gray-500">@{entry.username}</div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      entry.entryType === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {entry.entryType === 'income' ? '+' : '-'}{formatCurrency(Math.abs(entry.amount))}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate" title={entry.concept}>
                      {entry.concept}
                    </div>
                    {entry.bankMovementId && (
                      <div className="text-xs text-gray-500">Bank ID: {entry.bankMovementId}</div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {entry.area}
                    </div>
                    <div className="text-sm text-gray-500">
                      {entry.subarea}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.bankAccount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {entry.internalId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(entry.attachments && entry.attachments.length > 0) || (entry.attachmentCount && entry.attachmentCount > 0) ? (
                      <button
                        onClick={() => {
                          if (entry.attachments && entry.attachments.length > 0) {
                            // If we have full attachment data, show them directly
                            entry.attachments.forEach((att, index) => {
                              setTimeout(() => {
                                window.open(att.fileUrl, '_blank');
                              }, index * 100); // Stagger multiple file opens
                            });
                          } else if (onViewAttachments) {
                            // If we only have count, fetch the full entry
                            onViewAttachments(entry.id);
                          }
                        }}
                        className="flex items-center text-blue-600 hover:text-blue-800"
                        title="View attachments"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a2 2 0 00-2.828-2.828z" />
                        </svg>
                        <span>{entry.attachments?.length || entry.attachmentCount || 0}</span>
                      </button>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {currentUserId === entry.userId ? (
                        <>
                          {onEditEntry && (
                            <button
                              onClick={() => onEditEntry(entry)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit entry"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                          {onDeleteEntry && (
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this entry?')) {
                                  onDeleteEntry(entry.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Delete entry"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400 text-xs">View Only</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LedgerTable;