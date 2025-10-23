export const Header: React.FC = () => {
  return (
    <header className="bg-terracotta-900 text-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold tracking-tight">Terracotta</h1>
            <span className="text-terracotta-200 text-sm hidden sm:inline">
              Artesanía Mexicana
            </span>
          </div>

          <nav className="flex items-center space-x-6">
            <a
              href="/"
              className="text-terracotta-100 hover:text-white transition-colors font-medium"
            >
              Inicio
            </a>
            <a
              href="/productos"
              className="text-terracotta-100 hover:text-white transition-colors font-medium"
            >
              Productos
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
};
