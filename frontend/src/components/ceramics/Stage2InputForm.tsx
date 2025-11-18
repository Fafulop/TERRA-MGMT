import React, { useState, useEffect } from 'react';
import {
  useProducts,
  useSizesByProduct,
  useTransitionStage1To2,
  useStage1Inventory
} from '../../hooks/useCeramicsQueries';

interface Stage2InputFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const Stage2InputForm: React.FC<Stage2InputFormProps> = ({ onSuccess, onCancel }) => {
  const [productId, setProductId] = useState<number | null>(null);
  const [sizeId, setSizeId] = useState<number | null>(null);
  const [quantityInput, setQuantityInput] = useState<string>(''); // What came OUT
  const [quantityDeducted, setQuantityDeducted] = useState<string>(''); // What went IN
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  const { data: productsData, isLoading: productsLoading } = useProducts();
  const { data: sizesData, isLoading: sizesLoading } = useSizesByProduct(productId);
  const { data: stage1Data } = useStage1Inventory();
  const transitionMutation = useTransitionStage1To2();

  const products = productsData?.products || [];
  const sizes = sizesData?.sizes || [];
  const stage1Inventory = stage1Data?.inventory || [];

  // Find available quantity in Stage 1 for selected product and size
  const availableInStage1 = stage1Inventory.find(
    (item) => item.product_id === productId && item.size_id === sizeId
  );

  // Calculate loss
  const quantityInputNum = parseFloat(quantityInput) || 0;
  const quantityDeductedNum = parseFloat(quantityDeducted) || 0;
  const loss = quantityDeductedNum - quantityInputNum;
  const lossPercentage = quantityDeductedNum > 0 ? (loss / quantityDeductedNum) * 100 : 0;
  const remainingInStage1 = (availableInStage1?.quantity || 0) - quantityDeductedNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!productId || !sizeId || !quantityInput || !quantityDeducted) {
      setError('Producto, tamaño, cantidad de entrada y salida son requeridos');
      return;
    }

    if (quantityInputNum <= 0 || quantityDeductedNum <= 0) {
      setError('Las cantidades deben ser números positivos');
      return;
    }

    if (quantityInputNum > quantityDeductedNum) {
      setError('La cantidad que salió no puede ser mayor a la que entró');
      return;
    }

    if (quantityDeductedNum > (availableInStage1?.quantity || 0)) {
      setError(`No hay suficiente inventario en Etapa 1. Disponible: ${availableInStage1?.quantity || 0}`);
      return;
    }

    try {
      await transitionMutation.mutateAsync({
        product_id: productId,
        size_id: sizeId,
        quantity_input: quantityInputNum,
        quantity_deducted: quantityDeductedNum,
        notes: notes.trim() || undefined,
      });

      // Reset form
      setProductId(null);
      setSizeId(null);
      setQuantityInput('');
      setQuantityDeducted('');
      setNotes('');

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrar transición');
    }
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setProductId(value ? parseInt(value) : null);
    setSizeId(null);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Registrar Salida - Etapa 2 (Sancochado)
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Registra el resultado del horno bajo (sancochado). Se descontará automáticamente de Etapa 1.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {transitionMutation.isSuccess && !error && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">Transición registrada exitosamente</p>
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
        </div>

        {/* Available Stock Display */}
        {productId && sizeId && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                Stock disponible en Etapa 1:
              </span>
              <span className="text-lg font-bold text-blue-900">
                {availableInStage1?.quantity?.toLocaleString() || 0} piezas
              </span>
            </div>
            {!availableInStage1 || availableInStage1.quantity === 0 && (
              <p className="text-xs text-red-600 mt-1">
                No hay inventario disponible para este producto/tamaño en Etapa 1
              </p>
            )}
          </div>
        )}

        {/* Quantity Deducted (IN) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cantidad que ENTRÓ al horno <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={quantityDeducted}
            onChange={(e) => setQuantityDeducted(e.target.value)}
            min="0"
            step="1"
            placeholder="Ej: 90"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Cantidad de piezas que se metieron al horno
          </p>
        </div>

        {/* Quantity Input (OUT) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cantidad que SALIÓ del horno <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={quantityInput}
            onChange={(e) => setQuantityInput(e.target.value)}
            min="0"
            step="1"
            placeholder="Ej: 85"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Cantidad de piezas que salieron sin romperse
          </p>
        </div>

        {/* Loss Calculation Display */}
        {quantityDeductedNum > 0 && quantityInputNum >= 0 && (
          <div className={`p-4 rounded-lg border ${loss > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Pérdida:</span>
                <span className={`text-lg font-bold ${loss > 0 ? 'text-orange-700' : 'text-green-700'}`}>
                  {loss} piezas ({lossPercentage.toFixed(2)}%)
                </span>
              </div>
              {lossPercentage > 15 && (
                <div className="flex items-center text-xs text-orange-700">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Pérdida alta (mayor al 15%)
                </div>
              )}
              <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                <span className="text-sm font-medium text-gray-700">Quedará en Etapa 1:</span>
                <span className={`text-base font-bold ${remainingInStage1 < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {remainingInStage1} piezas
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas (Opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Razón de la pérdida, observaciones..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={
              transitionMutation.isPending ||
              !productId ||
              !sizeId ||
              !quantityInput ||
              !quantityDeducted ||
              remainingInStage1 < 0
            }
            className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {transitionMutation.isPending ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </span>
            ) : (
              'Guardar Transición'
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

export default Stage2InputForm;
