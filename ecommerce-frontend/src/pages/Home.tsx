export const Home: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-bold text-terracotta-900 mb-6">
          Bienvenido a Terracotta
        </h1>
        <p className="text-xl text-gray-700 max-w-2xl mx-auto mb-8">
          Descubre nuestra colección de productos artesanales mexicanos,
          hechos a mano con dedicación y amor por la tradición.
        </p>
        <a
          href="/productos"
          className="inline-block bg-terracotta-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-terracotta-800 transition-colors shadow-lg"
        >
          Ver Productos
        </a>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
        <div className="text-center p-6 rounded-lg bg-terracotta-50">
          <div className="text-4xl mb-4">🎨</div>
          <h3 className="text-xl font-bold text-terracotta-900 mb-2">
            Hecho a Mano
          </h3>
          <p className="text-gray-600">
            Cada pieza es única, elaborada artesanalmente con técnicas tradicionales.
          </p>
        </div>

        <div className="text-center p-6 rounded-lg bg-terracotta-50">
          <div className="text-4xl mb-4">🇲🇽</div>
          <h3 className="text-xl font-bold text-terracotta-900 mb-2">
            Artesanía Mexicana
          </h3>
          <p className="text-gray-600">
            Productos auténticos que celebran la rica tradición artesanal de México.
          </p>
        </div>

        <div className="text-center p-6 rounded-lg bg-terracotta-50">
          <div className="text-4xl mb-4">✨</div>
          <h3 className="text-xl font-bold text-terracotta-900 mb-2">
            Calidad Superior
          </h3>
          <p className="text-gray-600">
            Materiales de primera calidad y atención al detalle en cada producto.
          </p>
        </div>
      </div>

      {/* Notice */}
      <div className="mt-16 bg-terracotta-100 border-l-4 border-terracotta-600 p-6 rounded-r-lg">
        <p className="text-terracotta-900">
          <strong>Nota:</strong> Los productos son artesanales y pueden variar en tonos y forma.
          Cada pieza es única y especial.
        </p>
      </div>
    </div>
  );
};
