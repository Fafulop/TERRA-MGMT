import { ProductCard } from '../components/ProductCard';

export const Products: React.FC = () => {
  // Product data with IDs and images
  // TODO: Replace placeholder images with actual product images
  const products = [
    {
      id: '8299395809420',
      name: 'Kit Botanero',
      description: `Kit Botanero artesanal elaborado con cerámica de alta calidad. Perfecto para servir botanas y aperitivos con estilo.

Características:
• Hecho 100% a mano por artesanos mexicanos
• Cerámica de alta temperatura
• Diseño único y tradicional
• Incluye múltiples piezas para servir
• Acabado en tonos terracota naturales

Cada pieza es única y puede presentar ligeras variaciones en color y forma, lo que garantiza su autenticidad artesanal.

Ideal para reuniones familiares, fiestas, o como regalo especial.`,
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
      description: `Elegante set de cerámica artesanal con diseño contemporáneo. Combina la tradición mexicana con líneas modernas.

Características:
• Cerámica de gres esmaltada
• Resistente al horno y microondas
• Diseño versátil y funcional
• Colores vibrantes y duraderos
• Fácil de limpiar

Perfecto para el uso diario o para ocasiones especiales. Cada pieza ha sido cuidadosamente elaborada para garantizar calidad y durabilidad.`,
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
      description: `Colección artesanal de cerámica con acabados rústicos. Ideal para crear un ambiente cálido y acogedor en tu hogar.

Características:
• Acabado mate natural
• Textura única en cada pieza
• Diseño inspirado en la tradición oaxaqueña
• Materiales 100% naturales
• Sustentable y ecológico

Cada kit incluye piezas cuidadosamente seleccionadas que combinan funcionalidad con arte tradicional mexicano.`,
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
      description: `Set premium de cerámica artesanal con diseños exclusivos. Perfecta fusión entre arte y funcionalidad.

Características:
• Diseños únicos pintados a mano
• Cerámica de alta calidad
• Resistente a temperaturas altas
• Apto para lavavajillas
• Certificado de autenticidad incluido

Ideal para coleccionistas o para quienes buscan piezas únicas que cuenten una historia. Elaborado por maestros artesanos con más de 20 años de experiencia.`,
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
      description: `Conjunto artesanal de cerámica con tonos tierra. Perfecto para servir y decorar con estilo mexicano auténtico.

Características:
• Tonalidades naturales de terracota
• Acabado semibrillante
• Piezas apilables para fácil almacenamiento
• Diseño ergonómico
• Producción sustentable

Cada pieza refleja la riqueza cultural de México, combinando técnicas ancestrales con diseños contemporáneos. Perfecto como regalo o para renovar tu vajilla.`,
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
      description: `Set especial de cerámica artesanal con diseños geométricos. Una celebración del arte y la artesanía mexicana.

Características:
• Patrones geométricos tradicionales
• Colores vibrantes y contrastantes
• Cerámica de alta densidad
• Resistente a rayones y desgaste
• Edición limitada

Inspirado en los códices prehispánicos, cada pieza cuenta una historia visual. Ideal para quienes aprecian el arte funcional y buscan añadir un toque de cultura a su mesa.`,
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
