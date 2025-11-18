import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProductsTab from '../components/ceramics/ProductsTab';
import ColorsTab from '../components/ceramics/ColorsTab';
import ProductTypesTab from '../components/ceramics/ProductTypesTab';

type Tab = 'products' | 'colors' | 'types';

const CeramicsInventory: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('products');

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Productos de Cerámica</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Bienvenido, {user.username}!</span>
              <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('products')}
                className={`${
                  activeTab === 'products'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Productos
              </button>
              <button
                onClick={() => setActiveTab('colors')}
                className={`${
                  activeTab === 'colors'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Colores
              </button>
              <button
                onClick={() => setActiveTab('types')}
                className={`${
                  activeTab === 'types'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Tipos de Producto
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'products' && <ProductsTab />}
          {activeTab === 'colors' && <ColorsTab />}
          {activeTab === 'types' && <ProductTypesTab />}
        </div>
      </main>
    </div>
  );
};

export default CeramicsInventory;
