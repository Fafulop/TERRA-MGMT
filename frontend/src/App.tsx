import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import TaskCreator from './pages/TaskCreator'
import TaskEditor from './pages/TaskEditor'
import TaskDetail from './pages/TaskDetail'
import TaskList from './pages/TaskList'
import { AuthProvider } from './contexts/AuthContext'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/create-task" element={<TaskCreator />} />
              <Route path="/edit-task/:id" element={<TaskEditor />} />
              <Route path="/task/:id" element={<TaskDetail />} />
              <Route path="/tasks" element={<TaskList />} />
              <Route path="/" element={<Dashboard />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App