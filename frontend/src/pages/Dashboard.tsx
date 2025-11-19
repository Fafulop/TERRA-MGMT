import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from '../components/NotificationBell';
import NotificationCenter from '../components/NotificationCenter';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to continue</h1>
          <a href="/login" className="text-blue-600 hover:text-blue-800">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Task Manager</h1>
            <div className="flex items-center space-x-4">
              <NotificationBell onClick={() => setShowNotifications(true)} />
              <span className="text-gray-700">Welcome, {user.username}!</span>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto py-4 sm:py-10 px-2 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {/* 1. Inventario */}
          <button
            onClick={() => navigate('/produccion?tab=inventory')}
            className="bg-pink-600 text-white aspect-square rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-base font-semibold flex items-center justify-center p-2"
          >
            Inventario
          </button>

          {/* 2. Cash Flow */}
          <button
            onClick={() => navigate('/cash-flow')}
            className="bg-green-600 text-white aspect-square rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-base font-semibold flex items-center justify-center p-2"
          >
            Cash Flow
          </button>

          {/* 3. Ventas Mayoreo */}
          <button
            onClick={() => navigate('/ventas-mayoreo')}
            className="bg-amber-600 text-white aspect-square rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-base font-semibold flex items-center justify-center p-2"
          >
            Ventas Mayoreo
          </button>

          {/* 4. Ecommerce */}
          <button
            onClick={() => navigate('/ecommerce')}
            className="bg-cyan-600 text-white aspect-square rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-base font-semibold flex items-center justify-center p-2"
          >
            Ecommerce
          </button>

          {/* 5. General Tasks */}
          <button
            onClick={() => navigate('/tasks')}
            className="bg-blue-600 text-white aspect-square rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-base font-semibold flex items-center justify-center p-2"
          >
            General Tasks
          </button>

          {/* 6. Calendar */}
          <button
            onClick={() => navigate('/calendar')}
            className="bg-blue-600 text-white aspect-square rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-base font-semibold flex items-center justify-center p-2"
          >
            Calendar
          </button>

          {/* 7. Personal Tasks */}
          <button
            onClick={() => navigate('/personal')}
            className="bg-purple-600 text-white aspect-square rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-base font-semibold flex items-center justify-center p-2"
          >
            Personal Tasks
          </button>

          {/* 8. Gantt Chart */}
          <button
            onClick={() => navigate('/gantt')}
            className="bg-indigo-600 text-white aspect-square rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-base font-semibold flex items-center justify-center p-2"
          >
            Gantt Chart
          </button>

          {/* 9. Cotizaciones */}
          <button
            onClick={() => navigate('/cotizaciones')}
            className="bg-purple-600 text-white aspect-square rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-base font-semibold flex items-center justify-center p-2"
          >
            Cotizaciones
          </button>

          {/* 10. Areas */}
          <button
            onClick={() => navigate('/areas')}
            className="bg-indigo-600 text-white aspect-square rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-base font-semibold flex items-center justify-center p-2"
          >
            Areas
          </button>

          {/* 11. Contactos */}
          <button
            onClick={() => navigate('/contactos')}
            className="bg-teal-600 text-white aspect-square rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-base font-semibold flex items-center justify-center p-2"
          >
            Contactos
          </button>

          {/* 12. Documentos */}
          <button
            onClick={() => navigate('/documentos')}
            className="bg-orange-600 text-white aspect-square rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-base font-semibold flex items-center justify-center p-2"
          >
            Documentos
          </button>
        </div>
      </main>

      {/* Notification Center Modal */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
};

export default Dashboard;