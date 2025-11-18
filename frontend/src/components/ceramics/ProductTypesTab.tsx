import React, { useState } from 'react';
import { useItemCategories, useCreateItemCategory, useUpdateItemCategory } from '../../hooks/useCeramicsQueries';
import { ItemCategory } from '../../types/ceramics';

const ProductTypesTab: React.FC = () => {
  const { data: categoriesData, isLoading } = useItemCategories('active');
  const createCategoryMutation = useCreateItemCategory();
  const updateCategoryMutation = useUpdateItemCategory();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      await updateCategoryMutation.mutateAsync({
        id: editingId,
        data: formData
      });
      setEditingId(null);
    } else {
      await createCategoryMutation.mutateAsync(formData);
      setIsAdding(false);
    }

    setFormData({ name: '', description: '' });
  };

  const handleEdit = (category: ItemCategory) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      description: category.description || ''
    });
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', description: '' });
  };

  if (isLoading) {
    return <div className="text-center py-4">Cargando tipos de producto...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Tipos de Producto</h2>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              + Agregar Tipo
            </button>
          )}
        </div>

        {isAdding && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
            <h3 className="text-lg font-medium mb-4">{editingId ? 'Editar Tipo' : 'Nuevo Tipo'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: PLATO, VASO, TAZA"
                />
                <p className="text-xs text-gray-500 mt-1">Se convertirá automáticamente a mayúsculas</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Platos de diferentes tamaños"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                {editingId ? 'Actualizar' : 'Guardar'}
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

        <div className="space-y-2">
          {categoriesData?.categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
            >
              <div>
                <div className="font-medium text-lg">{category.name}</div>
                {category.description && (
                  <div className="text-sm text-gray-500">{category.description}</div>
                )}
              </div>
              <button
                onClick={() => handleEdit(category)}
                className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded-md hover:bg-blue-50"
              >
                Editar
              </button>
            </div>
          ))}
        </div>

        {categoriesData?.categories.length === 0 && !isAdding && (
          <div className="text-center py-8 text-gray-500">
            No hay tipos de producto registrados. Haz clic en "Agregar Tipo" para crear uno.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductTypesTab;
