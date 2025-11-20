import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useQuotations, useQuotation, useCreateQuotation, useUpdateQuotation, useDeleteQuotation } from '../hooks/useVentasQuotations';
import { Quotation, QuotationItemFormData } from '../types/ventas';
import { Product } from '../types/produccion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const VentasMayoreo: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [viewingQuote, setViewingQuote] = useState<Quotation | null>(null);
  const [editingQuoteId, setEditingQuoteId] = useState<number | null>(null);

  // Customer fields
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');

  // Items
  const [items, setItems] = useState<QuotationItemFormData[]>([
    { product_id: 0, quantity: 1, unit_price: 0, discount_percentage: 0, tax_percentage: 16 }
  ]);

  const { data: quotations = [], isLoading: quotationsLoading } = useQuotations();
  const { data: viewingQuoteDetails } = useQuotation(viewingQuote?.id);
  const createQuotationMutation = useCreateQuotation();
  const updateQuotationMutation = useUpdateQuotation();
  const deleteQuotationMutation = useDeleteQuotation();

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
    setItems([...items, { product_id: 0, quantity: 1, unit_price: 0, discount_percentage: 0, tax_percentage: 16 }]);
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

    // Pre-fill items
    if (fullQuote.items && fullQuote.items.length > 0) {
      setItems(fullQuote.items.map((item: any) => ({
        product_id: item.product_id,
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
    setItems([{ product_id: 0, quantity: 1, unit_price: 0, discount_percentage: 0, tax_percentage: 16 }]);
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
    setItems([{ product_id: 0, quantity: 1, unit_price: 0, discount_percentage: 0, tax_percentage: 16 }]);
    setEditingQuoteId(null);
    setShowForm(false);
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
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Volver
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Ventas Mayoreo - Cotizaciones</h1>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              {showForm ? 'Cancelar' : '+ Nueva Cotización'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
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
                        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
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
                                  </option>
                                ))
                              }
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
              <div className="overflow-x-auto">
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
    </div>
  );
};

export default VentasMayoreo;
