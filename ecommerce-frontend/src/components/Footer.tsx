export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-terracotta-900 text-terracotta-100 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-4">Terracotta</h3>
          <p className="text-sm text-terracotta-300">
            &copy; {currentYear} Terracotta. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
