import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Task } from '../types';
import { ganttService } from '../services/gantt';

interface GanttEntry {
  taskId: number;
  startDate: string;
  endDate: string;
}

const GanttChart = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const queryClient = useQueryClient();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingEntry, setEditingEntry] = useState<GanttEntry | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Fetch all tasks for Gantt (global view)
  const { data: tasks, isLoading: tasksLoading, error: tasksError } = useQuery({
    queryKey: ['gantt-tasks'],
    queryFn: () => ganttService.getGanttTasks(token!),
    enabled: !!token && !!user,
  });

  const taskList = tasks || [];

  // Update task timeline mutation (Gantt-specific)
  const updateTaskDatesMutation = useMutation({
    mutationFn: ({ taskId, startDate, endDate }: { taskId: number; startDate: string; endDate: string }) =>
      ganttService.updateTaskTimeline(taskId, startDate, endDate, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gantt-tasks'] });
      setShowAddForm(false);
      setEditingEntry(null);
      resetForm();
    },
  });

  const resetForm = () => {
    setSelectedTaskId(null);
    setStartDate('');
    setEndDate('');
  };

  const handleAddEntry = () => {
    if (!selectedTaskId || !startDate || !endDate) return;
    
    updateTaskDatesMutation.mutate({
      taskId: selectedTaskId,
      startDate,
      endDate,
    });
  };

  const handleEditEntry = (task: Task) => {
    setEditingEntry({
      taskId: task.id,
      startDate: task.startDate || '',
      endDate: task.endDate || '',
    });
    setSelectedTaskId(task.id);
    setStartDate(task.startDate || '');
    setEndDate(task.endDate || '');
    setShowAddForm(true);
  };

  const handleSaveEdit = () => {
    if (!selectedTaskId || !startDate || !endDate) return;
    
    updateTaskDatesMutation.mutate({
      taskId: selectedTaskId,
      startDate,
      endDate,
    });
  };

  // Get tasks that have Gantt dates (start_date and end_date)
  const ganttTasks = taskList.filter(task => task.startDate && task.endDate);
  
  // Get tasks available for selection (don't have Gantt dates yet)
  const availableTasks = taskList.filter(task => !task.startDate || !task.endDate);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-gray-900">Gantt Chart</h1>
              <button
                onClick={() => navigate('/')}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
            </div>
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
          
          {/* Add Entry Button and Form */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingEntry ? 'Edit Gantt Entry' : 'Add Task to Gantt Chart'}
              </h2>
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Add Entry
                </button>
              )}
            </div>

            {showAddForm && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Task Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Task
                    </label>
                    <select
                      value={selectedTaskId || ''}
                      onChange={(e) => setSelectedTaskId(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={!!editingEntry}
                    >
                      <option value="">Choose a task...</option>
                      {(editingEntry ? taskList : availableTasks).map(task => (
                        <option key={task.id} value={task.id}>
                          {task.title} ({task.area}/{task.subarea})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingEntry(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingEntry ? handleSaveEdit : handleAddEntry}
                    disabled={!selectedTaskId || !startDate || !endDate || updateTaskDatesMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updateTaskDatesMutation.isPending ? 'Saving...' : (editingEntry ? 'Update' : 'Add to Gantt')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Gantt Entries List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Gantt Chart Entries ({ganttTasks.length})
              </h3>
            </div>

            {tasksLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading tasks...</p>
              </div>
            ) : ganttTasks.length === 0 ? (
              <div className="p-6 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Gantt entries yet</h3>
                <p className="text-gray-500 mb-4">Add tasks to your Gantt chart to see the timeline.</p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => navigate('/tasks')}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View All Tasks
                  </button>
                  <button
                    onClick={() => navigate('/create-task')}
                    className="text-green-600 hover:text-green-800 font-medium"
                  >
                    Create New Task
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Area/Subarea
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Start Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        End Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {ganttTasks.map((task) => {
                      const startDate = new Date(task.startDate!);
                      const endDate = new Date(task.endDate!);
                      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <tr key={task.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{task.title}</div>
                            {task.description && (
                              <div className="text-sm text-gray-500">{task.description}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {task.area}/{task.subarea}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {startDate.toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {endDate.toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {duration} day{duration !== 1 ? 's' : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              task.status === 'completed' ? 'bg-green-100 text-green-800' :
                              task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {task.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleEditEntry(task)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              Edit Dates
                            </button>
                            <button
                              onClick={() => navigate(`/task/${task.id}`)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View Task
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default GanttChart;