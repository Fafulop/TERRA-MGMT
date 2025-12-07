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
      <div className="mt-16 bg-terracotta-50 rounded-lg p-8 max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-terracotta-900 mb-4">
          Información de Compra
        </h2>
        <ul className="space-y-2 text-gray-700 inline-block text-left">
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

        <div className="mt-6 pt-6 border-t border-terracotta-200">
          <p className="text-sm font-semibold text-terracotta-800 flex items-center justify-center gap-1">
            <span>Máximo 4 kits por checkout. En caso de requerir más, favor de crear nuevo checkout o contáctanos vía</span>
            <a
              href="https://www.instagram.com/terracotta.terracotta/?hl=en"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex text-terracotta-600 hover:text-terracotta-700 transition-colors"
              aria-label="Instagram"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
