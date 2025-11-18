import React, { useState } from 'react';
import {
  useProducts,
  useSizes,
  useColors,
  useCreateProduct,
  useCreateSize,
  useCreateColor
} from '../../hooks/useCeramicsQueries';

const ProductosManagement: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'products' | 'sizes' | 'colors'>('products');
  const [showProductForm, setShowProductForm] = useState(false);
  const [showSizeForm, setShowSizeForm] = useState(false);
  const [showColorForm, setShowColorForm] = useState(false);

  // Product form state
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');

  // Size form state
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [sizeName, setSizeName] = useState('');
  const [sizeCode, setSizeCode] = useState('');
  const [sizeOrder, setSizeOrder] = useState('');

  // Color form state
  const [colorName, setColorName] = useState('');
  const [colorCode, setColorCode] = useState('');
  const [hexCode, setHexCode] = useState('#CCCCCC');

  const { data: productsData, isLoading: productsLoading } = useProducts();
  const { data: sizesData, isLoading: sizesLoading } = useSizes();
  const { data: colorsData, isLoading: colorsLoading } = useColors();

  const createProductMutation = useCreateProduct();
  const createSizeMutation = useCreateSize();
  const createColorMutation = useCreateColor();

  const products = productsData?.products || [];
  const sizes = sizesData?.sizes || [];
  const colors = colorsData?.colors || [];

  // Group sizes by product
  const sizesByProduct = sizes.reduce((acc, size) => {
    if (!acc[size.product_name!]) {
      acc[size.product_name!] = [];
    }
    acc[size.product_name!].push(size);
    return acc;
  }, {} as Record<string, typeof sizes>);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;

    try {
      await createProductMutation.mutateAsync({
        name: productName,
        description: productDescription || undefined
      });
      setProductName('');
      setProductDescription('');
      setShowProductForm(false);
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  const handleCreateSize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !sizeName.trim()) return;

    try {
      await createSizeMutation.mutateAsync({
        product_id: selectedProductId,
        size_name: sizeName,
        size_code: sizeCode || undefined,
        size_order: sizeOrder ? parseInt(sizeOrder) : undefined
      });
      setSizeName('');
      setSizeCode('');
      setSizeOrder('');
      setShowSizeForm(false);
    } catch (error) {
      console.error('Error creating size:', error);
    }
  };

  const handleCreateColor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colorName.trim()) return;

    try {
      await createColorMutation.mutateAsync({
        color_name: colorName,
        color_code: colorCode || undefined,
        hex_code: hexCode
      });
      setColorName('');
      setColorCode('');
      setHexCode('#CCCCCC');
      setShowColorForm(false);
    } catch (error) {
      console.error('Error creating color:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveSection('products')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeSection === 'products'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Productos ({products.length})
          </button>
          <button
            onClick={() => setActiveSection('sizes')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeSection === 'sizes'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Tamaños ({sizes.length})
          </button>
          <button
            onClick={() => setActiveSection('colors')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeSection === 'colors'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Colores ({colors.length})
          </button>
        </nav>
      </div>

      {/* Products Section */}
      {activeSection === 'products' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Productos de Cerámica</h3>
            <button
              onClick={() => setShowProductForm(!showProductForm)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              {showProductForm ? 'Cancelar' : '+ Nuevo Producto'}
            </button>
          </div>

          {showProductForm && (
            <form onSubmit={handleCreateProduct} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ej: Ceniceros"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción (Opcional)
                </label>
                <textarea
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="Descripción del producto..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={createProductMutation.isPending}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300"
              >
                {createProductMutation.isPending ? 'Creando...' : 'Crear Producto'}
              </button>
            </form>
          )}

          {productsLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product.id} className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{product.name}</h4>
                      {product.description && (
                        <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                      )}
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          product.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {product.size_count} tamaños
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sizes Section */}
      {activeSection === 'sizes' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Tamaños por Producto</h3>
            <button
              onClick={() => setShowSizeForm(!showSizeForm)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              {showSizeForm ? 'Cancelar' : '+ Nuevo Tamaño'}
            </button>
          </div>

          {showSizeForm && (
            <form onSubmit={handleCreateSize} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Producto *
                </label>
                <select
                  value={selectedProductId || ''}
                  onChange={(e) => setSelectedProductId(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar producto</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Tamaño *
                  </label>
                  <input
                    type="text"
                    value={sizeName}
                    onChange={(e) => setSizeName(e.target.value)}
                    placeholder="Ej: Extra Grande"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código
                  </label>
                  <input
                    type="text"
                    value={sizeCode}
                    onChange={(e) => setSizeCode(e.target.value)}
                    placeholder="XG"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Orden (para ordenar)
                </label>
                <input
                  type="number"
                  value={sizeOrder}
                  onChange={(e) => setSizeOrder(e.target.value)}
                  placeholder="1, 2, 3..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={createSizeMutation.isPending}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300"
              >
                {createSizeMutation.isPending ? 'Creando...' : 'Crear Tamaño'}
              </button>
            </form>
          )}

          {sizesLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(sizesByProduct).map(([productName, productSizes]) => (
                <div key={productName} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">{productName}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {productSizes.map((size) => (
                      <div
                        key={size.id}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm"
                      >
                        <span className="font-medium">{size.size_name}</span>
                        {size.size_code && (
                          <span className="ml-2 text-gray-500">({size.size_code})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Colors Section */}
      {activeSection === 'colors' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Colores de Esmalte</h3>
            <button
              onClick={() => setShowColorForm(!showColorForm)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              {showColorForm ? 'Cancelar' : '+ Nuevo Color'}
            </button>
          </div>

          {showColorForm && (
            <form onSubmit={handleCreateColor} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Color *
                  </label>
                  <input
                    type="text"
                    value={colorName}
                    onChange={(e) => setColorName(e.target.value)}
                    placeholder="Ej: Azul Marino"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código
                  </label>
                  <input
                    type="text"
                    value={colorCode}
                    onChange={(e) => setColorCode(e.target.value)}
                    placeholder="AM"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color (Hex)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={hexCode}
                    onChange={(e) => setHexCode(e.target.value)}
                    className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={hexCode}
                    onChange={(e) => setHexCode(e.target.value)}
                    placeholder="#CCCCCC"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={createColorMutation.isPending}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300"
              >
                {createColorMutation.isPending ? 'Creando...' : 'Crear Color'}
              </button>
            </form>
          )}

          {colorsLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {colors.map((color) => (
                <div
                  key={color.id}
                  className="p-3 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded border border-gray-300"
                      style={{ backgroundColor: color.hex_code || '#CCCCCC' }}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{color.color_name}</div>
                      {color.color_code && (
                        <div className="text-xs text-gray-500">{color.color_code}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductosManagement;
