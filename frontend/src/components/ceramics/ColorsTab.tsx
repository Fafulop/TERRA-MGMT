import React, { useState } from 'react';
import { useColors, useCreateColor, useUpdateColor } from '../../hooks/useCeramicsQueries';
import { CeramicEnamelColor } from '../../types/ceramics';

const ColorsTab: React.FC = () => {
  const { data: colorsData, isLoading } = useColors('active');
  const createColorMutation = useCreateColor();
  const updateColorMutation = useUpdateColor();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    color_name: '',
    color_code: '',
    hex_code: '#CCCCCC'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      await updateColorMutation.mutateAsync({
        id: editingId,
        data: formData
      });
      setEditingId(null);
    } else {
      await createColorMutation.mutateAsync(formData);
      setIsAdding(false);
    }

    setFormData({ color_name: '', color_code: '', hex_code: '#CCCCCC' });
  };

  const handleEdit = (color: CeramicEnamelColor) => {
    setEditingId(color.id);
    setFormData({
      color_name: color.color_name,
      color_code: color.color_code || '',
      hex_code: color.hex_code || '#CCCCCC'
    });
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ color_name: '', color_code: '', hex_code: '#CCCCCC' });
  };

  if (isLoading) {
    return <div className="text-center py-4">Cargando colores...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Colores</h2>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              + Agregar Color
            </button>
          )}
        </div>

        {isAdding && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
            <h3 className="text-lg font-medium mb-4">{editingId ? 'Editar Color' : 'Nuevo Color'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Color *
                </label>
                <input
                  type="text"
                  required
                  value={formData.color_name}
                  onChange={(e) => setFormData({ ...formData, color_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Azul Marino"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código (opcional)
                </label>
                <input
                  type="text"
                  value={formData.color_code}
                  onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: AM-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color Hex
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.hex_code}
                    onChange={(e) => setFormData({ ...formData, hex_code: e.target.value })}
                    className="w-16 h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.hex_code}
                    onChange={(e) => setFormData({ ...formData, hex_code: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#CCCCCC"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                disabled={createColorMutation.isPending || updateColorMutation.isPending}
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
          {colorsData?.colors.map((color) => (
            <div
              key={color.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-md border border-gray-300"
                  style={{ backgroundColor: color.hex_code || '#CCCCCC' }}
                ></div>
                <div>
                  <div className="font-medium">{color.color_name}</div>
                  <div className="text-sm text-gray-500">
                    {color.color_code && `Código: ${color.color_code} | `}
                    {color.hex_code || '#CCCCCC'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleEdit(color)}
                className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded-md hover:bg-blue-50"
              >
                Editar
              </button>
            </div>
          ))}
        </div>

        {colorsData?.colors.length === 0 && !isAdding && (
          <div className="text-center py-8 text-gray-500">
            No hay colores registrados. Haz clic en "Agregar Color" para crear uno.
          </div>
        )}
      </div>
    </div>
  );
};

export default ColorsTab;
