import { ProductCard } from '../components/ProductCard';
import { useShopifyProduct } from '../hooks/useShopifyProduct';

// Placeholder images for products without Shopify images
const placeholderImages = (kitNumber: number) => [
  `https://via.placeholder.com/600x600/d2bab0/ffffff?text=Kit+${kitNumber}+-+1`,
  `https://via.placeholder.com/600x600/bfa094/ffffff?text=Kit+${kitNumber}+-+2`,
  `https://via.placeholder.com/600x600/977669/ffffff?text=Kit+${kitNumber}+-+3`,
  `https://via.placeholder.com/600x600/846358/ffffff?text=Kit+${kitNumber}+-+4`,
  `https://via.placeholder.com/600x600/43302b/ffffff?text=Kit+${kitNumber}+-+5`,
];

export const Products: React.FC = () => {
  // Fetch images from Shopify for all kits
  const kit1 = useShopifyProduct('8299395809420');
  const kit2 = useShopifyProduct('8299447058572');
  const kit3 = useShopifyProduct('8299446042764');
  const kit4 = useShopifyProduct('8299447222412');
  const kit5 = useShopifyProduct('8299447517324');
  const kit6 = useShopifyProduct('8349929930892');

  // Product data with IDs and images
  const products = [
    {
      id: '8299395809420',
      name: 'Juego de vajilla para botanas',
      description: `El kit incluye 6 piezas:
• 1 plato trinche de 27 cm
• 1 bowl grande de 20 cm
• 2 bowls chicos de 15 cm
• 2 salseros de 100 ml`,
      images: kit1.images.length > 0 ? kit1.images : placeholderImages(1),
      isLoading: kit1.isLoading,
    },
    {
      id: '8299447058572',
      name: 'Kit de tarros cerveceros',
      description: `El kit incluye 4 piezas:
• 4 tarros de 450 ml`,
      images: kit2.images.length > 0 ? kit2.images : placeholderImages(2),
      isLoading: kit2.isLoading,
    },
    {
      id: '8299446042764',
      name: 'Kit tequileros',
      description: `El kit incluye 8 piezas:
• 6 tequileros de 100 ml
• 2 salseros de 100 ml`,
      images: kit3.images.length > 0 ? kit3.images : placeholderImages(3),
      isLoading: kit3.isLoading,
    },
    {
      id: '8299447222412',
      name: 'Kit de tazas grandes para café',
      description: `El kit incluye 8 piezas:
• 4 tazas de 240 ml
• 4 platitos de 11 cm`,
      images: kit4.images.length > 0 ? kit4.images : placeholderImages(4),
      isLoading: kit4.isLoading,
    },
    {
      id: '8299447517324',
      name: 'Kit de tazas grandes y chicas para café',
      description: `El kit incluye 8 piezas:
• 2 tazas grandes de 240 ml
• 2 tazas chicas de 140 ml
• 4 platitos grandes de 11 cm`,
      images: kit5.images.length > 0 ? kit5.images : placeholderImages(5),
      isLoading: kit5.isLoading,
    },
    {
      id: '8349929930892',
      name: 'Kit vasos',
      description: `El kit incluye 4 piezas:
• 4 vasos de 450 ml`,
      images: kit6.images.length > 0 ? kit6.images : placeholderImages(6),
      isLoading: kit6.isLoading,
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
