export const Header: React.FC = () => {
  return (
    <header className="bg-terracotta-900 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold tracking-tight">Terracotta</h1>
          </div>

          <nav className="flex items-center space-x-6">
            {/* Navigation can be added here in the future */}
          </nav>
        </div>
      </div>
    </header>
  );
};
