import React, { useState } from 'react';
import { useProducts, useSizesByProduct, useAddToStage1 } from '../../hooks/useCeramicsQueries';

interface Stage1InputFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const Stage1InputForm: React.FC<Stage1InputFormProps> = ({ onSuccess, onCancel }) => {
  const [productId, setProductId] = useState<number | null>(null);
  const [sizeId, setSizeId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  const { data: productsData, isLoading: productsLoading } = useProducts();
  const { data: sizesData, isLoading: sizesLoading } = useSizesByProduct(productId);
  const addToStage1Mutation = useAddToStage1();

  const products = productsData?.products || [];
  const sizes = sizesData?.sizes || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!productId || !sizeId || !quantity) {
      setError('Producto, tamaño y cantidad son requeridos');
      return;
    }

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError('La cantidad debe ser un número positivo');
      return;
    }

    try {
      await addToStage1Mutation.mutateAsync({
        product_id: productId,
        size_id: sizeId,
        quantity: quantityNum,
        notes: notes.trim() || undefined,
      });

      // Reset form
      setProductId(null);
      setSizeId(null);
      setQuantity('');
      setNotes('');

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al agregar al inventario');
    }
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setProductId(value ? parseInt(value) : null);
    setSizeId(null); // Reset size when product changes
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Agregar Entrada - Etapa 1 (Crudo)</h2>
        <p className="text-sm text-gray-600 mt-1">
          Registra la recepción de productos crudos (sin sancochado)
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {addToStage1Mutation.isSuccess && !error && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">Entrada registrada exitosamente</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Producto <span className="text-red-500">*</span>
          </label>
          <select
            value={productId || ''}
            onChange={handleProductChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            disabled={productsLoading}
          >
            <option value="">Seleccionar producto</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>

        {/* Size Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tamaño <span className="text-red-500">*</span>
          </label>
          <select
            value={sizeId || ''}
            onChange={(e) => setSizeId(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            disabled={!productId || sizesLoading}
          >
            <option value="">Seleccionar tamaño</option>
            {sizes.map((size) => (
              <option key={size.id} value={size.id}>
                {size.size_name} {size.size_code && `(${size.size_code})`}
              </option>
            ))}
          </select>
          {!productId && (
            <p className="text-xs text-gray-500 mt-1">Primero selecciona un producto</p>
          )}
        </div>

        {/* Quantity Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cantidad <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="0"
            step="1"
            placeholder="Ej: 100"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Cantidad de piezas que se recibieron</p>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas (Opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Observaciones adicionales..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={addToStage1Mutation.isPending || !productId || !sizeId || !quantity}
            className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {addToStage1Mutation.isPending ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </span>
            ) : (
              'Guardar Entrada'
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default Stage1InputForm;
