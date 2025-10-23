export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-terracotta-900 text-terracotta-100 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold text-white mb-3">Terracotta</h3>
            <p className="text-sm text-terracotta-200">
              Productos artesanales mexicanos hechos a mano con amor y dedicación.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Enlaces</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="hover:text-white transition-colors">
                  Inicio
                </a>
              </li>
              <li>
                <a href="/productos" className="hover:text-white transition-colors">
                  Productos
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Contacto</h4>
            <p className="text-sm text-terracotta-200">
              Los productos son artesanales y pueden variar en tonos y forma.
            </p>
            <p className="text-sm text-terracotta-200 mt-2">
              Precios en MXN
            </p>
          </div>
        </div>

        <div className="border-t border-terracotta-700 mt-8 pt-6 text-center text-sm text-terracotta-300">
          <p>&copy; {currentYear} Terracotta. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};
