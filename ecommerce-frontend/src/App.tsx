import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Products } from './pages/Products';

function App() {
  // Simple client-side routing without external dependencies
  const [currentPage, setCurrentPage] = useState<'home' | 'products'>('home');

  useEffect(() => {
    // Handle browser navigation
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path === '/productos' || path === '/products') {
        setCurrentPage('products');
      } else {
        setCurrentPage('home');
      }
    };

    // Set initial page
    handleLocationChange();

    // Listen for popstate (back/forward buttons)
    window.addEventListener('popstate', handleLocationChange);

    // Intercept link clicks
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLAnchorElement;
      if (target.tagName === 'A' && target.href.startsWith(window.location.origin)) {
        e.preventDefault();
        const url = new URL(target.href);
        window.history.pushState({}, '', url.pathname);
        handleLocationChange();
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-terracotta-50">
      <Header />

      <main className="flex-grow">
        {currentPage === 'home' && <Home />}
        {currentPage === 'products' && <Products />}
      </main>

      <Footer />
    </div>
  );
}

export default App;
