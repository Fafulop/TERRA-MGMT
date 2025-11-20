import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { QuoteFormData, QuoteItemFormData, Customer, VentasProduct } from '../types/ventas';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface VentasQuoteFormProps {
  onSubmit: (data: QuoteFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: any;
}

const VentasQuoteForm: React.FC<VentasQuoteFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
  initialData,
}) => {
  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  // Form state - Manual customer entry
  const [customerName, setCustomerName] = useState('');
  const [customerCompany, setCustomerCompany] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  const [validUntil, setValidUntil] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  // Line items state
  const [items, setItems] = useState<QuoteItemFormData[]>([
    { product_id: 0, quantity: 1, unit_price: 0, discount_percentage: 0, notes: '' }
  ]);

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['produccion-products'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/produccion/products`, {
        headers: getHeaders(),
      });
      console.log('Products loaded:', res.data.length, 'products');
      console.log('First product:', res.data[0]);
      return res.data;
    },
  });

  // Calculate line item totals
  const calculateLineTotal = (item: QuoteItemFormData) => {
    const subtotal = item.quantity * item.unit_price;
    const discount = subtotal * (item.discount_percentage / 100);
    return subtotal - discount;
  };

  // Calculate quote totals
  const calculateTotals = () => {
    const itemsSubtotal = items.reduce((sum, item) => {
      return sum + calculateLineTotal(item);
    }, 0);

    let finalDiscount = 0;
    if (discountPercentage > 0) {
      finalDiscount = itemsSubtotal * (discountPercentage / 100);
    } else if (discountAmount > 0) {
      finalDiscount = discountAmount;
    }

    const subtotal = itemsSubtotal;
    const discountTotal = finalDiscount;
    const taxableAmount = subtotal - discountTotal;
    const tax = taxableAmount * 0.16; // IVA 16%
    const total = taxableAmount + tax;

    return { subtotal, discountTotal, tax, total };
  };

  const totals = calculateTotals();

  // Add new line item
  const addLineItem = () => {
    setItems([...items, { product_id: 0, quantity: 1, unit_price: 0, discount_percentage: 0, notes: '' }]);
  };

  // Remove line item
  const removeLineItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Update line item
  const updateLineItem = (index: number, field: keyof QuoteItemFormData, value: any) => {
    console.log('updateLineItem called:', { index, field, value });
    setItems(prevItems => {
      const newItems = [...prevItems];
      newItems[index] = { ...newItems[index], [field]: value };
      console.log('New items array:', newItems);
      return newItems;
    });
  };

  // Auto-fill unit price when product is selected
  const handleProductChange = (index: number, productId: number) => {
    console.log('handleProductChange called:', { index, productId, currentItems: items });
    updateLineItem(index, 'product_id', productId);

    // Find product and set suggested price (using total cost)
    const product = products.find((p: VentasProduct) => p.id === productId);
    console.log('Found product:', product);
    if (product) {
      const totalCost =
        (Number(product.costo_pasta) || 0) +
        (Number(product.costo_mano_obra) || 0) +
        (Number(product.costo_esmalte) || 0) +
        (Number(product.costo_horneado) || 0) +
        (Number(product.costo_h_sancocho) || 0);

      // Suggest price with 30% markup
      const suggestedPrice = totalCost * 1.3;
      console.log('Setting suggested price:', Math.ceil(suggestedPrice));
      updateLineItem(index, 'unit_price', Math.ceil(suggestedPrice));
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert('Por favor ingresa el nombre del cliente');
      return;
    }

    const validItems = items.filter(item => item.product_id > 0 && item.quantity > 0);
    if (validItems.length === 0) {
      alert('Por favor agrega al menos un producto');
      return;
    }

    const formData: QuoteFormData = {
      customer_name: customerName.trim(),
      customer_company: customerCompany.trim() || undefined,
      customer_email: customerEmail.trim() || undefined,
      customer_phone: customerPhone.trim() || undefined,
      customer_address: customerAddress.trim() || undefined,
      valid_until: validUntil || undefined,
      discount_percentage: discountPercentage || undefined,
      discount_amount: discountAmount || undefined,
      currency: 'MXN', // Always MXN
      notes: notes || undefined,
      terms_and_conditions: termsAndConditions || undefined,
      internal_notes: internalNotes || undefined,
      items: validItems,
    } as any;

    onSubmit(formData);
  };

  // Set default valid until date (30 days from now)
  useEffect(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    setValidUntil(date.toISOString().split('T')[0]);
  }, []);

  // Debug: Log items state changes
  useEffect(() => {
    console.log('Items state changed:', items);
  }, [items]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-6xl w-full my-8">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-lg z-10">
            <h2 className="text-2xl font-bold text-gray-900">
              {initialData ? 'Editar Cotización' : 'Nueva Cotización'}
            </h2>
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Customer Information - Manual Entry */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Información del Cliente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Cliente *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    placeholder="Nombre completo o razón social"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Empresa
                  </label>
                  <input
                    type="text"
                    value={customerCompany}
                    onChange={(e) => setCustomerCompany(e.target.value)}
                    placeholder="Nombre de la empresa"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    placeholder="correo@ejemplo.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    placeholder="Calle, número, colonia, ciudad..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Quote Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Válida Hasta
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moneda
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  <span className="text-gray-700 font-medium">MXN (Pesos Mexicanos)</span>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Productos</h3>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  + Agregar Producto
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      {/* Product */}
                      <div className="md:col-span-4">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Producto *
                        </label>
                        <select
                          value={item.product_id.toString()}
                          onChange={(e) => handleProductChange(index, Number(e.target.value))}
                          required
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="0">Seleccionar...</option>
                          {products.map((product: VentasProduct) => (
                            <option key={product.id} value={product.id.toString()}>
                              {product.name} - {product.tipo_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Cantidad *
                        </label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', Number(e.target.value))}
                          min={1}
                          required
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Precio Unit.
                        </label>
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updateLineItem(index, 'unit_price', Number(e.target.value))}
                          min={0}
                          step={0.01}
                          required
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Discount */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Desc. %
                        </label>
                        <input
                          type="number"
                          value={item.discount_percentage}
                          onChange={(e) => updateLineItem(index, 'discount_percentage', Number(e.target.value))}
                          min={0}
                          max={100}
                          step={0.01}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Line Total */}
                      <div className="md:col-span-1 flex items-end">
                        <div className="w-full">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Total
                          </label>
                          <div className="text-sm font-semibold text-gray-900 px-2 py-1.5">
                            ${calculateLineTotal(item).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <div className="md:col-span-1 flex items-end">
                        <button
                          type="button"
                          onClick={() => removeLineItem(index)}
                          disabled={items.length === 1}
                          className="w-full px-2 py-1.5 text-red-600 hover:text-red-800 disabled:text-gray-300 disabled:cursor-not-allowed"
                        >
                          <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Overall Discount */}
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Descuento General (Opcional)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Descuento %
                  </label>
                  <input
                    type="number"
                    value={discountPercentage}
                    onChange={(e) => {
                      setDiscountPercentage(Number(e.target.value));
                      setDiscountAmount(0); // Clear fixed discount
                    }}
                    min={0}
                    max={100}
                    step={0.01}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    O Monto Fijo (MXN)
                  </label>
                  <input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => {
                      setDiscountAmount(Number(e.target.value));
                      setDiscountPercentage(0); // Clear percentage discount
                    }}
                    min={0}
                    step={0.01}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Resumen</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${totals.subtotal.toFixed(2)} MXN</span>
                </div>
                {totals.discountTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Descuento:</span>
                    <span className="font-medium text-red-600">-${totals.discountTotal.toFixed(2)} MXN</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IVA (16%):</span>
                  <span className="font-medium">${totals.tax.toFixed(2)} MXN</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-green-300 pt-2">
                  <span>Total:</span>
                  <span className="text-green-600">${totals.total.toFixed(2)} MXN</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="grid grid-cols-1 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Notas visibles para el cliente..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Términos y Condiciones
                </label>
                <textarea
                  value={termsAndConditions}
                  onChange={(e) => setTermsAndConditions(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Términos y condiciones de la cotización..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas Internas
                </label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Notas privadas (no visibles para el cliente)..."
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 sticky bottom-0 bg-white rounded-b-lg">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Guardando...' : (initialData ? 'Actualizar Cotización' : 'Crear Cotización')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VentasQuoteForm;
