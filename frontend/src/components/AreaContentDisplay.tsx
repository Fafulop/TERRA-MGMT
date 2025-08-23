import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { areasService, AreaContentSummary } from '../services/areas';

interface AreaContentDisplayProps {
  areaName: string;
  subareaName?: string;
  isExpanded: boolean;
}

const AreaContentDisplay: React.FC<AreaContentDisplayProps> = ({
  areaName,
  subareaName,
  isExpanded
}) => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [content, setContent] = useState<AreaContentSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isExpanded && token) {
      loadContent();
    }
  }, [isExpanded, areaName, subareaName, token]);

  const loadContent = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = subareaName 
        ? await areasService.getSubareaContent(areaName, subareaName, token)
        : await areasService.getAreaContent(areaName, token);
      
      setContent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  if (!isExpanded) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-blue-100 text-blue-800', 
      'completed': 'bg-green-100 text-green-800',
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'archived': 'bg-red-100 text-red-800',
      'draft': 'bg-yellow-100 text-yellow-800',
      'income': 'bg-green-100 text-green-800',
      'expense': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-indigo-500">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
          <span className="text-gray-600">Loading content...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
        <div className="text-red-700">
          <p className="font-medium">Error loading content:</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!content) return null;

  const { counts } = content;

  // Navigation helper functions
  const navigateToModule = (module: string) => {
    const moduleRoutes: { [key: string]: string } = {
      'tasks': '/tasks',
      'personal-tasks': '/personal',
      'cotizaciones': '/cotizaciones',
      'contacts': '/contactos',
      'ledger': '/cash-flow',
      'ledger-mxn': '/cash-flow',
      'documents': '/documentos'
    };
    navigate(moduleRoutes[module] || '/');
  };

  const createNewInModule = (module: string) => {
    const createRoutes: { [key: string]: string } = {
      'tasks': '/create-task',
      'personal-tasks': '/personal',
      'cotizaciones': '/cotizaciones',
      'contacts': '/contactos',
      'ledger': '/cash-flow',
      'documents': '/documentos'
    };
    navigate(createRoutes[module] || '/');
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-indigo-500 space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4 pb-4 border-b border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{counts.tasks}</div>
          <div className="text-sm text-gray-600">Tasks</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-600">{(counts as any).personalTasks || 0}</div>
          <div className="text-sm text-gray-600">Personal Tasks</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{counts.cotizaciones}</div>
          <div className="text-sm text-gray-600">Cotizaciones</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{counts.contacts}</div>
          <div className="text-sm text-gray-600">Contacts</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-600">{counts.ledgerEntries}</div>
          <div className="text-sm text-gray-600">Ledger USD</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-teal-600">{counts.ledgerEntriesMxn}</div>
          <div className="text-sm text-gray-600">Ledger MXN</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{counts.documents}</div>
          <div className="text-sm text-gray-600">Documents</div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-6">
        
        {/* Tasks Section */}
        {content.content.tasks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Tasks ({content.content.tasks.length})
              </h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => createNewInModule('tasks')}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                  title="Create new task"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New
                </button>
                <button
                  onClick={() => navigateToModule('tasks')}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
                  title="View all tasks"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View All
                </button>
              </div>
            </div>
            <div className="grid gap-3">
              {content.content.tasks.map((task) => (
                <div key={task.id} className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{task.title}</h5>
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        {task.due_date && (
                          <span className="text-xs text-gray-500">Due: {formatDate(task.due_date)}</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 text-xs text-gray-500">
                      {formatDate(task.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Personal Tasks Section */}
        {content.content.personalTasks && content.content.personalTasks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Personal Tasks ({content.content.personalTasks.length})
              </h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => createNewInModule('personal-tasks')}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-slate-700 bg-slate-100 hover:bg-slate-200"
                  title="Create new personal task"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New
                </button>
                <button
                  onClick={() => navigateToModule('personal-tasks')}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
                  title="View all personal tasks"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View All
                </button>
              </div>
            </div>
            <div className="grid gap-3">
              {content.content.personalTasks.map((task) => (
                <div key={task.id} className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{task.title}</h5>
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        {task.due_date && (
                          <span className="text-xs text-gray-500">Due: {formatDate(task.due_date)}</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 text-xs text-gray-500">
                      {formatDate(task.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cotizaciones Section */}
        {content.content.cotizaciones.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Cotizaciones ({content.content.cotizaciones.length})
              </h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => createNewInModule('cotizaciones')}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                  title="Create new cotización"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New
                </button>
                <button
                  onClick={() => navigateToModule('cotizaciones')}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
                  title="View all cotizaciones"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View All
                </button>
              </div>
            </div>
            <div className="grid gap-3">
              {content.content.cotizaciones.map((cotizacion) => (
                <div key={cotizacion.id} className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-bold text-gray-900">
                          {formatCurrency(cotizacion.amount, cotizacion.currency)}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(cotizacion.entry_type)}`}>
                          {cotizacion.entry_type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{cotizacion.concept}</p>
                      <p className="text-xs text-gray-500 mt-1">Bank: {cotizacion.bank_account}</p>
                    </div>
                    <div className="ml-4 text-xs text-gray-500">
                      {formatDate(cotizacion.transaction_date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contacts Section */}
        {content.content.contacts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Contacts ({content.content.contacts.length})
              </h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => createNewInModule('contacts')}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200"
                  title="Create new contact"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New
                </button>
                <button
                  onClick={() => navigateToModule('contacts')}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
                  title="View all contacts"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View All
                </button>
              </div>
            </div>
            <div className="grid gap-3">
              {content.content.contacts.map((contact) => (
                <div key={contact.id} className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{contact.name}</h5>
                      {contact.company && (
                        <p className="text-sm text-gray-700">{contact.company}</p>
                      )}
                      {contact.position && (
                        <p className="text-sm text-gray-600">{contact.position}</p>
                      )}
                      <div className="flex items-center space-x-3 mt-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(contact.contact_type)}`}>
                          {contact.contact_type}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(contact.status)}`}>
                          {contact.status}
                        </span>
                      </div>
                      {contact.email && (
                        <p className="text-xs text-gray-500 mt-1">{contact.email}</p>
                      )}
                    </div>
                    <div className="ml-4 text-xs text-gray-500">
                      {formatDate(contact.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ledger Entries USD Section */}
        {content.content.ledgerEntries.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Ledger Entries USD ({content.content.ledgerEntries.length})
              </h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => createNewInModule('ledger')}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                  title="Create new ledger entry"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New
                </button>
                <button
                  onClick={() => navigateToModule('ledger')}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
                  title="View all ledger entries"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View All
                </button>
              </div>
            </div>
            <div className="grid gap-3">
              {content.content.ledgerEntries.map((entry) => (
                <div key={entry.id} className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-bold text-gray-900">
                          {formatCurrency(entry.amount, 'USD')}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(entry.entry_type)}`}>
                          {entry.entry_type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{entry.concept}</p>
                      <p className="text-xs text-gray-500 mt-1">Bank: {entry.bank_account}</p>
                    </div>
                    <div className="ml-4 text-xs text-gray-500">
                      {formatDate(entry.transaction_date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ledger Entries MXN Section */}
        {content.content.ledgerEntriesMxn.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Ledger Entries MXN ({content.content.ledgerEntriesMxn.length})
              </h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => createNewInModule('ledger')}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-teal-700 bg-teal-100 hover:bg-teal-200"
                  title="Create new MXN ledger entry"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New
                </button>
                <button
                  onClick={() => navigateToModule('ledger-mxn')}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
                  title="View all MXN ledger entries"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View All
                </button>
              </div>
            </div>
            <div className="grid gap-3">
              {content.content.ledgerEntriesMxn.map((entry) => (
                <div key={entry.id} className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-bold text-gray-900">
                          {formatCurrency(entry.amount, 'MXN')}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(entry.entry_type)}`}>
                          {entry.entry_type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{entry.concept}</p>
                      <p className="text-xs text-gray-500 mt-1">Bank: {entry.bank_account}</p>
                    </div>
                    <div className="ml-4 text-xs text-gray-500">
                      {formatDate(entry.transaction_date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents Section */}
        {content.content.documents.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Documents ({content.content.documents.length})
              </h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => createNewInModule('documents')}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-orange-700 bg-orange-100 hover:bg-orange-200"
                  title="Create new document"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New
                </button>
                <button
                  onClick={() => navigateToModule('documents')}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
                  title="View all documents"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View All
                </button>
              </div>
            </div>
            <div className="grid gap-3">
              {content.content.documents.map((document) => (
                <div key={document.id} className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{document.document_name}</h5>
                      <div className="flex items-center space-x-3 mt-2">
                        {document.document_type && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {document.document_type}
                          </span>
                        )}
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(document.status)}`}>
                          {document.status}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 text-xs text-gray-500">
                      {formatDate(document.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {counts.total === 0 && (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2m16-7H4m16 0l-2-9H6l-2 9" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
            <p className="text-gray-500">
              {subareaName 
                ? `No items have been created in the "${subareaName}" subarea yet.`
                : `No items have been created in the "${areaName}" area yet.`
              }
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default AreaContentDisplay;