import React, { useState } from 'react';
import {
  useProducts,
  useCreateProduct,
  useItemCategories,
  useColors
} from '../../hooks/useCeramicsQueries';
import { Concepto, CeramicProduct } from '../../types/ceramics';

const ProductsTab: React.FC = () => {
  const { data: productsData, isLoading: productsLoading } = useProducts('active');
  const { data: categoriesData } = useItemCategories('active');
  const { data: colorsData } = useColors('active');
  const createProductMutation = useCreateProduct();

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    item_category_id: '',
    concepto: '' as Concepto | '',
    size_cm: '',
    capacity_ml: '',
    size_description: '',
    enamel_color_id: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate ESMALTADO products have color
    if (formData.concepto === 'ESMALTADO' && !formData.enamel_color_id) {
      alert('Los productos ESMALTADO requieren un color');
      return;
    }

    const productData = {
      name: formData.name,
      description: formData.description || undefined,
      item_category_id: parseInt(formData.item_category_id),
      concepto: formData.concepto as Concepto,
      size_cm: formData.size_cm ? parseFloat(formData.size_cm) : undefined,
      capacity_ml: formData.capacity_ml ? parseFloat(formData.capacity_ml) : undefined,
      size_description: formData.size_description || undefined,
      enamel_color_id: formData.enamel_color_id ? parseInt(formData.enamel_color_id) : undefined
    };

    try {
      await createProductMutation.mutateAsync(productData);
      setIsAdding(false);
      setFormData({
        name: '',
        description: '',
        item_category_id: '',
        concepto: '',
        size_cm: '',
        capacity_ml: '',
        size_description: '',
        enamel_color_id: ''
      });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al crear el producto');
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setFormData({
      name: '',
      description: '',
      item_category_id: '',
      concepto: '',
      size_cm: '',
      capacity_ml: '',
      size_description: '',
      enamel_color_id: ''
    });
  };

  // Clear enamel_color_id when concepto changes to non-ESMALTADO
  const handleConceptoChange = (value: string) => {
    setFormData({
      ...formData,
      concepto: value as Concepto | '',
      enamel_color_id: value === 'ESMALTADO' ? formData.enamel_color_id : ''
    });
  };

  if (productsLoading) {
    return <div className="text-center py-4">Cargando productos...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Create Product Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Productos</h2>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              + Crear Producto
            </button>
          )}
        </div>

        {isAdding && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
            <h3 className="text-lg font-medium mb-4">Nuevo Producto</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Plato Hondo Mediano"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción opcional del producto"
                  rows={2}
                />
              </div>

              {/* Product Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Producto *
                </label>
                <select
                  required
                  value={formData.item_category_id}
                  onChange={(e) => setFormData({ ...formData, item_category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar tipo...</option>
                  {categoriesData?.categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Concepto (Stage) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Concepto (Etapa) *
                </label>
                <select
                  required
                  value={formData.concepto}
                  onChange={(e) => handleConceptoChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar concepto...</option>
                  <option value="CRUDO">CRUDO (Sin hornear)</option>
                  <option value="SANCOCHADO">SANCOCHADO (Horno bajo)</option>
                  <option value="ESMALTADO">ESMALTADO (Horno alto + color)</option>
                </select>
              </div>

              {/* Enamel Color (only for ESMALTADO) */}
              {formData.concepto === 'ESMALTADO' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color del Esmalte *
                  </label>
                  <select
                    required
                    value={formData.enamel_color_id}
                    onChange={(e) => setFormData({ ...formData, enamel_color_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar color...</option>
                    {colorsData?.colors.map((color) => (
                      <option key={color.id} value={color.id}>
                        {color.color_name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Los productos ESMALTADO requieren un color
                  </p>
                </div>
              )}

              {/* Size in cm */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tamaño (cm)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.size_cm}
                  onChange={(e) => setFormData({ ...formData, size_cm: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 25.5"
                />
              </div>

              {/* Capacity in ml */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacidad (ml)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.capacity_ml}
                  onChange={(e) => setFormData({ ...formData, capacity_ml: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 350"
                />
              </div>

              {/* Size Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción del Tamaño
                </label>
                <input
                  type="text"
                  value={formData.size_description}
                  onChange={(e) => setFormData({ ...formData, size_description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Mediano, Grande, 12 oz"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createProductMutation.isPending}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                Crear Producto
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Products List */}
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Lista de Productos</h3>
          {productsData?.products && productsData.products.length > 0 ? (
            <div className="space-y-3">
              {productsData.products.map((product: CeramicProduct) => (
                <div
                  key={product.id}
                  className="border border-gray-200 rounded-md p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-medium">{product.name}</h4>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {product.concepto}
                        </span>
                        {product.enamel_color_name && (
                          <span
                            className="px-2 py-1 text-xs font-medium rounded-full border"
                            style={{
                              backgroundColor: product.enamel_color_hex || '#CCCCCC',
                              color: '#000'
                            }}
                          >
                            {product.enamel_color_name}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">{product.item_category_name}</span>
                        {product.description && ` - ${product.description}`}
                      </div>
                      <div className="flex gap-4 text-sm text-gray-500 mt-2">
                        {product.size_cm && <span>Tamaño: {product.size_cm} cm</span>}
                        {product.capacity_ml && <span>Capacidad: {product.capacity_ml} ml</span>}
                        {product.size_description && <span>{product.size_description}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No hay productos registrados. Haz clic en "Crear Producto" para agregar uno.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsTab;
