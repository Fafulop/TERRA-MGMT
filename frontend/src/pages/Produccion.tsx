import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Product, ProductFormData, Tipo, Size, Capacity, EsmalteColor } from '../types/produccion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Produccion: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'products' | 'masterdata'>('products');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [selectedStage, setSelectedStage] = useState<'CRUDO' | 'SANCOCHADO' | 'ESMALTADO'>('CRUDO');

  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  // Fetch data
  const { data: products = [] } = useQuery({
    queryKey: ['produccion-products'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/produccion/products`, { headers: getHeaders() });
      return res.data;
    }
  });

  const { data: tipos = [] } = useQuery({
    queryKey: ['produccion-tipos'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/produccion/tipo`, { headers: getHeaders() });
      return res.data;
    }
  });

  const { data: sizes = [] } = useQuery({
    queryKey: ['produccion-sizes'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/produccion/size`, { headers: getHeaders() });
      return res.data;
    }
  });

  const { data: capacities = [] } = useQuery({
    queryKey: ['produccion-capacities'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/produccion/capacity`, { headers: getHeaders() });
      return res.data;
    }
  });

  const { data: esmalteColors = [] } = useQuery({
    queryKey: ['produccion-esmalte-colors'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/produccion/esmalte-color`, { headers: getHeaders() });
      return res.data;
    }
  });

  // Product mutations
  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      await axios.post(`${API_URL}/produccion/products`, data, { headers: getHeaders() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produccion-products'] });
      setShowProductForm(false);
      setEditingProduct(null);
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ProductFormData }) => {
      await axios.put(`${API_URL}/produccion/products/${id}`, data, { headers: getHeaders() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produccion-products'] });
      setShowProductForm(false);
      setEditingProduct(null);
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`${API_URL}/produccion/products/${id}`, { headers: getHeaders() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produccion-products'] });
    }
  });

  const handleSubmitProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data: any = {
      name: formData.get('name') as string,
      stage: formData.get('stage') as string,
      tipo_id: Number(formData.get('tipo_id'))
    };

    // Add optional fields only if they have values
    if (formData.get('size_id')) data.size_id = Number(formData.get('size_id'));
    if (formData.get('capacity_id')) data.capacity_id = Number(formData.get('capacity_id'));
    if (formData.get('esmalte_color_id')) data.esmalte_color_id = Number(formData.get('esmalte_color_id'));
    if (formData.get('peso_crudo')) data.peso_crudo = Number(formData.get('peso_crudo'));
    if (formData.get('peso_esmaltado')) data.peso_esmaltado = Number(formData.get('peso_esmaltado'));
    if (formData.get('costo_pasta')) data.costo_pasta = Number(formData.get('costo_pasta'));
    if (formData.get('costo_mano_obra')) data.costo_mano_obra = Number(formData.get('costo_mano_obra'));
    if (formData.get('cantidad_esmalte')) data.cantidad_esmalte = Number(formData.get('cantidad_esmalte'));
    if (formData.get('costo_esmalte')) data.costo_esmalte = Number(formData.get('costo_esmalte'));
    if (formData.get('costo_horneado')) data.costo_horneado = Number(formData.get('costo_horneado'));
    if (formData.get('notes')) data.notes = formData.get('notes') as string;

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data });
    } else {
      createProductMutation.mutate(data);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Producción</h1>
            </div>
            {activeTab === 'products' && (
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setSelectedStage('CRUDO');
                  setShowProductForm(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                + Nuevo Producto
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('products')}
                className={`${
                  activeTab === 'products'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Productos
              </button>
              <button
                onClick={() => setActiveTab('masterdata')}
                className={`${
                  activeTab === 'masterdata'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Datos Maestros
              </button>
            </nav>
          </div>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {products.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No hay productos. Crea uno nuevo para comenzar.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Etapa</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tamaño (CM)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacidad (ML)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color Esmalte</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Peso Crudo (g)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product: Product) => (
                      <tr
                        key={product.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setViewingProduct(product)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            product.stage === 'CRUDO' ? 'bg-yellow-100 text-yellow-800' :
                            product.stage === 'SANCOCHADO' ? 'bg-orange-100 text-orange-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {product.stage}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.tipo_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.size_cm || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.capacity_ml || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            {product.esmalte_hex_code && (
                              <div
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: product.esmalte_hex_code }}
                              />
                            )}
                            {product.esmalte_color || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.peso_crudo || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setEditingProduct(product);
                              setSelectedStage(product.stage || 'CRUDO');
                              setShowProductForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('¿Eliminar este producto?')) {
                                deleteProductMutation.mutate(product.id);
                              }
                            }}
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

        {/* Master Data Tab */}
        {activeTab === 'masterdata' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MasterDataSection
              title="Tipos"
              items={tipos}
              onAdd={(name) => {
                axios.post(`${API_URL}/produccion/tipo`, { name }, { headers: getHeaders() })
                  .then(() => queryClient.invalidateQueries({ queryKey: ['produccion-tipos'] }));
              }}
              onDelete={(id) => {
                axios.delete(`${API_URL}/produccion/tipo/${id}`, { headers: getHeaders() })
                  .then(() => queryClient.invalidateQueries({ queryKey: ['produccion-tipos'] }));
              }}
              displayKey="name"
            />
            <MasterDataSection
              title="Tamaños (CM)"
              items={sizes}
              onAdd={(value) => {
                axios.post(`${API_URL}/produccion/size`, { size_cm: Number(value) }, { headers: getHeaders() })
                  .then(() => queryClient.invalidateQueries({ queryKey: ['produccion-sizes'] }));
              }}
              onDelete={(id) => {
                axios.delete(`${API_URL}/produccion/size/${id}`, { headers: getHeaders() })
                  .then(() => queryClient.invalidateQueries({ queryKey: ['produccion-sizes'] }));
              }}
              displayKey="size_cm"
              inputType="number"
            />
            <MasterDataSection
              title="Capacidades (ML)"
              items={capacities}
              onAdd={(value) => {
                axios.post(`${API_URL}/produccion/capacity`, { capacity_ml: Number(value) }, { headers: getHeaders() })
                  .then(() => queryClient.invalidateQueries({ queryKey: ['produccion-capacities'] }));
              }}
              onDelete={(id) => {
                axios.delete(`${API_URL}/produccion/capacity/${id}`, { headers: getHeaders() })
                  .then(() => queryClient.invalidateQueries({ queryKey: ['produccion-capacities'] }));
              }}
              displayKey="capacity_ml"
              inputType="number"
            />
            <MasterDataSection
              title="Colores de Esmalte"
              items={esmalteColors}
              onAdd={(value) => {
                axios.post(`${API_URL}/produccion/esmalte-color`, { color: value }, { headers: getHeaders() })
                  .then(() => queryClient.invalidateQueries({ queryKey: ['produccion-esmalte-colors'] }));
              }}
              onDelete={(id) => {
                axios.delete(`${API_URL}/produccion/esmalte-color/${id}`, { headers: getHeaders() })
                  .then(() => queryClient.invalidateQueries({ queryKey: ['produccion-esmalte-colors'] }));
              }}
              displayKey="color"
            />
          </div>
        )}
      </main>

      {/* Product Form Modal */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <form onSubmit={handleSubmitProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre del Producto *</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingProduct?.name}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Etapa *</label>
                    <select
                      name="stage"
                      value={selectedStage}
                      onChange={(e) => setSelectedStage(e.target.value as 'CRUDO' | 'SANCOCHADO' | 'ESMALTADO')}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    >
                      <option value="CRUDO">CRUDO</option>
                      <option value="SANCOCHADO">SANCOCHADO</option>
                      <option value="ESMALTADO">ESMALTADO</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo *</label>
                    <select
                      name="tipo_id"
                      defaultValue={editingProduct?.tipo_id}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    >
                      <option value="">Seleccionar...</option>
                      {tipos.map((tipo: Tipo) => (
                        <option key={tipo.id} value={tipo.id}>{tipo.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tamaño (CM)</label>
                    <select
                      name="size_id"
                      defaultValue={editingProduct?.size_id}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    >
                      <option value="">Seleccionar...</option>
                      {sizes.map((size: Size) => (
                        <option key={size.id} value={size.id}>{size.size_cm} cm</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Capacidad (ML)</label>
                    <select
                      name="capacity_id"
                      defaultValue={editingProduct?.capacity_id}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    >
                      <option value="">Seleccionar...</option>
                      {capacities.map((capacity: Capacity) => (
                        <option key={capacity.id} value={capacity.id}>{capacity.capacity_ml} ml</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Color Esmalte {selectedStage !== 'ESMALTADO' && <span className="text-xs text-gray-500">(solo disponible para ESMALTADO)</span>}
                  </label>
                  <select
                    name="esmalte_color_id"
                    defaultValue={editingProduct?.esmalte_color_id}
                    disabled={selectedStage !== 'ESMALTADO'}
                    className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 ${selectedStage !== 'ESMALTADO' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  >
                    <option value="">Seleccionar...</option>
                    {esmalteColors.map((color: EsmalteColor) => (
                      <option key={color.id} value={color.id}>{color.color}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Peso en Crudo (g)</label>
                    <input
                      type="number"
                      name="peso_crudo"
                      step="0.01"
                      defaultValue={editingProduct?.peso_crudo}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Peso Esmaltado (g)</label>
                    <input
                      type="number"
                      name="peso_esmaltado"
                      step="0.01"
                      defaultValue={editingProduct?.peso_esmaltado}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Costo Pasta (MXN)</label>
                    <input
                      type="number"
                      name="costo_pasta"
                      step="0.01"
                      defaultValue={editingProduct?.costo_pasta}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Costo Mano de Obra (MXN)</label>
                    <input
                      type="number"
                      name="costo_mano_obra"
                      step="0.01"
                      defaultValue={editingProduct?.costo_mano_obra}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cantidad Esmalte (g)</label>
                    <input
                      type="number"
                      name="cantidad_esmalte"
                      step="0.01"
                      defaultValue={editingProduct?.cantidad_esmalte}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Costo Esmalte (MXN)</label>
                    <input
                      type="number"
                      name="costo_esmalte"
                      step="0.01"
                      defaultValue={editingProduct?.costo_esmalte}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Costo Horneado (MXN)</label>
                    <input
                      type="number"
                      name="costo_horneado"
                      step="0.01"
                      defaultValue={editingProduct?.costo_horneado}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <textarea
                    name="notes"
                    defaultValue={editingProduct?.notes}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductForm(false);
                      setEditingProduct(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingProduct ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Product Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Detalles del Producto</h2>
                <button
                  onClick={() => setViewingProduct(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Nombre del Producto</label>
                    <p className="text-lg font-semibold text-gray-900">{viewingProduct.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Etapa</label>
                    <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
                      viewingProduct.stage === 'CRUDO' ? 'bg-yellow-100 text-yellow-800' :
                      viewingProduct.stage === 'SANCOCHADO' ? 'bg-orange-100 text-orange-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {viewingProduct.stage}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Tipo</label>
                    <p className="text-lg font-semibold text-gray-900">{viewingProduct.tipo_name}</p>
                  </div>
                </div>

                {/* Dimensions & Specs */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Especificaciones</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Tamaño (CM)</label>
                      <p className="text-gray-900">{viewingProduct.size_cm ? `${viewingProduct.size_cm} cm` : '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Capacidad (ML)</label>
                      <p className="text-gray-900">{viewingProduct.capacity_ml ? `${viewingProduct.capacity_ml} ml` : '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Color Esmalte</label>
                      <div className="flex items-center gap-2">
                        {viewingProduct.esmalte_hex_code && (
                          <div
                            className="w-5 h-5 rounded-full border-2 border-gray-300"
                            style={{ backgroundColor: viewingProduct.esmalte_hex_code }}
                          />
                        )}
                        <p className="text-gray-900">{viewingProduct.esmalte_color || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Production Details */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Detalles de Producción</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Peso en Crudo (g)</label>
                      <p className="text-gray-900">{viewingProduct.peso_crudo ? `${viewingProduct.peso_crudo} g` : '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Peso Esmaltado (g)</label>
                      <p className="text-gray-900">{viewingProduct.peso_esmaltado ? `${viewingProduct.peso_esmaltado} g` : '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Cantidad Esmalte (g)</label>
                      <p className="text-gray-900">{viewingProduct.cantidad_esmalte ? `${viewingProduct.cantidad_esmalte} g` : '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Costs */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Costos (MXN)</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Pasta</label>
                      <p className="text-gray-900">{viewingProduct.costo_pasta ? `$${Number(viewingProduct.costo_pasta).toFixed(2)}` : '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Mano de Obra</label>
                      <p className="text-gray-900">{viewingProduct.costo_mano_obra ? `$${Number(viewingProduct.costo_mano_obra).toFixed(2)}` : '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Esmalte</label>
                      <p className="text-gray-900">{viewingProduct.costo_esmalte ? `$${Number(viewingProduct.costo_esmalte).toFixed(2)}` : '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Horneado</label>
                      <p className="text-gray-900">{viewingProduct.costo_horneado ? `$${Number(viewingProduct.costo_horneado).toFixed(2)}` : '-'}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <label className="block text-sm font-medium text-gray-500 mb-1">Costo Total</label>
                    <p className="text-2xl font-bold text-green-600">
                      ${(Number(viewingProduct.costo_pasta || 0) + Number(viewingProduct.costo_mano_obra || 0) + Number(viewingProduct.costo_esmalte || 0) + Number(viewingProduct.costo_horneado || 0)).toFixed(2)} MXN
                    </p>
                  </div>
                </div>

                {/* Description */}
                {viewingProduct.notes && (
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-500 mb-1">Descripción</label>
                    <p className="text-gray-900 whitespace-pre-wrap">{viewingProduct.notes}</p>
                  </div>
                )}

                {/* Metadata */}
                <div className="border-t pt-4 text-xs text-gray-500">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Creado por:</span> {viewingProduct.created_by_name}
                    </div>
                    <div>
                      <span className="font-medium">Fecha de creación:</span> {new Date(viewingProduct.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
                <button
                  onClick={() => setViewingProduct(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    setEditingProduct(viewingProduct);
                    setSelectedStage(viewingProduct.stage || 'CRUDO');
                    setViewingProduct(null);
                    setShowProductForm(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Editar Producto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Master Data Section Component
interface MasterDataSectionProps {
  title: string;
  items: any[];
  onAdd: (value: string) => void;
  onDelete: (id: number) => void;
  displayKey: string;
  inputType?: 'text' | 'number';
}

const MasterDataSection: React.FC<MasterDataSectionProps> = ({
  title,
  items,
  onAdd,
  onDelete,
  displayKey,
  inputType = 'text'
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="flex gap-2 mb-4">
        <input
          type={inputType}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          className="flex-1 border border-gray-300 rounded-md px-3 py-2"
          placeholder={`Nuevo ${title.toLowerCase()}...`}
        />
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Agregar
        </button>
      </div>
      <ul className="space-y-2 max-h-64 overflow-y-auto">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span>{item[displayKey]}</span>
            <button
              onClick={() => {
                if (confirm('¿Eliminar este elemento?')) {
                  onDelete(item.id);
                }
              }}
              className="text-red-600 hover:text-red-900 text-sm"
            >
              Eliminar
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-gray-500 text-sm text-center py-4">No hay elementos</li>
        )}
      </ul>
    </div>
  );
};

export default Produccion;
