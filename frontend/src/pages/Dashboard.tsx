import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
            {/* Task Management Section */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-700">
                  General Tasks
                </h2>
                <button
                  onClick={() => navigate('/tasks')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  View General Tasks
                </button>
              </div>
              <p className="text-gray-500">Click "View General Tasks" to see all shared tasks and create new ones!</p>
            </div>

            {/* Personal Tasks Section */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-700">
                  Personal Tasks
                </h2>
                <button
                  onClick={() => navigate('/personal')}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  View Personal Tasks
                </button>
              </div>
              <p className="text-gray-500">Manage your private tasks - visible only to you!</p>
            </div>

            {/* Cash Flow Section */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-700">
                  Cash Flow
                </h2>
                <button
                  onClick={() => navigate('/cash-flow')}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Manage Cash Flow
                </button>
              </div>
              <p className="text-gray-500">Track your income and expenses with dual currency support (USD/MXN)!</p>
            </div>

            {/* Cotizaciones Section */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-700">
                  Cotizaciones
                </h2>
                <button
                  onClick={() => navigate('/cotizaciones')}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  Manage Quotes
                </button>
              </div>
              <p className="text-gray-500">Manage your quotes and quotations in multiple currencies!</p>
            </div>

            {/* Areas Section */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-700">
                  Areas
                </h2>
                <button
                  onClick={() => navigate('/areas')}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Manage Areas
                </button>
              </div>
              <p className="text-gray-500">Manage organizational areas and departments!</p>
            </div>

            {/* Contactos Section */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-700">
                  Contactos
                </h2>
                <button
                  onClick={() => navigate('/contactos')}
                  className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                >
                  Manage Contacts
                </button>
              </div>
              <p className="text-gray-500">Manage your business contacts and relationships!</p>
            </div>

            {/* Documentos Section */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-700">
                  Documentos
                </h2>
                <button
                  onClick={() => navigate('/documentos')}
                  className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                  Manage Documents
                </button>
              </div>
              <p className="text-gray-500">Manage and organize your business documents!</p>
            </div>

            {/* Gantt Chart Section */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-700">
                  Gantt Chart
                </h2>
                <button
                  onClick={() => navigate('/gantt')}
                  className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
                >
                  View Gantt Chart
                </button>
              </div>
              <p className="text-gray-500">Visualize task timelines and project dependencies!</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;