import { ProductCard } from '../components/ProductCard';

export const Products: React.FC = () => {
  // Product data with IDs and images
  // TODO: Replace placeholder images with actual product images
  const products = [
    {
      id: '8299395809420',
      name: 'Juego de vajilla para botanas',
      description: `El kit incluye 6 piezas:
• 1 plato trinche de 27 cm
• 1 bowl grande de 20 cm
• 2 bowls chicos de 15 cm
• 2 salseros de 100 ml`,
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
      name: 'Kit de tarros cerveceros',
      description: `El kit incluye 4 piezas:
• 4 tarros de 450 ml`,
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
      name: 'Kit tequileros',
      description: `El kit incluye 8 piezas:
• 6 tequileros de 100 ml
• 2 salseros de 100 ml`,
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
      name: 'Kit de tazas grandes para café',
      description: `El kit incluye 8 piezas:
• 4 tazas de 240 ml
• 4 platitos de 11 cm`,
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
      name: 'Kit de tazas grandes y chicas para café',
      description: `El kit incluye 8 piezas:
• 2 tazas grandes de 240 ml
• 2 tazas chicas de 120 ml
• 4 platitos grandes de 11 cm`,
      images: [
        'https://via.placeholder.com/600x600/d2bab0/ffffff?text=Kit+5+-+1',
        'https://via.placeholder.com/600x600/bfa094/ffffff?text=Kit+5+-+2',
        'https://via.placeholder.com/600x600/977669/ffffff?text=Kit+5+-+3',
        'https://via.placeholder.com/600x600/846358/ffffff?text=Kit+5+-+4',
        'https://via.placeholder.com/600x600/43302b/ffffff?text=Kit+5+-+5',
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Product Grid - Mobile Optimized */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            productId={product.id}
            images={product.images}
            productName={product.name}
            description={product.description}
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
