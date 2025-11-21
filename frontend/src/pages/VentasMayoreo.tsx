import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useQuotations, useQuotation, useCreateQuotation, useUpdateQuotation, useDeleteQuotation } from '../hooks/useVentasQuotations';
import { usePedidos, usePedido, useCreatePedido, useUpdatePedidoStatus, useDeletePedido } from '../hooks/useVentasPedidos';
import { usePedidoInventoryAvailability, useAllocateInventory, usePedidoAllocations, useDeallocateInventory } from '../hooks/useVentasInventory';
import { Quotation, QuotationItemFormData, Pedido } from '../types/ventas';
import { Product } from '../types/produccion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const VentasMayoreo: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'cotizaciones' | 'pedidos'>('cotizaciones');
  const [showForm, setShowForm] = useState(false);
  const [viewingQuote, setViewingQuote] = useState<Quotation | null>(null);
  const [editingQuoteId, setEditingQuoteId] = useState<number | null>(null);
  const [viewingPedido, setViewingPedido] = useState<Pedido | null>(null);
  const [convertingQuoteId, setConvertingQuoteId] = useState<number | null>(null);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [pedidoNotes, setPedidoNotes] = useState('');

  // Check URL parameter on mount to set initial tab
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'pedidos') {
      setActiveTab('pedidos');
    } else if (tab === 'cotizaciones') {
      setActiveTab('cotizaciones');
    }
  }, [searchParams]);

  // Customer fields
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState(`CONDICIONES:
- Precio sujeto a cambio sin previo aviso
- Entrega según disponibilidad
- Garantía de 30 días por defectos de fabricación
- No se aceptan devoluciones sin autorización previa
- Tiempo de entrega: 15-20 días hábiles

(Edite este texto según sus necesidades)`);

  // Items
  const [items, setItems] = useState<QuotationItemFormData[]>([
    { product_id: 0, esmalte_color_id: 0, quantity: 1, unit_price: 0, discount_percentage: 0, tax_percentage: 16 }
  ]);

  const { data: quotations = [], isLoading: quotationsLoading } = useQuotations();
  const { data: viewingQuoteDetails } = useQuotation(viewingQuote?.id);
  const createQuotationMutation = useCreateQuotation();
  const updateQuotationMutation = useUpdateQuotation();
  const deleteQuotationMutation = useDeleteQuotation();

  // Pedidos hooks
  const { data: pedidos = [], isLoading: pedidosLoading } = usePedidos();
  const { data: viewingPedidoDetails } = usePedido(viewingPedido?.id);
  const createPedidoMutation = useCreatePedido();
  const updatePedidoStatusMutation = useUpdatePedidoStatus();
  const deletePedidoMutation = useDeletePedido();

  // Inventory allocation hooks
  const { data: pedidoInventory = [] } = usePedidoInventoryAvailability(viewingPedido?.id);
  const { data: pedidoAllocations = [] } = usePedidoAllocations(viewingPedido?.id);
  const allocateInventoryMutation = useAllocateInventory();
  const deallocateInventoryMutation = useDeallocateInventory();

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['produccion-products'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/produccion/products`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return res.data as Product[];
    },
  });

  // Fetch esmalte colors
  const { data: esmalteColors = [] } = useQuery({
    queryKey: ['produccion-esmalte-colors'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/produccion/esmalte-color`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return res.data;
    },
  });

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

  const handleAddItem = () => {
    setItems([...items, { product_id: 0, esmalte_color_id: 0, quantity: 1, unit_price: 0, discount_percentage: 0, tax_percentage: 16 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof QuotationItemFormData, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleEdit = async (quotation: Quotation) => {
    // Fetch full quotation details with items
    const res = await axios.get(`${API_URL}/ventas/quotations/${quotation.id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    const fullQuote = res.data;

    // Pre-fill form
    setCustomerName(fullQuote.customer_name || '');
    setCustomerEmail(fullQuote.customer_email || '');
    setCustomerPhone(fullQuote.customer_phone || '');
    setCustomerAddress(fullQuote.customer_address || '');
    setValidUntil(fullQuote.valid_until ? fullQuote.valid_until.split('T')[0] : '');
    setNotes(fullQuote.notes || '');
    setTerms(fullQuote.terms || '');

    // Pre-fill items
    if (fullQuote.items && fullQuote.items.length > 0) {
      setItems(fullQuote.items.map((item: any) => ({
        product_id: item.product_id,
        esmalte_color_id: item.esmalte_color_id || 0,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        discount_percentage: Number(item.discount_percentage),
        tax_percentage: Number(item.tax_percentage),
        notes: item.notes || '',
      })));
    }

    setEditingQuoteId(quotation.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName) {
      alert('Customer name is required');
      return;
    }

    if (items.length === 0 || items.some(item => item.product_id === 0)) {
      alert('Please select products for all items');
      return;
    }

    const formData = {
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      customer_address: customerAddress,
      valid_until: validUntil,
      notes,
      terms,
      items,
    };

    if (editingQuoteId) {
      // Update existing quotation
      await updateQuotationMutation.mutateAsync({ id: editingQuoteId, data: formData });
    } else {
      // Create new quotation
      await createQuotationMutation.mutateAsync(formData);
    }

    // Reset form
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setCustomerAddress('');
    setValidUntil('');
    setNotes('');
    setTerms(`CONDICIONES:
- Precio sujeto a cambio sin previo aviso
- Entrega según disponibilidad
- Garantía de 30 días por defectos de fabricación
- No se aceptan devoluciones sin autorización previa
- Tiempo de entrega: 15-20 días hábiles

(Edite este texto según sus necesidades)`);
    setItems([{ product_id: 0, esmalte_color_id: 0, quantity: 1, unit_price: 0, discount_percentage: 0, tax_percentage: 16 }]);
    setEditingQuoteId(null);
    setShowForm(false);
  };

  const handleCancelForm = () => {
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setCustomerAddress('');
    setValidUntil('');
    setNotes('');
    setTerms(`CONDICIONES:
- Precio sujeto a cambio sin previo aviso
- Entrega según disponibilidad
- Garantía de 30 días por defectos de fabricación
- No se aceptan devoluciones sin autorización previa
- Tiempo de entrega: 15-20 días hábiles

(Edite este texto según sus necesidades)`);
    setItems([{ product_id: 0, esmalte_color_id: 0, quantity: 1, unit_price: 0, discount_percentage: 0, tax_percentage: 16 }]);
    setEditingQuoteId(null);
    setShowForm(false);
  };

  const handleNewQuotation = () => {
    // Reset form completely before opening
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setCustomerAddress('');
    setValidUntil('');
    setNotes('');
    setTerms(`CONDICIONES:
- Precio sujeto a cambio sin previo aviso
- Entrega según disponibilidad
- Garantía de 30 días por defectos de fabricación
- No se aceptan devoluciones sin autorización previa
- Tiempo de entrega: 15-20 días hábiles

(Edite este texto según sus necesidades)`);
    setItems([{ product_id: 0, esmalte_color_id: 0, quantity: 1, unit_price: 0, discount_percentage: 0, tax_percentage: 16 }]);
    setEditingQuoteId(null);
    setShowForm(true);
  };

  const formatCurrency = (amount: number) => {
    return `$${Number(amount || 0).toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CONFIRMED': 'bg-blue-100 text-blue-800',
      'IN_PRODUCTION': 'bg-purple-100 text-purple-800',
      'READY': 'bg-green-100 text-green-800',
      'DELIVERED': 'bg-gray-100 text-gray-800',
      'CANCELLED': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'PENDING': 'Pendiente',
      'CONFIRMED': 'Confirmado',
      'IN_PRODUCTION': 'En Producción',
      'READY': 'Listo',
      'DELIVERED': 'Entregado',
      'CANCELLED': 'Cancelado',
    };
    return labels[status] || status;
  };

  const handleConvertToPedido = () => {
    if (!convertingQuoteId) return;

    createPedidoMutation.mutate({
      quotation_id: convertingQuoteId,
      expected_delivery_date: expectedDeliveryDate || undefined,
      payment_method: paymentMethod || undefined,
      notes: pedidoNotes || undefined,
    }, {
      onSuccess: () => {
        setConvertingQuoteId(null);
        setExpectedDeliveryDate('');
        setPaymentMethod('');
        setPedidoNotes('');
        setActiveTab('pedidos');
        alert('Pedido creado exitosamente');
      },
      onError: (error: any) => {
        alert(`Error creating pedido: ${error.message}`);
      },
    });
  };

  // Calculate item total
  const calculateItemTotal = (item: QuotationItemFormData) => {
    const subtotal = item.quantity * item.unit_price;
    const discountAmount = subtotal * ((item.discount_percentage || 0) / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * ((item.tax_percentage || 0) / 100);
    const total = afterDiscount + taxAmount;
    return {
      subtotal,
      discountAmount,
      taxAmount,
      total,
    };
  };

  // Calculate all totals
  const calculateTotals = () => {
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;
    let total = 0;

    items.forEach(item => {
      const itemCalc = calculateItemTotal(item);
      subtotal += itemCalc.subtotal;
      discountTotal += itemCalc.discountAmount;
      taxTotal += itemCalc.taxAmount;
      total += itemCalc.total;
    });

    return { subtotal, discountTotal, taxTotal, total };
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 md:py-6">
            <div className="flex items-center space-x-2 md:space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-500 hover:text-gray-700 touch-manipulation"
              >
                ← Volver
              </button>
              <h1 className="text-xl md:text-3xl font-bold text-gray-900">Ventas Mayoreo</h1>
            </div>
            {activeTab === 'cotizaciones' && (
              <button
                onClick={() => showForm ? handleCancelForm() : handleNewQuotation()}
                className="bg-green-600 text-white px-3 md:px-4 py-2 rounded-md hover:bg-green-700 active:bg-green-800 text-sm md:text-base touch-manipulation"
              >
                {showForm ? 'Cancelar' : '+ Nueva'}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('cotizaciones')}
                className={`${
                  activeTab === 'cotizaciones'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Cotizaciones
              </button>
              <button
                onClick={() => setActiveTab('pedidos')}
                className={`${
                  activeTab === 'pedidos'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Pedidos en Firme
              </button>
            </nav>
          </div>
        </div>

        {/* Cotizaciones Tab */}
        {activeTab === 'cotizaciones' && (
          <>
        {showForm ? (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6">
              {editingQuoteId ? 'Editar Cotización' : 'Nueva Cotización'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Cliente *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Válida hasta
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Productos</h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    + Agregar Producto
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item, index) => {
                    const itemTotal = calculateItemTotal(item);
                    // Get list of already selected product IDs (excluding current item)
                    const selectedProductIds = items
                      .map((itm, idx) => idx !== index ? itm.product_id : null)
                      .filter(id => id !== null && id !== 0);

                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Producto *
                            </label>
                            <select
                              value={item.product_id}
                              onChange={(e) => handleItemChange(index, 'product_id', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              required
                            >
                              <option value="0">Seleccionar...</option>
                              {products
                                .filter(p => !selectedProductIds.includes(p.id))
                                .map(p => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} - {p.tipo_name}
                                    {p.size_cm && ` - ${p.size_cm}cm`}
                                    {p.capacity_ml && ` - ${p.capacity_ml}ml`}
                                  </option>
                                ))
                              }
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Color
                            </label>
                            <select
                              value={item.esmalte_color_id || 0}
                              onChange={(e) => handleItemChange(index, 'esmalte_color_id', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                              <option value="0">N/A</option>
                              {esmalteColors.map((color: any) => (
                                <option key={color.id} value={color.id}>
                                  {color.color}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Cantidad *
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Precio Unitario *
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Descuento %
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={item.discount_percentage}
                              onChange={(e) => handleItemChange(index, 'discount_percentage', parseFloat(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              IVA %
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={item.tax_percentage}
                              onChange={(e) => handleItemChange(index, 'tax_percentage', parseFloat(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Total
                            </label>
                            <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md font-semibold text-gray-900">
                              {formatCurrency(itemTotal.total)}
                            </div>
                          </div>
                        </div>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="mt-2 text-red-600 hover:text-red-800 text-sm"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Totals Summary */}
              <div className="border-t pt-4">
                <div className="flex justify-end">
                  <div className="w-80 space-y-2 bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Descuento:</span>
                      <span className="font-medium text-red-600">-{formatCurrency(totals.discountTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">IVA:</span>
                      <span className="font-medium">{formatCurrency(totals.taxTotal)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="text-lg font-semibold text-gray-900">Total:</span>
                      <span className="text-lg font-bold text-green-600">{formatCurrency(totals.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Terms and Conditions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Términos y Condiciones
                </label>
                <textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                  placeholder="Ingrese los términos y condiciones..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Estos términos aparecerán en la cotización. Puede editar el texto según sus necesidades.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createQuotationMutation.isPending || updateQuotationMutation.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {(createQuotationMutation.isPending || updateQuotationMutation.isPending)
                    ? 'Guardando...'
                    : editingQuoteId
                      ? 'Actualizar Cotización'
                      : 'Guardar Cotización'
                  }
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {quotationsLoading ? (
              <div className="p-8 text-center text-gray-500">Cargando...</div>
            ) : quotations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No hay cotizaciones. Crea una nueva para comenzar.
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Número
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Items
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {quotations.map((quotation) => (
                        <tr key={quotation.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                            {quotation.quotation_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {quotation.customer_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(quotation.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {formatCurrency(quotation.total)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {quotation.items_count || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => setViewingQuote(quotation)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Ver
                            </button>
                            <button
                              onClick={() => handleEdit(quotation)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => setConvertingQuoteId(quotation.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              → Pedido
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('¿Eliminar esta cotización?')) {
                                  deleteQuotationMutation.mutate(quotation.id);
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

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4 p-4">
                  {quotations.map((quotation) => (
                    <div key={quotation.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-blue-600 mb-1">
                            {quotation.quotation_number}
                          </div>
                          <div className="text-base font-medium text-gray-900">
                            {quotation.customer_name}
                          </div>
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(quotation.total)}
                        </div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500 mb-4">
                        <span>{formatDate(quotation.created_at)}</span>
                        <span>{quotation.items_count || 0} items</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setViewingQuote(quotation)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 active:bg-blue-800"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => handleEdit(quotation)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 active:bg-indigo-800"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setConvertingQuoteId(quotation.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 active:bg-green-800"
                        >
                          → Pedido
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('¿Eliminar esta cotización?')) {
                              deleteQuotationMutation.mutate(quotation.id);
                            }
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 active:bg-red-800"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
          </>
        )}

        {/* Pedidos en Firme Tab */}
        {activeTab === 'pedidos' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Pedidos en Firme</h2>

            {pedidosLoading ? (
              <div className="text-center py-8">Cargando...</div>
            ) : pedidos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay pedidos. Convierte una cotización en pedido para comenzar.
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Número
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Items
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pedidos.map((pedido) => (
                        <tr key={pedido.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                            {pedido.pedido_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {pedido.customer_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(pedido.order_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {formatCurrency(pedido.total)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(pedido.status)}`}>
                              {getStatusLabel(pedido.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {pedido.items_count || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => setViewingPedido(pedido)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Ver
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('¿Eliminar este pedido?')) {
                                  deletePedidoMutation.mutate(pedido.id);
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

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {pedidos.map((pedido) => (
                    <div key={pedido.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-blue-600 mb-1">
                            {pedido.pedido_number}
                          </div>
                          <div className="text-base font-medium text-gray-900">
                            {pedido.customer_name}
                          </div>
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(pedido.total)}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-gray-500">{formatDate(pedido.order_date)}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(pedido.status)}`}>
                          {getStatusLabel(pedido.status)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mb-4">
                        {pedido.items_count || 0} items
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setViewingPedido(pedido)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 active:bg-blue-800"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('¿Eliminar este pedido?')) {
                              deletePedidoMutation.mutate(pedido.id);
                            }
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 active:bg-red-800"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* View Modal */}
      {viewingQuote && viewingQuoteDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {viewingQuoteDetails.quotation_number}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Creada: {formatDate(viewingQuoteDetails.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => setViewingQuote(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Customer Info */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Cliente</h3>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-gray-900 font-medium">{viewingQuoteDetails.customer_name}</p>
                  {viewingQuoteDetails.customer_email && (
                    <p className="text-sm text-gray-600">Email: {viewingQuoteDetails.customer_email}</p>
                  )}
                  {viewingQuoteDetails.customer_phone && (
                    <p className="text-sm text-gray-600">Teléfono: {viewingQuoteDetails.customer_phone}</p>
                  )}
                  {viewingQuoteDetails.customer_address && (
                    <p className="text-sm text-gray-600">Dirección: {viewingQuoteDetails.customer_address}</p>
                  )}
                  {viewingQuoteDetails.valid_until && (
                    <p className="text-sm text-gray-600">
                      Válida hasta: {new Date(viewingQuoteDetails.valid_until).toLocaleDateString('es-MX')}
                    </p>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Productos</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tamaño</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Capacidad</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descuento</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">IVA</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {viewingQuoteDetails.items?.map((item: any, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {item.product_name}
                            {item.tipo_name && <span className="text-gray-500"> - {item.tipo_name}</span>}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.size_cm ? `${item.size_cm} cm` : '-'}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.capacity_ml ? `${item.capacity_ml} ml` : '-'}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">
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
                            ) : '-'}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(Number(item.unit_price))}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{Number(item.discount_percentage)}%</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{Number(item.tax_percentage)}%</td>
                          <td className="px-4 py-2 text-sm font-semibold text-gray-900">{formatCurrency(Number(item.total))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-4 mb-6">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(Number(viewingQuoteDetails.subtotal))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Descuento:</span>
                      <span className="font-medium text-red-600">-{formatCurrency(Number(viewingQuoteDetails.discount_total))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">IVA:</span>
                      <span className="font-medium">{formatCurrency(Number(viewingQuoteDetails.tax_total))}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-lg font-bold text-green-600">{formatCurrency(Number(viewingQuoteDetails.total))}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {viewingQuoteDetails.notes && (
                <div className="border-t pt-4 mb-6">
                  <h3 className="font-semibold text-gray-700 mb-2">Notas</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{viewingQuoteDetails.notes}</p>
                </div>
              )}

              {/* Terms */}
              {viewingQuoteDetails.terms && (
                <div className="border-t pt-4 mb-6">
                  <h3 className="font-semibold text-gray-700 mb-2">Términos y Condiciones</h3>
                  <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <p className="text-gray-700 whitespace-pre-wrap font-mono text-sm">{viewingQuoteDetails.terms}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 border-t pt-4">
                <button
                  onClick={() => setViewingQuote(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    handleEdit(viewingQuote);
                    setViewingQuote(null);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Pedido Modal */}
      {convertingQuoteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Convertir a Pedido en Firme</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Esperada de Entrega
                </label>
                <input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Método de Pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Seleccionar...</option>
                  <option value="CASH">Efectivo</option>
                  <option value="TRANSFER">Transferencia</option>
                  <option value="CARD">Tarjeta</option>
                  <option value="CHECK">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas Adicionales
                </label>
                <textarea
                  value={pedidoNotes}
                  onChange={(e) => setPedidoNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Notas adicionales para el pedido..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setConvertingQuoteId(null);
                  setExpectedDeliveryDate('');
                  setPaymentMethod('');
                  setPedidoNotes('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleConvertToPedido}
                disabled={createPedidoMutation.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {createPedidoMutation.isPending ? 'Creando...' : 'Crear Pedido'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pedido Detail Modal */}
      {viewingPedido && viewingPedidoDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center md:p-4 z-50 overflow-y-auto">
          <div className="bg-white md:rounded-lg max-w-4xl w-full h-full md:h-auto md:my-8">
            <div className="p-4 md:p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{viewingPedidoDetails.pedido_number}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Creado el {formatDate(viewingPedidoDetails.created_at)}
                  </p>
                  {viewingPedidoDetails.quotation_number && (
                    <p className="text-sm text-gray-500">
                      De cotización: {viewingPedidoDetails.quotation_number}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setViewingPedido(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Status */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado del Pedido</label>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeColor(viewingPedidoDetails.status)}`}>
                    {getStatusLabel(viewingPedidoDetails.status)}
                  </span>
                  <select
                    value={viewingPedidoDetails.status}
                    onChange={(e) => {
                      if (confirm('¿Cambiar el estado del pedido?')) {
                        updatePedidoStatusMutation.mutate({
                          id: viewingPedidoDetails.id,
                          status: e.target.value,
                        });
                      }
                    }}
                    className="ml-4 px-3 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="PENDING">Pendiente</option>
                    <option value="CONFIRMED">Confirmado</option>
                    <option value="IN_PRODUCTION">En Producción</option>
                    <option value="READY">Listo</option>
                    <option value="DELIVERED">Entregado</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>
                </div>
              </div>

              {/* Customer Info */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Información del Cliente</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Nombre:</span> {viewingPedidoDetails.customer_name}
                  </div>
                  {viewingPedidoDetails.customer_email && (
                    <div>
                      <span className="text-gray-500">Email:</span> {viewingPedidoDetails.customer_email}
                    </div>
                  )}
                  {viewingPedidoDetails.customer_phone && (
                    <div>
                      <span className="text-gray-500">Teléfono:</span> {viewingPedidoDetails.customer_phone}
                    </div>
                  )}
                  {viewingPedidoDetails.customer_address && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Dirección:</span> {viewingPedidoDetails.customer_address}
                    </div>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Productos</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {viewingPedidoDetails.items?.map((item: any, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {item.product_name}
                            {item.tipo_name && <span className="text-gray-500"> - {item.tipo_name}</span>}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
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
                            ) : '-'}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(Number(item.unit_price))}</td>
                          <td className="px-4 py-2 text-sm font-semibold text-gray-900">{formatCurrency(Number(item.total))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Inventory Allocation Ledger */}
              {pedidoInventory.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-3">Inventario Disponible (Etapa Esmaltado)</h3>

                  {/* Allocation Status Notification */}
                  {(() => {
                    const allAllocated = pedidoInventory.every((item: any) => item.still_needed === 0);

                    return (
                      <div className={`mb-4 p-4 rounded-lg border-2 ${
                        allAllocated
                          ? 'bg-green-50 border-green-500'
                          : 'bg-orange-50 border-orange-500'
                      }`}>
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 ${allAllocated ? 'text-green-600' : 'text-orange-600'}`}>
                            {allAllocated ? (
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="ml-3">
                            <p className={`text-sm font-semibold ${
                              allAllocated ? 'text-green-800' : 'text-orange-800'
                            }`}>
                              {allAllocated
                                ? '✓ EL PEDIDO ESTÁ LISTO PARA SER EMPACADO'
                                : '⚠ FALTAN ALGUNOS PRODUCTOS POR APARTAR PARA COMPLETAR EL PEDIDO'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="overflow-x-auto border border-gray-200 rounded-lg -mx-4 md:mx-0">
                    <table className="min-w-full md:min-w-0 divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300">
                            Producto
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300">
                            Color
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300">
                            Cantidad
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-blue-700 uppercase tracking-wider border-r border-gray-300">
                            Apartado
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-orange-700 uppercase tracking-wider border-r border-gray-300">
                            Restante
                          </th>
                          <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300">
                            Disponibles
                          </th>
                          <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Acción
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y-2 divide-gray-300">
                        {pedidoInventory.map((inventoryItem: any) => {
                          const hasInventory = inventoryItem.inventory_items && inventoryItem.inventory_items.length > 0;
                          const numRows = hasInventory ? inventoryItem.inventory_items.length : 1;

                          return (
                            <React.Fragment key={inventoryItem.pedido_item_id}>
                              {hasInventory ? (
                                inventoryItem.inventory_items.map((inv: any, invIdx: number) => {
                                  const canAllocate = inv.disponibles > 0 && inventoryItem.still_needed > 0;
                                  const maxToAllocate = Math.min(inv.disponibles, inventoryItem.still_needed);

                                  return (
                                    <tr key={inv.inventory_id} className="hover:bg-gray-50">
                                      {invIdx === 0 && (
                                        <>
                                          <td rowSpan={numRows} className="px-4 py-3 border-r border-gray-200 align-top bg-gray-50">
                                            <div className="font-medium text-gray-900 text-sm">
                                              {inventoryItem.product_name}
                                            </div>
                                            {inventoryItem.tipo_name && (
                                              <div className="text-xs text-gray-500 mt-0.5">
                                                {inventoryItem.tipo_name}
                                              </div>
                                            )}
                                          </td>
                                          <td rowSpan={numRows} className="px-4 py-3 border-r border-gray-200 align-top bg-gray-50">
                                            {inventoryItem.esmalte_color ? (
                                              <div className="flex items-center gap-2">
                                                {inventoryItem.esmalte_hex_code && (
                                                  <div
                                                    className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0"
                                                    style={{ backgroundColor: inventoryItem.esmalte_hex_code }}
                                                  />
                                                )}
                                                <span className="text-sm text-gray-900">{inventoryItem.esmalte_color}</span>
                                              </div>
                                            ) : (
                                              <span className="text-sm text-gray-400">-</span>
                                            )}
                                          </td>
                                          <td rowSpan={numRows} className="px-4 py-3 text-center border-r border-gray-200 align-top bg-gray-50">
                                            <span className="text-base font-semibold text-gray-900">
                                              {inventoryItem.quantity_needed}
                                            </span>
                                          </td>
                                          <td rowSpan={numRows} className="px-4 py-3 text-center border-r border-gray-200 align-top bg-blue-50">
                                            <span className="text-base font-semibold text-blue-700">
                                              {inventoryItem.quantity_allocated}
                                            </span>
                                          </td>
                                          <td rowSpan={numRows} className="px-4 py-3 text-center border-r border-gray-200 align-top bg-orange-50">
                                            <span className={`text-base font-semibold ${inventoryItem.still_needed > 0 ? 'text-orange-700' : 'text-green-700'}`}>
                                              {inventoryItem.still_needed}
                                            </span>
                                            {inventoryItem.shortfall > 0 && (
                                              <div className="text-xs text-red-600 font-semibold mt-1 whitespace-nowrap">
                                                ⚠️ Faltan producir: {inventoryItem.shortfall}
                                              </div>
                                            )}
                                          </td>
                                        </>
                                      )}
                                      <td className="px-3 py-3 text-center border-r border-gray-200">
                                        <span className={`text-sm font-semibold ${inv.disponibles < 0 ? 'text-red-600' : inv.disponibles === 0 ? 'text-gray-400' : 'text-green-600'}`}>
                                          {inv.disponibles}
                                        </span>
                                      </td>
                                      <td className="px-3 py-3 text-center">
                                        {(() => {
                                          // Find allocations for this specific inventory item and pedido item
                                          const allocationsForThisInventory = pedidoAllocations.filter(
                                            (alloc: any) =>
                                              alloc.pedido_item_id === inventoryItem.pedido_item_id &&
                                              alloc.inventory_id === inv.inventory_id
                                          );

                                          const hasAllocations = allocationsForThisInventory.length > 0;
                                          const totalAllocatedHere = allocationsForThisInventory.reduce(
                                            (sum: number, alloc: any) => sum + Number(alloc.quantity_allocated),
                                            0
                                          );

                                          return (
                                            <div className="flex flex-col gap-1">
                                              {canAllocate && (
                                                <button
                                                  onClick={() => {
                                                    const quantity = prompt(`¿Cuántas unidades apartar? (máximo ${maxToAllocate})`);
                                                    if (quantity) {
                                                      const qty = parseInt(quantity);
                                                      if (qty > 0 && qty <= maxToAllocate) {
                                                        allocateInventoryMutation.mutate({
                                                          pedido_id: viewingPedido!.id,
                                                          pedido_item_id: inventoryItem.pedido_item_id,
                                                          inventory_id: inv.inventory_id,
                                                          quantity: qty,
                                                        }, {
                                                          onSuccess: () => {
                                                            alert(`${qty} unidades apartadas exitosamente`);
                                                          },
                                                          onError: (error: any) => {
                                                            alert(`Error: ${error.response?.data?.details || error.message}`);
                                                          },
                                                        });
                                                      } else {
                                                        alert(`Cantidad inválida. Debe ser entre 1 y ${maxToAllocate}`);
                                                      }
                                                    }
                                                  }}
                                                  disabled={allocateInventoryMutation.isPending}
                                                  className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
                                                >
                                                  Apartar
                                                </button>
                                              )}
                                              {hasAllocations && (
                                                <button
                                                  onClick={() => {
                                                    if (confirm(`¿Desapartar ${totalAllocatedHere} unidades de este lote?`)) {
                                                      // Deallocate all allocations for this inventory item
                                                      allocationsForThisInventory.forEach((alloc: any) => {
                                                        deallocateInventoryMutation.mutate(alloc.id, {
                                                          onSuccess: () => {
                                                            alert(`${alloc.quantity_allocated} unidades liberadas exitosamente`);
                                                          },
                                                          onError: (error: any) => {
                                                            alert(`Error: ${error.response?.data?.details || error.message}`);
                                                          },
                                                        });
                                                      });
                                                    }
                                                  }}
                                                  disabled={deallocateInventoryMutation.isPending}
                                                  className="text-xs px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 font-medium"
                                                  title={`${totalAllocatedHere} apartados`}
                                                >
                                                  Desapartar ({totalAllocatedHere})
                                                </button>
                                              )}
                                              {!canAllocate && !hasAllocations && (
                                                <span className="text-xs text-gray-400">-</span>
                                              )}
                                            </div>
                                          );
                                        })()}
                                      </td>
                                    </tr>
                                  );
                                })
                              ) : (
                                <tr className="hover:bg-gray-50">
                                  <td className="px-4 py-3 border-r border-gray-200 bg-gray-50">
                                    <div className="font-medium text-gray-900 text-sm">
                                      {inventoryItem.product_name}
                                    </div>
                                    {inventoryItem.tipo_name && (
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        {inventoryItem.tipo_name}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 border-r border-gray-200 bg-gray-50">
                                    {inventoryItem.esmalte_color ? (
                                      <div className="flex items-center gap-2">
                                        {inventoryItem.esmalte_hex_code && (
                                          <div
                                            className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0"
                                            style={{ backgroundColor: inventoryItem.esmalte_hex_code }}
                                          />
                                        )}
                                        <span className="text-sm text-gray-900">{inventoryItem.esmalte_color}</span>
                                      </div>
                                    ) : (
                                      <span className="text-sm text-gray-400">-</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-center border-r border-gray-200 bg-gray-50">
                                    <span className="text-base font-semibold text-gray-900">
                                      {inventoryItem.quantity_needed}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center border-r border-gray-200 bg-blue-50">
                                    <span className="text-base font-semibold text-blue-700">
                                      {inventoryItem.quantity_allocated}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center border-r border-gray-200 bg-orange-50">
                                    <span className={`text-base font-semibold ${inventoryItem.still_needed > 0 ? 'text-orange-700' : 'text-green-700'}`}>
                                      {inventoryItem.still_needed}
                                    </span>
                                    {inventoryItem.shortfall > 0 && (
                                      <div className="text-xs text-red-600 font-semibold mt-1 whitespace-nowrap">
                                        ⚠️ Faltan producir: {inventoryItem.shortfall}
                                      </div>
                                    )}
                                  </td>
                                  <td colSpan={2} className="px-4 py-3 text-center text-sm text-gray-500 italic bg-yellow-50">
                                    No hay inventario disponible en etapa esmaltado para este producto
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="mb-6 bg-gray-50 p-4 rounded">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(viewingPedidoDetails.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Descuento:</span>
                    <span className="font-medium text-red-600">-{formatCurrency(viewingPedidoDetails.discount_total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">IVA:</span>
                    <span className="font-medium">{formatCurrency(viewingPedidoDetails.tax_total)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                    <span>Total:</span>
                    <span className="text-green-600">{formatCurrency(viewingPedidoDetails.total)}</span>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Fechas</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Fecha del Pedido:</span> {formatDate(viewingPedidoDetails.order_date)}
                  </div>
                  {viewingPedidoDetails.expected_delivery_date && (
                    <div>
                      <span className="text-gray-500">Entrega Esperada:</span> {formatDate(viewingPedidoDetails.expected_delivery_date)}
                    </div>
                  )}
                  {viewingPedidoDetails.actual_delivery_date && (
                    <div>
                      <span className="text-gray-500">Entrega Real:</span> {formatDate(viewingPedidoDetails.actual_delivery_date)}
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {viewingPedidoDetails.notes && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-2">Notas</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{viewingPedidoDetails.notes}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setViewingPedido(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VentasMayoreo;
