import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Products } from './pages/Products';

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-terracotta-50">
      <Header />

      <main className="flex-grow">
        <Products />
      </main>

      <Footer />
    </div>
  );
}

export default App;
