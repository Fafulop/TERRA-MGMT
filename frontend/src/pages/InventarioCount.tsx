import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useItems, useCreateBatchCounts, useCreateCountSession } from '../hooks/useInventarioQueries';
import { InventarioItem } from '../types/inventario';

interface CountEntry {
  item_id: number;
  item: InventarioItem;
  selected: boolean;
  quantity: number;
  notes: string;
}

const InventarioCount: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [countDate, setCountDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionName, setSessionName] = useState('');
  const [countStarted, setCountStarted] = useState(false);
  const [counts, setCounts] = useState<CountEntry[]>([]);

  const { data: itemsData, isLoading: itemsLoading } = useItems({ status: 'active' });
  const createBatchMutation = useCreateBatchCounts();
  const createSessionMutation = useCreateCountSession();

  const items = itemsData?.items || [];

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleStartCount = () => {
    if (!countDate) {
      alert('Por favor selecciona una fecha para el conteo');
      return;
    }

    // Initialize count entries with all active items
    const initialCounts: CountEntry[] = items.map(item => ({
      item_id: item.id,
      item: item,
      selected: false,
      quantity: 0,
      notes: ''
    }));

    setCounts(initialCounts);
    setCountStarted(true);
  };

  const handleToggleItem = (item_id: number) => {
    setCounts(prev => prev.map(c =>
      c.item_id === item_id ? { ...c, selected: !c.selected } : c
    ));
  };

  const handleUpdateQuantity = (item_id: number, quantity: number) => {
    setCounts(prev => prev.map(c =>
      c.item_id === item_id ? { ...c, quantity, selected: quantity > 0 ? true : c.selected } : c
    ));
  };

  const handleUpdateNotes = (item_id: number, notes: string) => {
    setCounts(prev => prev.map(c =>
      c.item_id === item_id ? { ...c, notes } : c
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedCounts = counts.filter(c => c.selected && c.quantity > 0);

    if (selectedCounts.length === 0) {
      alert('Por favor selecciona al menos un item y asigna una cantidad');
      return;
    }

    try {
      // Create session first if name provided
      let sessionId: number | undefined;
      if (sessionName.trim()) {
        const sessionResult = await createSessionMutation.mutateAsync({
          session_name: sessionName,
          count_date: countDate
        });
        sessionId = sessionResult.session?.id;
      }

      // Create batch counts
      await createBatchMutation.mutateAsync({
        counts: selectedCounts.map(c => ({
          item_id: c.item_id,
          count_date: countDate,
          quantity: c.quantity,
          notes: c.notes || undefined,
          session_id: sessionId
        })),
        session_id: sessionId
      });

      alert('¡Conteo guardado exitosamente!');
      navigate('/inventario');
    } catch (error) {
      console.error('Error saving count:', error);
      alert('Error al guardar el conteo');
    }
  };

  const handleCancel = () => {
    if (countStarted) {
      if (window.confirm('¿Estás seguro de cancelar el conteo? Se perderán todos los datos ingresados.')) {
        setCountStarted(false);
        setCounts([]);
      }
    } else {
      navigate('/inventario');
    }
  };

  const isLoading = createBatchMutation.isPending || createSessionMutation.isPending;
  const selectedCount = counts.filter(c => c.selected).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/inventario')} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Conteo Físico</h1>
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
        <div className="px-4 py-6 sm:px-0">

          {!countStarted ? (
            /* Initial Screen - Date Selection */
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="text-center mb-8">
                  <div className="mx-auto w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Iniciar Conteo de Inventario</h2>
                  <p className="text-gray-600">Selecciona la fecha y opcionalmente un nombre para esta sesión de conteo</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha del Conteo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={countDate}
                      onChange={(e) => setCountDate(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de Sesión (opcional)
                    </label>
                    <input
                      type="text"
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      placeholder="ej. Inventario Mensual - Octubre 2025"
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">Ayuda a identificar este conteo en el futuro</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">¿Qué sucederá después?</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-700">
                          <li>Se mostrarán todos los items activos del catálogo</li>
                          <li>Selecciona los items que deseas contar</li>
                          <li>Ingresa las cantidades encontradas</li>
                          <li>Guarda el conteo completo</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => navigate('/inventario')}
                      className="flex-1 px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleStartCount}
                      disabled={!countDate || itemsLoading}
                      className="flex-1 px-6 py-3 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {itemsLoading ? 'Cargando...' : 'Iniciar Conteo'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Count Screen - Item Selection & Quantities */
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Count Info Header */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Conteo en Progreso</h2>
                    <div className="mt-2 flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">Fecha:</span> {new Date(countDate).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                      {sessionName && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span className="font-medium">Sesión:</span> {sessionName}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-cyan-600">{selectedCount}</div>
                    <div className="text-sm text-gray-600">items seleccionados</div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-medium text-gray-900">Selecciona Items a Contar</h3>
                  <p className="text-sm text-gray-600 mt-1">Marca los items encontrados e ingresa las cantidades</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                          Seleccionar
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Categoría
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unidad
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                          Cantidad
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notas
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {counts.map((count) => (
                        <tr
                          key={count.item_id}
                          className={`${count.selected ? 'bg-cyan-50' : 'hover:bg-gray-50'} transition-colors`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={count.selected}
                              onChange={() => handleToggleItem(count.item_id)}
                              className="h-5 w-5 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded cursor-pointer"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{count.item.name}</div>
                            {count.item.description && (
                              <div className="text-xs text-gray-500">{count.item.description}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                              {count.item.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {count.item.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              value={count.quantity || ''}
                              onChange={(e) => handleUpdateQuantity(count.item_id, parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              placeholder="0"
                              disabled={!count.selected}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={count.notes}
                              onChange={(e) => handleUpdateNotes(count.item_id, e.target.value)}
                              placeholder="Notas opcionales"
                              disabled={!count.selected}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{selectedCount}</span> items seleccionados de <span className="font-medium">{counts.length}</span> totales
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || selectedCount === 0}
                      className="px-6 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {isLoading ? 'Guardando...' : `Guardar Conteo (${selectedCount} items)`}
                    </button>
                  </div>
                </div>
              </div>

            </form>
          )}

        </div>
      </main>
    </div>
  );
};

export default InventarioCount;
