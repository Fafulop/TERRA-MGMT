import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCountsByDate, useCountsForDate } from '../hooks/useInventarioQueries';

const Inventario: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: countDatesData, isLoading: datesLoading } = useCountsByDate();
  const { data: dateCountsData, isLoading: dateCountsLoading } = useCountsForDate(selectedDate);

  const countDates = countDatesData?.count_dates || [];
  const dateCounts = dateCountsData?.counts || [];

  if (!user) {
    navigate('/login');
    return null;
  }

  const formatCurrency = (value: number | undefined) => {
    if (!value) return 'MXN $0.00';
    const numValue = parseFloat(String(value));
    if (isNaN(numValue)) return 'MXN $0.00';
    return `MXN $${numValue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDateLong = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Bienvenido, {user.username}!</span>
              <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-3">Acciones Rápidas</h2>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/inventario/count')}
                className="inline-flex items-center px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Realizar Conteo
              </button>
              <button
                onClick={() => navigate('/inventario/items')}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Gestionar Catálogo
              </button>
            </div>
          </div>

          {/* History View */}
          <div className="space-y-6">
              {/* Count Dates List */}
              {datesLoading ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                  <p className="mt-2 text-gray-600">Cargando historial...</p>
                </div>
              ) : countDates.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <svg className="mx-auto w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-gray-600">No hay conteos registrados aún</p>
                  <button
                    onClick={() => navigate('/inventario/count')}
                    className="mt-4 inline-flex items-center px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
                  >
                    Realizar Primer Conteo
                  </button>
                </div>
              ) : (
                <>
                  {/* Date Selector */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Seleccionar Fecha de Conteo</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {countDates.map((dateInfo: any) => (
                        <button
                          key={dateInfo.count_date}
                          onClick={() => setSelectedDate(dateInfo.count_date)}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            selectedDate === dateInfo.count_date
                              ? 'border-cyan-600 bg-cyan-50'
                              : 'border-gray-200 hover:border-cyan-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="text-lg font-bold text-gray-900">
                              {formatDateLong(dateInfo.count_date)}
                            </div>
                            {selectedDate === dateInfo.count_date && (
                              <svg className="w-6 h-6 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div>{dateInfo.items_counted} items contados</div>
                            <div className="font-medium text-cyan-600">{formatCurrency(dateInfo.total_value)}</div>
                            {dateInfo.sessions && dateInfo.sessions.length > 0 && dateInfo.sessions[0] && (
                              <div className="text-xs text-gray-500 mt-2">
                                <span className="px-2 py-1 bg-gray-100 rounded">
                                  {dateInfo.sessions[0]}
                                </span>
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selected Date Details */}
                  {selectedDate && (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-xl font-bold text-gray-900">
                          Conteo del {formatDateLong(selectedDate)}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                          {dateCounts.length} items contados en esta fecha
                        </p>
                      </div>

                      {dateCountsLoading ? (
                        <div className="p-8 text-center">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                          <p className="mt-2 text-gray-600">Cargando detalles...</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contado por</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notas</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {dateCounts.map((count: any) => (
                                <tr key={count.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">{count.item_name}</div>
                                    {count.item_description && (
                                      <div className="text-xs text-gray-500">{count.item_description}</div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                                      {count.item_category}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                    {parseFloat(count.quantity)} {count.item_unit}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900">
                                    {formatCurrency(count.total_value)}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-600">
                                    {count.counted_by_username}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-500">
                                    {count.notes || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default Inventario;
