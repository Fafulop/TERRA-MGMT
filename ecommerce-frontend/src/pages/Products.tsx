import { ProductCard } from '../components/ProductCard';

export const Products: React.FC = () => {
  // Product data with IDs and images
  // TODO: Replace placeholder images with actual product images
  const products = [
    {
      id: '8299395809420',
      name: 'Kit Botanero',
      images: [
        'https://via.placeholder.com/600x600/d2bab0/ffffff?text=Kit+Botanero+1',
        'https://via.placeholder.com/600x600/bfa094/ffffff?text=Kit+Botanero+2',
        'https://via.placeholder.com/600x600/977669/ffffff?text=Kit+Botanero+3',
        'https://via.placeholder.com/600x600/846358/ffffff?text=Kit+Botanero+4',
        'https://via.placeholder.com/600x600/43302b/ffffff?text=Kit+Botanero+5',
      ],
    },
    {
      id: '8299447058572',
      name: 'Kit 2',
      images: [
        'https://via.placeholder.com/600x600/d2bab0/ffffff?text=Kit+2+-+1',
        'https://via.placeholder.com/600x600/bfa094/ffffff?text=Kit+2+-+2',
        'https://via.placeholder.com/600x600/977669/ffffff?text=Kit+2+-+3',
        'https://via.placeholder.com/600x600/846358/ffffff?text=Kit+2+-+4',
        'https://via.placeholder.com/600x600/43302b/ffffff?text=Kit+2+-+5',
      ],
    },
    {
      id: '8299446042764',
      name: 'Kit 3',
      images: [
        'https://via.placeholder.com/600x600/d2bab0/ffffff?text=Kit+3+-+1',
        'https://via.placeholder.com/600x600/bfa094/ffffff?text=Kit+3+-+2',
        'https://via.placeholder.com/600x600/977669/ffffff?text=Kit+3+-+3',
        'https://via.placeholder.com/600x600/846358/ffffff?text=Kit+3+-+4',
        'https://via.placeholder.com/600x600/43302b/ffffff?text=Kit+3+-+5',
      ],
    },
    {
      id: '8299447222412',
      name: 'Kit 4',
      images: [
        'https://via.placeholder.com/600x600/d2bab0/ffffff?text=Kit+4+-+1',
        'https://via.placeholder.com/600x600/bfa094/ffffff?text=Kit+4+-+2',
        'https://via.placeholder.com/600x600/977669/ffffff?text=Kit+4+-+3',
        'https://via.placeholder.com/600x600/846358/ffffff?text=Kit+4+-+4',
        'https://via.placeholder.com/600x600/43302b/ffffff?text=Kit+4+-+5',
      ],
    },
    {
      id: '8299447517324',
      name: 'Kit 5',
      images: [
        'https://via.placeholder.com/600x600/d2bab0/ffffff?text=Kit+5+-+1',
        'https://via.placeholder.com/600x600/bfa094/ffffff?text=Kit+5+-+2',
        'https://via.placeholder.com/600x600/977669/ffffff?text=Kit+5+-+3',
        'https://via.placeholder.com/600x600/846358/ffffff?text=Kit+5+-+4',
        'https://via.placeholder.com/600x600/43302b/ffffff?text=Kit+5+-+5',
      ],
    },
    {
      id: '8299445289100',
      name: 'Kit 6',
      images: [
        'https://via.placeholder.com/600x600/d2bab0/ffffff?text=Kit+6+-+1',
        'https://via.placeholder.com/600x600/bfa094/ffffff?text=Kit+6+-+2',
        'https://via.placeholder.com/600x600/977669/ffffff?text=Kit+6+-+3',
        'https://via.placeholder.com/600x600/846358/ffffff?text=Kit+6+-+4',
        'https://via.placeholder.com/600x600/43302b/ffffff?text=Kit+6+-+5',
      ],
    },
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

      {/* Product Grid - Mobile Optimized */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            productId={product.id}
            images={product.images}
            productName={product.name}
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
