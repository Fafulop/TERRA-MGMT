import React, { Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'

// Eager loading for critical routes (auth)
import Login from './pages/Login'
import Register from './pages/Register'

// Lazy loading for feature routes
const Dashboard = React.lazy(() => import('./pages/Dashboard'))
const TaskCreator = React.lazy(() => import('./pages/TaskCreator'))
const TaskEditor = React.lazy(() => import('./pages/TaskEditor'))
const TaskDetail = React.lazy(() => import('./pages/TaskDetail'))
const TaskList = React.lazy(() => import('./pages/TaskList'))
const CashFlow = React.lazy(() => import('./pages/CashFlow'))
const Cotizaciones = React.lazy(() => import('./pages/Cotizaciones'))
const Areas = React.lazy(() => import('./pages/Areas'))
const Personal = React.lazy(() => import('./pages/Personal'))
const Contactos = React.lazy(() => import('./pages/Contactos'))
const Documentos = React.lazy(() => import('./pages/Documentos'))
const GanttChart = React.lazy(() => import('./pages/GanttChart'))
const Calendar = React.lazy(() => import('./pages/Calendar'))

const queryClient = new QueryClient()

// Loading component for lazy-loaded routes
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="text-gray-600 text-sm">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Eager loaded auth routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Lazy loaded feature routes */}
                <Route path="/create-task" element={<TaskCreator />} />
                <Route path="/edit-task/:id" element={<TaskEditor />} />
                <Route path="/task/:id" element={<TaskDetail />} />
                <Route path="/tasks" element={<TaskList />} />
                <Route path="/cash-flow" element={<CashFlow />} />
                <Route path="/cotizaciones" element={<Cotizaciones />} />
                <Route path="/areas" element={<Areas />} />
                <Route path="/personal" element={<Personal />} />
                <Route path="/contactos" element={<Contactos />} />
                <Route path="/documentos" element={<Documentos />} />
                <Route path="/gantt" element={<GanttChart />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/" element={<Dashboard />} />
              </Routes>
            </Suspense>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App