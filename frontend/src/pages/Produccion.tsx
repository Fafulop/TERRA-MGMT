import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Product,
  ProductFormData,
  Tipo,
  Size,
  Capacity,
  EsmalteColor,
  InventoryRecord,
  InventoryMovement,
  CrudoInputFormData,
  SanchoProcessFormData,
  EsmaltadoProcessFormData,
  AdjustmentFormData,
  MermaFormData
} from '../types/produccion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Produccion: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'products' | 'inventory' | 'embalaje' | 'masterdata'>('products');

  // Check URL parameter on mount to set initial tab
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'inventory') {
      setActiveTab('inventory');
    } else if (tab === 'embalaje') {
      setActiveTab('embalaje');
    } else if (tab === 'masterdata') {
      setActiveTab('masterdata');
    } else if (tab === 'products') {
      setActiveTab('products');
    }
  }, [searchParams]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  // Inventory states
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [inventoryFormType, setInventoryFormType] = useState<'crudo' | 'sancochado' | 'esmaltado' | 'adjustment' | 'merma'>('crudo');
  const [isMovementsCollapsed, setIsMovementsCollapsed] = useState(true);
  const [visibleMovements, setVisibleMovements] = useState(10);
  const [inventoryItems, setInventoryItems] = useState<Array<{
    product_id: string;
    quantity: string;
    stage?: string;
    esmalte_color_id?: string;
    notes?: string;
  }>>([{ product_id: '', quantity: '', notes: '' }]);

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

  // Inventory queries
  const { data: inventory = [] } = useQuery({
    queryKey: ['produccion-inventory'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/produccion/inventory`, { headers: getHeaders() });
      return res.data;
    }
  });

  const { data: movements = [] } = useQuery({
    queryKey: ['produccion-inventory-movements'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/produccion/inventory/movements`, { headers: getHeaders() });
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

  // Inventory mutations
  const crudoInputMutation = useMutation({
    mutationFn: async (items: CrudoInputFormData[]) => {
      await Promise.all(
        items.map(data => axios.post(`${API_URL}/produccion/inventory/crudo-input`, data, { headers: getHeaders() }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produccion-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['produccion-inventory-movements'] });
      setShowInventoryForm(false);
      setInventoryItems([{ product_id: '', quantity: '', notes: '' }]);
    },
    onError: (error: any) => {
      const errorData = error.response?.data;
      if (errorData?.details) {
        const { product_name, stage, available, requested, missing } = errorData.details;
        alert(
          `❌ ${errorData.error}\n\n` +
          `Producto: ${product_name}\n` +
          `Etapa: ${stage}\n\n` +
          `Disponible: ${available}\n` +
          `Solicitado: ${requested}\n` +
          `Faltante: ${missing}`
        );
      } else {
        alert(errorData?.error || 'Error al procesar la operación');
      }
    }
  });

  const sanchoProcessMutation = useMutation({
    mutationFn: async (items: SanchoProcessFormData[]) => {
      await Promise.all(
        items.map(data => axios.post(`${API_URL}/produccion/inventory/sancochado-process`, data, { headers: getHeaders() }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produccion-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['produccion-inventory-movements'] });
      setShowInventoryForm(false);
      setInventoryItems([{ product_id: '', quantity: '', notes: '' }]);
    },
    onError: (error: any) => {
      const errorData = error.response?.data;
      if (errorData?.details) {
        const { product_name, stage, available, requested, missing } = errorData.details;
        alert(
          `❌ ${errorData.error}\n\n` +
          `Producto: ${product_name}\n` +
          `Etapa: ${stage}\n\n` +
          `Disponible: ${available}\n` +
          `Solicitado: ${requested}\n` +
          `Faltante: ${missing}`
        );
      } else {
        alert(errorData?.error || 'Error al procesar la operación');
      }
    }
  });

  const esmaltadoProcessMutation = useMutation({
    mutationFn: async (items: EsmaltadoProcessFormData[]) => {
      await Promise.all(
        items.map(data => axios.post(`${API_URL}/produccion/inventory/esmaltado-process`, data, { headers: getHeaders() }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produccion-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['produccion-inventory-movements'] });
      setShowInventoryForm(false);
      setInventoryItems([{ product_id: '', quantity: '', notes: '' }]);
    },
    onError: (error: any) => {
      const errorData = error.response?.data;
      if (errorData?.details) {
        const { product_name, stage, available, requested, missing } = errorData.details;
        alert(
          `❌ ${errorData.error}\n\n` +
          `Producto: ${product_name}\n` +
          `Etapa: ${stage}\n\n` +
          `Disponible: ${available}\n` +
          `Solicitado: ${requested}\n` +
          `Faltante: ${missing}`
        );
      } else {
        alert(errorData?.error || 'Error al procesar la operación');
      }
    }
  });

  const adjustmentMutation = useMutation({
    mutationFn: async (items: AdjustmentFormData[]) => {
      await Promise.all(
        items.map(data => axios.post(`${API_URL}/produccion/inventory/adjustment`, data, { headers: getHeaders() }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produccion-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['produccion-inventory-movements'] });
      setShowInventoryForm(false);
      setInventoryItems([{ product_id: '', quantity: '', notes: '' }]);
    },
    onError: (error: any) => {
      const errorData = error.response?.data;
      if (errorData?.details) {
        const { product_name, stage, available, requested, missing } = errorData.details;
        alert(
          `❌ ${errorData.error}\n\n` +
          `Producto: ${product_name}\n` +
          `Etapa: ${stage}\n\n` +
          `Disponible: ${available}\n` +
          `Solicitado: ${requested}\n` +
          `Faltante: ${missing}`
        );
      } else {
        alert(errorData?.error || 'Error al procesar la operación');
      }
    }
  });

  const mermaMutation = useMutation({
    mutationFn: async (items: MermaFormData[]) => {
      await Promise.all(
        items.map(data => axios.post(`${API_URL}/produccion/inventory/merma`, data, { headers: getHeaders() }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produccion-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['produccion-inventory-movements'] });
      setShowInventoryForm(false);
      setInventoryItems([{ product_id: '', quantity: '', notes: '' }]);
    },
    onError: (error: any) => {
      const errorData = error.response?.data;
      if (errorData?.details) {
        const { product_name, stage, available, requested, missing } = errorData.details;
        alert(
          `❌ ${errorData.error}\n\n` +
          `Producto: ${product_name}\n` +
          `Etapa: ${stage}\n\n` +
          `Disponible: ${available}\n` +
          `Solicitado: ${requested}\n` +
          `Faltante: ${missing}`
        );
      } else {
        alert(errorData?.error || 'Error al procesar la operación');
      }
    }
  });

  const handleSubmitProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data: any = {
      name: formData.get('name') as string,
      stage: 'CRUDO',
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
    if (formData.get('costo_h_sancocho')) data.costo_h_sancocho = Number(formData.get('costo_h_sancocho'));
    if (formData.get('notes')) data.notes = formData.get('notes') as string;

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data });
    } else {
      createProductMutation.mutate(data);
    }
  };

  const handleSubmitInventoryForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Filter out empty rows
    const validItems = inventoryItems.filter(item => item.product_id && item.quantity);

    if (validItems.length === 0) {
      alert('Por favor agrega al menos un producto');
      return;
    }

    if (inventoryFormType === 'crudo') {
      const items: CrudoInputFormData[] = validItems.map(item => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
        notes: item.notes
      }));
      crudoInputMutation.mutate(items);
    } else if (inventoryFormType === 'sancochado') {
      const items: SanchoProcessFormData[] = validItems.map(item => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
        notes: item.notes
      }));
      sanchoProcessMutation.mutate(items);
    } else if (inventoryFormType === 'esmaltado') {
      const items: EsmaltadoProcessFormData[] = validItems.map(item => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
        esmalte_color_id: Number(item.esmalte_color_id),
        notes: item.notes
      }));
      esmaltadoProcessMutation.mutate(items);
    } else if (inventoryFormType === 'adjustment') {
      const items: AdjustmentFormData[] = validItems.map(item => ({
        product_id: Number(item.product_id),
        stage: item.stage as 'CRUDO' | 'SANCOCHADO' | 'ESMALTADO',
        esmalte_color_id: item.esmalte_color_id ? Number(item.esmalte_color_id) : undefined,
        quantity: Number(item.quantity),
        notes: item.notes
      }));
      adjustmentMutation.mutate(items);
    } else if (inventoryFormType === 'merma') {
      const items: MermaFormData[] = validItems.map(item => ({
        product_id: Number(item.product_id),
        stage: item.stage as 'CRUDO' | 'SANCOCHADO' | 'ESMALTADO',
        esmalte_color_id: item.esmalte_color_id ? Number(item.esmalte_color_id) : undefined,
        quantity: Number(item.quantity),
        notes: item.notes
      }));
      mermaMutation.mutate(items);
    }
  };

  const addInventoryRow = () => {
    setInventoryItems([...inventoryItems, { product_id: '', quantity: '', notes: '' }]);
  };

  const removeInventoryRow = (index: number) => {
    if (inventoryItems.length > 1) {
      setInventoryItems(inventoryItems.filter((_, i) => i !== index));
    }
  };

  const updateInventoryRow = (index: number, field: string, value: string) => {
    const newItems = [...inventoryItems];
    newItems[index] = { ...newItems[index], [field]: value };

    // If changing product in esmaltado mode, clear the color selection
    // so user can select from available colors for the new product
    if (field === 'product_id' && inventoryFormType === 'esmaltado') {
      newItems[index].esmalte_color_id = '';
    }

    setInventoryItems(newItems);
  };

  const getAvailableProducts = (currentIndex: number) => {
    // For esmaltado, adjustment, and merma forms, allow same product multiple times (blocking is at combination level)
    if (inventoryFormType === 'esmaltado' || inventoryFormType === 'adjustment' || inventoryFormType === 'merma') {
      return products;
    }

    // For other forms, block already selected products
    const selectedProductIds = inventoryItems
      .map((item, idx) => idx !== currentIndex ? item.product_id : null)
      .filter(id => id !== null && id !== '');

    return products.filter(product => !selectedProductIds.includes(product.id.toString()));
  };

  const getAvailableColors = (currentIndex: number) => {
    // Filter colors for esmaltado form type (product + color combination)
    if (inventoryFormType === 'esmaltado') {
      const currentProduct = inventoryItems[currentIndex]?.product_id;

      if (!currentProduct) {
        return esmalteColors;
      }

      // Get all product+color combinations already selected (excluding current row)
      const selectedCombinations = inventoryItems
        .map((item, idx) => {
          if (idx !== currentIndex && item.product_id === currentProduct && item.esmalte_color_id) {
            return item.esmalte_color_id;
          }
          return null;
        })
        .filter(id => id !== null && id !== '');

      // Filter out colors already used for this product
      return esmalteColors.filter(color => !selectedCombinations.includes(color.id.toString()));
    }

    // Filter colors for adjustment and merma form types (product + stage + color combination)
    if (inventoryFormType === 'adjustment' || inventoryFormType === 'merma') {
      const currentProduct = inventoryItems[currentIndex]?.product_id;
      const currentStage = inventoryItems[currentIndex]?.stage;

      if (!currentProduct || !currentStage) {
        return esmalteColors;
      }

      // Get all product+stage+color combinations already selected (excluding current row)
      const selectedCombinations = inventoryItems
        .map((item, idx) => {
          if (idx !== currentIndex &&
              item.product_id === currentProduct &&
              item.stage === currentStage &&
              item.esmalte_color_id) {
            return item.esmalte_color_id;
          }
          return null;
        })
        .filter(id => id !== null && id !== '');

      // Filter out colors already used for this product+stage combination
      return esmalteColors.filter(color => !selectedCombinations.includes(color.id.toString()));
    }

    // For other forms, return all colors
    return esmalteColors;
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Producción</h1>
            </div>
            {activeTab === 'products' && (
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setShowProductForm(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm sm:text-base w-full sm:w-auto"
              >
                + Nuevo Producto
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
                onClick={() => setActiveTab('products')}
                className={`${
                  activeTab === 'products'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm`}
              >
                Productos
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`${
                  activeTab === 'inventory'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm`}
              >
                Inventario
              </button>
              <button
                onClick={() => setActiveTab('embalaje')}
                className={`${
                  activeTab === 'embalaje'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm`}
              >
                Inventario Embalaje
              </button>
              <button
                onClick={() => setActiveTab('masterdata')}
                className={`${
                  activeTab === 'masterdata'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm`}
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

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setInventoryFormType('crudo');
                  setInventoryItems([{ product_id: '', quantity: '', notes: '' }]);
                  setShowInventoryForm(true);
                }}
                className="bg-yellow-600 text-white px-4 py-3 rounded-md hover:bg-yellow-700 font-medium text-sm sm:text-base"
              >
                CRUDO
              </button>
              <button
                onClick={() => {
                  setInventoryFormType('sancochado');
                  setInventoryItems([{ product_id: '', quantity: '', notes: '' }]);
                  setShowInventoryForm(true);
                }}
                className="bg-orange-600 text-white px-4 py-3 rounded-md hover:bg-orange-700 font-medium text-sm sm:text-base"
              >
                SANCOCHADO
              </button>
              <button
                onClick={() => {
                  setInventoryFormType('esmaltado');
                  setInventoryItems([{ product_id: '', quantity: '', notes: '' }]);
                  setShowInventoryForm(true);
                }}
                className="bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 font-medium text-sm sm:text-base"
              >
                ESMALTADO
              </button>
              <button
                onClick={() => {
                  setInventoryFormType('merma');
                  setInventoryItems([{ product_id: '', quantity: '', notes: '', stage: '' }]);
                  setShowInventoryForm(true);
                }}
                className="bg-red-600 text-white px-4 py-3 rounded-md hover:bg-red-700 font-medium text-sm sm:text-base"
              >
                MERMA
              </button>
              <button
                onClick={() => {
                  setInventoryFormType('adjustment');
                  setInventoryItems([{ product_id: '', quantity: '', notes: '' }]);
                  setShowInventoryForm(true);
                }}
                className="bg-gray-600 text-white px-4 py-3 rounded-md hover:bg-gray-700 font-medium text-sm sm:text-base"
              >
                Ajuste de Inventario
              </button>
            </div>

            {/* Current Inventory */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Inventario Actual</h2>
              </div>
              {inventory.length === 0 ? (
                <div className="p-6 sm:p-8 text-center text-gray-500 text-sm sm:text-base">
                  No hay inventario. Agrega productos usando los botones arriba.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Tipo</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Etapa</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Color</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Cant.</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Apartados</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Disponibles</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Costo Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[...inventory]
                        .sort((a: InventoryRecord, b: InventoryRecord) => {
                          // Stage priority: ESMALTADO (1), SANCOCHADO (2), CRUDO (3)
                          const stagePriority: Record<string, number> = {
                            'ESMALTADO': 1,
                            'SANCOCHADO': 2,
                            'CRUDO': 3
                          };
                          const stageA = stagePriority[a.stage] || 4;
                          const stageB = stagePriority[b.stage] || 4;

                          if (stageA !== stageB) {
                            return stageA - stageB;
                          }

                          // Then by disponibles (quantity - apartados) descending
                          const disponiblesA = a.quantity - (a.apartados || 0);
                          const disponiblesB = b.quantity - (b.apartados || 0);
                          return disponiblesB - disponiblesA;
                        })
                        .map((item: InventoryRecord) => {
                        const costoTotal = (
                          Number(item.costo_pasta || 0) +
                          Number(item.costo_mano_obra || 0) +
                          Number(item.costo_esmalte || 0) +
                          Number(item.costo_horneado || 0) +
                          Number(item.costo_h_sancocho || 0)
                        ) * item.quantity;

                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">
                              {item.product_name}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 hidden sm:table-cell">
                              {item.tipo_name}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                item.stage === 'CRUDO' ? 'bg-yellow-100 text-yellow-800' :
                                item.stage === 'SANCOCHADO' ? 'bg-orange-100 text-orange-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {item.stage}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 hidden lg:table-cell">
                              {item.esmalte_color ? (
                                <div className="flex items-center gap-2">
                                  {item.esmalte_hex_code && (
                                    <div
                                      className="w-4 h-4 rounded-full border border-gray-300"
                                      style={{ backgroundColor: item.esmalte_hex_code }}
                                    />
                                  )}
                                  {item.esmalte_color}
                                </div>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900">
                              {item.quantity}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 hidden md:table-cell">
                              {item.apartados || 0}
                            </td>
                            <td className={`px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold hidden md:table-cell ${
                              (item.quantity - (item.apartados || 0)) < 0 ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {item.quantity - (item.apartados || 0)}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 hidden lg:table-cell">
                              ${costoTotal.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Movements */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div
                className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 flex justify-between items-center"
                onClick={() => setIsMovementsCollapsed(!isMovementsCollapsed)}
              >
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Historial de Movimientos</h2>
                <svg
                  className={`w-5 h-5 transition-transform ${isMovementsCollapsed ? '' : 'rotate-180'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {!isMovementsCollapsed && (
                <>
                  {movements.length === 0 ? (
                    <div className="p-6 sm:p-8 text-center text-gray-500 text-sm sm:text-base">
                      No hay movimientos registrados.
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Fecha</th>
                              <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                              <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                              <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Desde</th>
                              <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Hacia</th>
                              <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Cant.</th>
                              <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Usuario</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {movements.slice(0, visibleMovements).map((movement: InventoryMovement) => (
                              <tr key={movement.id} className="hover:bg-gray-50">
                                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 hidden lg:table-cell">
                                  {new Date(movement.created_at).toLocaleString()}
                                </td>
                                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    movement.movement_type === 'CRUDO_INPUT' ? 'bg-yellow-100 text-yellow-800' :
                                    movement.movement_type === 'SANCOCHADO_PROCESS' ? 'bg-orange-100 text-orange-800' :
                                    movement.movement_type === 'ESMALTADO_PROCESS' ? 'bg-green-100 text-green-800' :
                                    movement.movement_type === 'MERMA' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {movement.movement_type.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">
                                  {movement.product_name}
                                </td>
                                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 hidden md:table-cell">
                                  {movement.from_stage || '-'}
                                </td>
                                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 hidden md:table-cell">
                                  {movement.to_stage || '-'}
                                  {movement.to_color && (
                                    <span className="ml-2 text-xs text-gray-500">({movement.to_color})</span>
                                  )}
                                </td>
                                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900">
                                  {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                                </td>
                                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 hidden sm:table-cell">
                                  {movement.created_by_name}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {visibleMovements < movements.length && (
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 text-center">
                          <button
                            onClick={() => setVisibleMovements(prev => prev + 10)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            Cargar más movimientos ({movements.length - visibleMovements} restantes)
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Inventario Embalaje Tab */}
        {activeTab === 'embalaje' && (
          <div className="bg-white shadow rounded-lg p-6 sm:p-8">
            <div className="text-center text-gray-500">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Inventario Embalaje</h2>
              <p className="text-sm">Esta sección está en desarrollo.</p>
            </div>
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

                {/* Pesos y Cantidades */}
                <div className="border-t pt-4">
                  <h3 className="text-md font-semibold text-gray-700 mb-3">Pesos y Cantidades</h3>
                  <div className="grid grid-cols-3 gap-4">
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
                  </div>
                </div>

                {/* Costos */}
                <div className="border-t pt-4">
                  <h3 className="text-md font-semibold text-gray-700 mb-3">Costos (MXN)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Costo Pasta</label>
                      <input
                        type="number"
                        name="costo_pasta"
                        step="0.01"
                        defaultValue={editingProduct?.costo_pasta}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Costo Mano de Obra</label>
                      <input
                        type="number"
                        name="costo_mano_obra"
                        step="0.01"
                        defaultValue={editingProduct?.costo_mano_obra}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Costo Esmalte</label>
                      <input
                        type="number"
                        name="costo_esmalte"
                        step="0.01"
                        defaultValue={editingProduct?.costo_esmalte}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Costo Horneado</label>
                      <input
                        type="number"
                        name="costo_horneado"
                        step="0.01"
                        defaultValue={editingProduct?.costo_horneado}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Costo H Sancocho</label>
                      <input
                        type="number"
                        name="costo_h_sancocho"
                        step="0.01"
                        defaultValue={editingProduct?.costo_h_sancocho}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                      />
                    </div>
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
                  <div className="grid grid-cols-5 gap-4">
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
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">H Sancocho</label>
                      <p className="text-gray-900">{viewingProduct.costo_h_sancocho ? `$${Number(viewingProduct.costo_h_sancocho).toFixed(2)}` : '-'}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <label className="block text-sm font-medium text-gray-500 mb-1">Costo Total</label>
                    <p className="text-2xl font-bold text-green-600">
                      ${(Number(viewingProduct.costo_pasta || 0) + Number(viewingProduct.costo_mano_obra || 0) + Number(viewingProduct.costo_esmalte || 0) + Number(viewingProduct.costo_horneado || 0) + Number(viewingProduct.costo_h_sancocho || 0)).toFixed(2)} MXN
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

      {/* Inventory Form Modal */}
      {showInventoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4">
                {inventoryFormType === 'crudo' && 'Input de CRUDO'}
                {inventoryFormType === 'sancochado' && 'Procesar a SANCOCHADO'}
                {inventoryFormType === 'esmaltado' && 'Procesar a ESMALTADO'}
                {inventoryFormType === 'adjustment' && 'Ajuste de Inventario'}
                {inventoryFormType === 'merma' && 'Registrar MERMA'}
              </h2>

              <form onSubmit={handleSubmitInventoryForm} className="space-y-3 sm:space-y-4">
                {inventoryFormType === 'crudo' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2 sm:p-3">
                    <p className="text-xs sm:text-sm text-yellow-800">
                      <strong>Nota:</strong> Agregar productos incluso si rotos o defectuosos.
                    </p>
                  </div>
                )}

                {inventoryFormType === 'sancochado' && (
                  <>
                    <div className="bg-orange-100 border border-orange-300 rounded-md p-2 sm:p-3">
                      <p className="text-xs sm:text-sm text-orange-900 font-semibold">
                        NOTA: USAR ESTE MODULO A LA HORA DE SACAR HORNO DE SANCOCHADO Y CONTAR LAS PIEZAS
                      </p>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-md p-2 sm:p-3">
                      <p className="text-xs sm:text-sm text-orange-800">
                        <strong>Nota:</strong> Agregar productos incluso si rotos o defectuosos.
                      </p>
                    </div>
                  </>
                )}

                {inventoryFormType === 'esmaltado' && (
                  <>
                    <div className="bg-green-100 border border-green-300 rounded-md p-2 sm:p-3">
                      <p className="text-xs sm:text-sm text-green-900 font-semibold">
                        NOTA: USAR ESTE MODULO A LA HORA DE SACAR HORNO DE ESMALTADO
                      </p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-md p-2 sm:p-3">
                      <p className="text-xs sm:text-sm text-green-800">
                        <strong>Nota:</strong> Agregar productos incluso si rotos o defectuosos.
                      </p>
                    </div>
                  </>
                )}

                {inventoryFormType === 'adjustment' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-2 sm:p-3">
                    <p className="text-xs sm:text-sm text-blue-800">
                      <strong>Nota:</strong> Ingresa la cantidad total deseada.
                    </p>
                  </div>
                )}

                {inventoryFormType === 'merma' && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-2 sm:p-3">
                    <p className="text-xs sm:text-sm text-red-800">
                      <strong>Nota:</strong> Esto restará la cantidad del inventario seleccionado para registrar productos rotos o defectuosos.
                    </p>
                  </div>
                )}

                {/* Items Table */}
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                        {(inventoryFormType === 'adjustment' || inventoryFormType === 'merma') && (
                          <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Etapa</th>
                        )}
                        {(inventoryFormType === 'esmaltado' || inventoryFormType === 'adjustment' || inventoryFormType === 'merma') && (
                          <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Color</th>
                        )}
                        <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          {inventoryFormType === 'adjustment' ? 'Nueva Cant.' : 'Cant.'}
                        </th>
                        <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Notas</th>
                        <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {inventoryItems.map((item, index) => {
                        const availableProducts = getAvailableProducts(index);
                        const availableColors = getAvailableColors(index);
                        return (
                        <tr key={index}>
                          <td className="px-2 sm:px-3 py-2">
                            <select
                              value={item.product_id}
                              onChange={(e) => updateInventoryRow(index, 'product_id', e.target.value)}
                              required
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-xs sm:text-sm"
                            >
                              <option value="">Seleccionar...</option>
                              {availableProducts.map((product: Product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name} - {product.tipo_name}
                                </option>
                              ))}
                            </select>
                          </td>

                          {(inventoryFormType === 'adjustment' || inventoryFormType === 'merma') && (
                            <td className="px-2 sm:px-3 py-2">
                              <select
                                value={item.stage || ''}
                                onChange={(e) => updateInventoryRow(index, 'stage', e.target.value)}
                                required
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-xs sm:text-sm"
                              >
                                <option value="">Seleccionar...</option>
                                <option value="CRUDO">CRUDO</option>
                                <option value="SANCOCHADO">SANCOCHADO</option>
                                <option value="ESMALTADO">ESMALTADO</option>
                              </select>
                            </td>
                          )}

                          {(inventoryFormType === 'esmaltado' || inventoryFormType === 'adjustment' || inventoryFormType === 'merma') && (
                            <td className="px-2 sm:px-3 py-2 hidden sm:table-cell">
                              <select
                                value={item.esmalte_color_id || ''}
                                onChange={(e) => updateInventoryRow(index, 'esmalte_color_id', e.target.value)}
                                required={inventoryFormType === 'esmaltado'}
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-xs sm:text-sm"
                              >
                                <option value="">Seleccionar...</option>
                                {availableColors.map((color: EsmalteColor) => (
                                  <option key={color.id} value={color.id}>{color.color}</option>
                                ))}
                              </select>
                            </td>
                          )}

                          <td className="px-2 sm:px-3 py-2">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateInventoryRow(index, 'quantity', e.target.value)}
                              min={0}
                              step="1"
                              required
                              className="block w-16 sm:w-24 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-xs sm:text-sm"
                              placeholder="0"
                            />
                          </td>

                          <td className="px-2 sm:px-3 py-2 hidden md:table-cell">
                            <input
                              type="text"
                              value={item.notes || ''}
                              onChange={(e) => updateInventoryRow(index, 'notes', e.target.value)}
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-xs sm:text-sm"
                              placeholder="Opcional"
                            />
                          </td>

                          <td className="px-2 sm:px-3 py-2">
                            <button
                              type="button"
                              onClick={() => removeInventoryRow(index)}
                              disabled={inventoryItems.length === 1}
                              className="text-red-600 hover:text-red-900 disabled:text-gray-300 disabled:cursor-not-allowed"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  onClick={addInventoryRow}
                  className="w-full border-2 border-dashed border-gray-300 rounded-md py-2 text-xs sm:text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700"
                >
                  + Agregar otra línea
                </button>

                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInventoryForm(false);
                      setInventoryItems([{ product_id: '', quantity: '', notes: '' }]);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm sm:text-base order-2 sm:order-1"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-white rounded-md text-sm sm:text-base order-1 sm:order-2 ${
                      inventoryFormType === 'crudo' ? 'bg-yellow-600 hover:bg-yellow-700' :
                      inventoryFormType === 'sancochado' ? 'bg-orange-600 hover:bg-orange-700' :
                      inventoryFormType === 'esmaltado' ? 'bg-green-600 hover:bg-green-700' :
                      inventoryFormType === 'merma' ? 'bg-red-600 hover:bg-red-700' :
                      'bg-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    {inventoryFormType === 'adjustment' ? 'Ajustar' : inventoryFormType === 'merma' ? 'Registrar' : 'Procesar'} ({inventoryItems.filter(item => item.product_id && item.quantity).length})
                  </button>
                </div>
              </form>
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
