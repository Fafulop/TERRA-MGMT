import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  useKits,
  useKit,
  useCreateKit,
  useUpdateKit,
  useDeleteKit,
  useAdjustKitStock,
  Kit,
  KitItem,
  KitFormData,
} from '../hooks/useEcommerceKits';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

// Fetch products from produccion
const useProducts = () => {
  return useQuery({
    queryKey: ['produccion-products'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/produccion/products`, { headers: getHeaders() });
      return res.data;
    },
  });
};

// Fetch esmalte colors
const useEsmalteColors = () => {
  return useQuery({
    queryKey: ['produccion-esmalte-colors'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/produccion/esmalte-color`, { headers: getHeaders() });
      return res.data;
    },
  });
};

const Ecommerce: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState<'kits'>('kits');
  const [showKitForm, setShowKitForm] = useState(false);
  const [editingKit, setEditingKit] = useState<Kit | null>(null);
  const [viewingKit, setViewingKit] = useState<Kit | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockAdjustment, setStockAdjustment] = useState(0);
  const [stockKitId, setStockKitId] = useState<number | null>(null);

  // Kit form state
  const [kitFormData, setKitFormData] = useState<KitFormData>({
    name: '',
    description: '',
    sku: '',
    price: 0,
    min_stock: 0,
    max_stock: 100,
    is_active: true,
    items: [],
  });

  // Queries
  const { data: kits = [], isLoading: kitsLoading } = useKits();
  const { data: kitDetails } = useKit(viewingKit?.id);
  const { data: products = [] } = useProducts();
  const { data: esmalteColors = [] } = useEsmalteColors();

  // Mutations
  const createKitMutation = useCreateKit();
  const updateKitMutation = useUpdateKit();
  const deleteKitMutation = useDeleteKit();
  const adjustStockMutation = useAdjustKitStock();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to continue</h1>
          <a href="/login" className="text-blue-600 hover:text-blue-800">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  const resetKitForm = () => {
    setKitFormData({
      name: '',
      description: '',
      sku: '',
      price: 0,
      min_stock: 0,
      max_stock: 100,
      is_active: true,
      items: [],
    });
    setEditingKit(null);
  };

  const openEditKit = (kit: Kit) => {
    setEditingKit(kit);
    setKitFormData({
      name: kit.name,
      description: kit.description || '',
      sku: kit.sku || '',
      price: kit.price,
      min_stock: kit.min_stock,
      max_stock: kit.max_stock,
      is_active: kit.is_active,
      items: kit.items || [],
    });
    setShowKitForm(true);
  };

  const handleSubmitKit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (kitFormData.items.length === 0) {
      alert('Agrega al menos un producto al kit');
      return;
    }

    try {
      if (editingKit) {
        await updateKitMutation.mutateAsync({ id: editingKit.id, data: kitFormData });
      } else {
        await createKitMutation.mutateAsync(kitFormData);
      }
      setShowKitForm(false);
      resetKitForm();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al guardar kit');
    }
  };

  const handleDeleteKit = async (kit: Kit) => {
    if (!confirm(`¿Eliminar el kit "${kit.name}"?`)) return;

    try {
      await deleteKitMutation.mutateAsync(kit.id);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar kit');
    }
  };

  const addKitItem = () => {
    setKitFormData({
      ...kitFormData,
      items: [...kitFormData.items, { product_id: 0, quantity: 1, esmalte_color_id: null }],
    });
  };

  const removeKitItem = (index: number) => {
    setKitFormData({
      ...kitFormData,
      items: kitFormData.items.filter((_, i) => i !== index),
    });
  };

  const updateKitItem = (index: number, field: keyof KitItem, value: any) => {
    const newItems = [...kitFormData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setKitFormData({ ...kitFormData, items: newItems });
  };

  const handleAdjustStock = async () => {
    if (!stockKitId || stockAdjustment === 0) return;

    try {
      await adjustStockMutation.mutateAsync({ id: stockKitId, adjustment: stockAdjustment });
      setShowStockModal(false);
      setStockAdjustment(0);
      setStockKitId(null);
    } catch (error: any) {
      alert(error.response?.data?.details || error.response?.data?.error || 'Error al ajustar stock');
    }
  };

  const openStockModal = (kit: Kit) => {
    setStockKitId(kit.id);
    setStockAdjustment(0);
    setShowStockModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-500 hover:text-gray-700 text-sm sm:text-base"
              >
                ← Back
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Ecommerce</h1>
            </div>
            {activeTab === 'kits' && (
              <button
                onClick={() => {
                  resetKitForm();
                  setShowKitForm(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm sm:text-base w-full sm:w-auto"
              >
                + Nuevo Kit
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="mb-4 sm:mb-6">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="-mb-px flex space-x-4 sm:space-x-8">
              <button
                onClick={() => setActiveTab('kits')}
                className={`${
                  activeTab === 'kits'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm`}
              >
                KITS
              </button>
            </nav>
          </div>
        </div>

        {/* KITS Tab Content */}
        {activeTab === 'kits' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {kitsLoading ? (
              <div className="p-8 text-center text-gray-500">Cargando...</div>
            ) : kits.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No hay kits creados. Crea uno nuevo para comenzar.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">SKU</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Productos</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Estado</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {kits.map((kit) => (
                      <tr
                        key={kit.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setViewingKit(kit)}
                      >
                        <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">{kit.name}</td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">{kit.sku || '-'}</td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">${Number(kit.price).toFixed(2)}</td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 hidden md:table-cell">
                          {kit.items_count} items ({kit.total_products} pzs)
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm">
                          <span className={`font-semibold ${
                            kit.current_stock < kit.min_stock ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {kit.current_stock}
                          </span>
                          <span className="text-gray-400 text-xs ml-1">
                            ({kit.min_stock}-{kit.max_stock})
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm hidden lg:table-cell">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            kit.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {kit.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm font-medium space-x-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openStockModal(kit)}
                            className="text-green-600 hover:text-green-900"
                            title="Ajustar Stock"
                          >
                            Stock
                          </button>
                          <button
                            onClick={() => openEditKit(kit)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteKit(kit)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Kit Form Modal */}
      {showKitForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingKit ? 'Editar Kit' : 'Nuevo Kit'}
              </h2>

              <form onSubmit={handleSubmitKit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre del Kit *</label>
                    <input
                      type="text"
                      value={kitFormData.name}
                      onChange={(e) => setKitFormData({ ...kitFormData, name: e.target.value })}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">SKU</label>
                    <input
                      type="text"
                      value={kitFormData.sku}
                      onChange={(e) => setKitFormData({ ...kitFormData, sku: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripcion</label>
                  <textarea
                    value={kitFormData.description}
                    onChange={(e) => setKitFormData({ ...kitFormData, description: e.target.value })}
                    rows={2}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Precio *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={kitFormData.price}
                      onChange={(e) => setKitFormData({ ...kitFormData, price: Number(e.target.value) })}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stock Min</label>
                    <input
                      type="number"
                      value={kitFormData.min_stock}
                      onChange={(e) => setKitFormData({ ...kitFormData, min_stock: Number(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stock Max</label>
                    <input
                      type="number"
                      value={kitFormData.max_stock}
                      onChange={(e) => setKitFormData({ ...kitFormData, max_stock: Number(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={kitFormData.is_active}
                        onChange={(e) => setKitFormData({ ...kitFormData, is_active: e.target.checked })}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Activo</span>
                    </label>
                  </div>
                </div>

                {/* Kit Items */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-700">Productos del Kit</h3>
                    <button
                      type="button"
                      onClick={addKitItem}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      + Agregar Producto
                    </button>
                  </div>

                  {editingKit && editingKit.current_stock > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
                      <p className="text-sm text-yellow-800">
                        <strong>Nota:</strong> No se pueden modificar los productos del kit porque tiene stock existente ({editingKit.current_stock} unidades).
                      </p>
                    </div>
                  )}

                  {kitFormData.items.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No hay productos. Agrega al menos uno.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {kitFormData.items.map((item, index) => (
                        <div key={index} className="flex flex-wrap gap-2 items-center p-3 bg-gray-50 rounded-md">
                          <select
                            value={item.product_id}
                            onChange={(e) => updateKitItem(index, 'product_id', Number(e.target.value))}
                            required
                            disabled={editingKit && editingKit.current_stock > 0}
                            className="flex-1 min-w-[200px] border border-gray-300 rounded-md py-2 px-3 text-sm"
                          >
                            <option value={0}>Seleccionar producto...</option>
                            {products.map((p: any) => (
                              <option key={p.id} value={p.id}>
                                {p.name} - {p.tipo_name}
                              </option>
                            ))}
                          </select>
                          <select
                            value={item.esmalte_color_id || ''}
                            onChange={(e) => updateKitItem(index, 'esmalte_color_id', e.target.value ? Number(e.target.value) : null)}
                            disabled={editingKit && editingKit.current_stock > 0}
                            className="w-32 border border-gray-300 rounded-md py-2 px-3 text-sm"
                          >
                            <option value="">Sin color</option>
                            {esmalteColors.map((c: any) => (
                              <option key={c.id} value={c.id}>{c.color}</option>
                            ))}
                          </select>
                          <div className="flex items-center gap-1">
                            <label className="text-sm text-gray-500">Cant:</label>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => updateKitItem(index, 'quantity', Number(e.target.value))}
                              disabled={editingKit && editingKit.current_stock > 0}
                              className="w-16 border border-gray-300 rounded-md py-2 px-2 text-sm text-center"
                            />
                          </div>
                          {(!editingKit || editingKit.current_stock === 0) && (
                            <button
                              type="button"
                              onClick={() => removeKitItem(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowKitForm(false);
                      resetKitForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createKitMutation.isPending || updateKitMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {editingKit ? 'Actualizar' : 'Crear'} Kit
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Kit Modal */}
      {viewingKit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{viewingKit.name}</h2>
                  {viewingKit.sku && <p className="text-gray-500">SKU: {viewingKit.sku}</p>}
                </div>
                <button
                  onClick={() => setViewingKit(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {viewingKit.description && (
                <p className="text-gray-600 mb-4">{viewingKit.description}</p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-xs text-gray-500">Precio</p>
                  <p className="text-lg font-bold text-green-600">${Number(viewingKit.price).toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-xs text-gray-500">Stock Actual</p>
                  <p className={`text-lg font-bold ${viewingKit.current_stock < viewingKit.min_stock ? 'text-red-600' : 'text-gray-900'}`}>
                    {viewingKit.current_stock}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-xs text-gray-500">Stock Min/Max</p>
                  <p className="text-lg font-bold text-gray-900">{viewingKit.min_stock} / {viewingKit.max_stock}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-xs text-gray-500">Estado</p>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    viewingKit.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {viewingKit.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-700 mb-3">Productos del Kit</h3>
                {kitDetails?.items && kitDetails.items.length > 0 ? (
                  <div className="space-y-2">
                    {kitDetails.items.map((item: KitItem) => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center gap-3">
                          {item.esmalte_hex_code && (
                            <div
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: item.esmalte_hex_code }}
                            />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{item.product_name}</p>
                            <p className="text-xs text-gray-500">
                              {item.tipo_name}
                              {item.esmalte_color && ` - ${item.esmalte_color}`}
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold text-gray-700">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Cargando productos...</p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 mt-4 border-t">
                <button
                  onClick={() => setViewingKit(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    openStockModal(viewingKit);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Ajustar Stock
                </button>
                <button
                  onClick={() => {
                    openEditKit(viewingKit);
                    setViewingKit(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Editar Kit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Ajustar Stock del Kit</h2>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Al aumentar el stock, se reservara inventario de productos ESMALTADO.
                  Al reducir, se liberara el inventario reservado.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ajuste (positivo para agregar, negativo para quitar)
                </label>
                <input
                  type="number"
                  value={stockAdjustment}
                  onChange={(e) => setStockAdjustment(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-lg text-center"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowStockModal(false);
                    setStockAdjustment(0);
                    setStockKitId(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAdjustStock}
                  disabled={stockAdjustment === 0 || adjustStockMutation.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {adjustStockMutation.isPending ? 'Procesando...' : 'Aplicar Ajuste'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ecommerce;
