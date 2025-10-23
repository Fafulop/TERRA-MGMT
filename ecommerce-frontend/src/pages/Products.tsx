import { ShopifyProduct } from '../components/ShopifyProduct';

export const Products: React.FC = () => {
  // You can add more product IDs here as you add products to your Shopify store
  const productIds = [
    '8299395809420', // First product
    '8299447058572', // Second product
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-terracotta-900 mb-4">
          Nuestros Productos
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Explora nuestra colección de productos artesanales hechos a mano
        </p>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {productIds.map((productId) => (
          <ShopifyProduct
            key={productId}
            productId={productId}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow"
          />
        ))}
      </div>

      {/* Information Banner */}
      <div className="mt-16 bg-terracotta-50 rounded-lg p-8 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-terracotta-900 mb-4">
          Información de Compra
        </h2>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start">
            <span className="text-terracotta-600 mr-2">•</span>
            Los productos son artesanales y pueden variar en tonos y forma
          </li>
          <li className="flex items-start">
            <span className="text-terracotta-600 mr-2">•</span>
            Los precios están en MXN (Pesos Mexicanos)
          </li>
          <li className="flex items-start">
            <span className="text-terracotta-600 mr-2">•</span>
            Envío a toda la República Mexicana
          </li>
          <li className="flex items-start">
            <span className="text-terracotta-600 mr-2">•</span>
            Pago seguro procesado por Shopify
          </li>
        </ul>
      </div>
    </div>
  );
};
