import { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Task, Subtask } from '../types';
import { ganttService } from '../services/gantt';
import { subtaskService } from '../services/subtasks';

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
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const [showAddSubtaskForm, setShowAddSubtaskForm] = useState<number | null>(null);
  const [subtaskFormData, setSubtaskFormData] = useState({
    name: '',
    description: '',
    status: 'pending' as 'pending' | 'completed',
    assignee: '',
    startDate: '',
    endDate: ''
  });

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

  // Get subtasks for all expanded tasks
  const expandedTasksArray = Array.from(expandedTasks);
  const { data: allSubtasks } = useQuery({
    queryKey: ['subtasks', expandedTasksArray],
    queryFn: async () => {
      const subtaskPromises = expandedTasksArray.map(taskId => 
        subtaskService.getSubtasksByTaskId(taskId, token!)
      );
      const results = await Promise.all(subtaskPromises);
      
      // Create a map of taskId -> subtasks
      const subtaskMap: Record<number, Subtask[]> = {};
      expandedTasksArray.forEach((taskId, index) => {
        subtaskMap[taskId] = results[index];
      });
      return subtaskMap;
    },
    enabled: !!token && expandedTasksArray.length > 0,
  });

  // Update task timeline mutation (Gantt-specific)
  const updateTaskDatesMutation = useMutation({
    mutationFn: ({ taskId, startDate, endDate }: { taskId: number; startDate: string | null; endDate: string | null }) =>
      ganttService.updateTaskTimeline(taskId, startDate, endDate, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gantt-tasks'] });
      setShowAddForm(false);
      setEditingEntry(null);
      resetForm();
    },
  });

  // Create subtask mutation
  const createSubtaskMutation = useMutation({
    mutationFn: ({ taskId, subtaskData }: { taskId: number; subtaskData: any }) =>
      subtaskService.createSubtask(taskId, subtaskData, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks'] });
      setShowAddSubtaskForm(null);
      setSubtaskFormData({ name: '', description: '', status: 'pending', assignee: '', startDate: '', endDate: '' });
    },
  });

  // Update subtask status mutation
  const updateSubtaskStatusMutation = useMutation({
    mutationFn: ({ subtaskId, subtaskData }: { subtaskId: number; subtaskData: any }) => {
      if (!token) {
        throw new Error('No authentication token available');
      }
      return subtaskService.updateSubtask(subtaskId, subtaskData, token);
    },
    onSuccess: () => {
      // Force refetch all subtask-related queries immediately
      queryClient.refetchQueries({ 
        queryKey: ['subtasks'],
        exact: false 
      });
      queryClient.refetchQueries({ queryKey: ['gantt-tasks'] });
    },
    onError: (error: any) => {
      console.error('Failed to update subtask status:', error);
      if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
        alert('Session expired. Please log in again.');
        logout();
      } else {
        alert(`Failed to update subtask status: ${error?.message || 'Unknown error'}`);
      }
    },
  });

  // Delete subtask mutation
  const deleteSubtaskMutation = useMutation({
    mutationFn: (subtaskId: number) => subtaskService.deleteSubtask(subtaskId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks'] });
    },
  });

  const resetForm = () => {
    setSelectedTaskId(null);
    setStartDate('');
    setEndDate('');
  };

  const toggleTaskExpansion = (taskId: number) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const handleAddSubtask = (taskId: number) => {
    if (!subtaskFormData.name.trim()) return;
    
    // Find the parent task to get its date boundaries
    const parentTask = ganttTasks.find(task => task.id === taskId);
    if (!parentTask) return;

    console.log('Adding subtask:', subtaskFormData);
    console.log('Parent task:', parentTask);

    const parentStartDate = parentTask.startDate ? new Date(parentTask.startDate) : null;
    const parentEndDate = parentTask.endDate ? new Date(parentTask.endDate) : null;
    
    // Basic validation: subtask dates against each other
    if (subtaskFormData.startDate && subtaskFormData.endDate && 
        new Date(subtaskFormData.startDate) > new Date(subtaskFormData.endDate)) {
      alert('Subtask start date cannot be after end date');
      return;
    }

    // Only validate against parent boundaries if parent has dates
    if (parentStartDate && parentEndDate) {
      // Validate against parent task boundaries
      if (subtaskFormData.startDate && new Date(subtaskFormData.startDate) < parentStartDate) {
        alert(`Subtask start date cannot be earlier than parent task start date (${parentStartDate.toLocaleDateString()})`);
        return;
      }

      if (subtaskFormData.endDate && new Date(subtaskFormData.endDate) > parentEndDate) {
        alert(`Subtask end date cannot be later than parent task end date (${parentEndDate.toLocaleDateString()})`);
        return;
      }

      if (subtaskFormData.startDate && new Date(subtaskFormData.startDate) > parentEndDate) {
        alert(`Subtask start date cannot be later than parent task end date (${parentEndDate.toLocaleDateString()})`);
        return;
      }

      if (subtaskFormData.endDate && new Date(subtaskFormData.endDate) < parentStartDate) {
        alert(`Subtask end date cannot be earlier than parent task start date (${parentStartDate.toLocaleDateString()})`);
        return;
      }
    }

    createSubtaskMutation.mutate({
      taskId,
      subtaskData: subtaskFormData
    });
  };

  const handleToggleSubtaskStatus = (subtask: any) => {
    const newStatus = subtask.status === 'pending' ? 'completed' : 'pending';
    
    const updateData = {
      name: subtask.name,
      description: subtask.description,
      status: newStatus,
      assignee: subtask.assignee,
      startDate: subtask.startDate?.split('T')[0] || undefined,
      endDate: subtask.endDate?.split('T')[0] || undefined
    };
    
    updateSubtaskStatusMutation.mutate({
      subtaskId: subtask.id,
      subtaskData: updateData
    });
  };

  const handleDeleteSubtask = (subtaskId: number) => {
    if (window.confirm('Are you sure you want to delete this subtask?')) {
      deleteSubtaskMutation.mutate(subtaskId);
    }
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const truncateDescription = (description: string, maxWords: number = 8) => {
    const words = description.split(' ');
    if (words.length <= maxWords) return description;
    return words.slice(0, maxWords).join(' ') + '...';
  };

  // Assignee options
  const assigneeOptions = ['', 'Jen', 'Montse', 'Jez', 'Nick', 'Gerardo'];

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

  const handleDeleteEntry = (taskId: number) => {
    if (window.confirm('Are you sure you want to remove this task from the Gantt chart? This will clear its timeline dates but won\'t delete the task itself.')) {
      // Clear the timeline by setting dates to null
      updateTaskDatesMutation.mutate({
        taskId,
        startDate: null,
        endDate: null,
      });
    }
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
              <div className="overflow-x-auto">
                <table className="min-w-full w-full">
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
                        Assignee
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
                      const isExpanded = expandedTasks.has(task.id);
                      const taskSubtasks = allSubtasks?.[task.id] || [];
                      
                      return (
                        <Fragment key={`task-group-${task.id}`}>
                          {/* Main Task Row */}
                          <tr key={task.id} className="hover:bg-gray-50 border-b border-gray-200">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <button
                                  onClick={() => toggleTaskExpansion(task.id)}
                                  className="mr-2 text-gray-400 hover:text-gray-600"
                                >
                                  {isExpanded ? '▼' : '▶'}
                                </button>
                                <div style={{ maxWidth: '200px' }}>
                                  <div className="text-sm font-medium text-gray-900 overflow-hidden whitespace-nowrap text-ellipsis">{task.title}</div>
                                  {task.description && (
                                    <div 
                                      className="text-sm text-gray-500 cursor-help overflow-hidden whitespace-nowrap text-ellipsis" 
                                      title={task.description}
                                    >
                                      {task.description}
                                    </div>
                                  )}
                                </div>
                              </div>
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              -
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
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditEntry(task)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => navigate(`/task/${task.id}`)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleDeleteEntry(task.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Remove
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Subtasks Rows */}
                          {isExpanded && (
                            <>
                              {/* Add Subtask Form Row */}
                              {showAddSubtaskForm === task.id && (
                                <tr className="bg-blue-50">
                                  <td colSpan={8} className="px-6 py-4">
                                    <div className="ml-6 bg-white rounded p-3 border">
                                      <h5 className="font-medium text-gray-900 mb-3">Add New Subtask</h5>
                                      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-3">
                                        <input
                                          type="text"
                                          placeholder="Subtask name *"
                                          value={subtaskFormData.name}
                                          onChange={(e) => setSubtaskFormData({...subtaskFormData, name: e.target.value})}
                                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <input
                                          type="text"
                                          placeholder="Description"
                                          value={subtaskFormData.description}
                                          onChange={(e) => setSubtaskFormData({...subtaskFormData, description: e.target.value})}
                                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <select
                                          value={subtaskFormData.status}
                                          onChange={(e) => setSubtaskFormData({...subtaskFormData, status: e.target.value as 'pending' | 'completed'})}
                                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                          <option value="pending">Pending</option>
                                          <option value="completed">Completed</option>
                                        </select>
                                        <select
                                          value={subtaskFormData.assignee}
                                          onChange={(e) => setSubtaskFormData({...subtaskFormData, assignee: e.target.value})}
                                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                          <option value="">Select Assignee</option>
                                          {assigneeOptions.slice(1).map(name => (
                                            <option key={name} value={name}>{name}</option>
                                          ))}
                                        </select>
                                        <input
                                          type="date"
                                          value={subtaskFormData.startDate}
                                          onChange={(e) => setSubtaskFormData({...subtaskFormData, startDate: e.target.value})}
                                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <input
                                          type="date"
                                          value={subtaskFormData.endDate}
                                          onChange={(e) => setSubtaskFormData({...subtaskFormData, endDate: e.target.value})}
                                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                      </div>
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() => handleAddSubtask(task.id)}
                                          disabled={createSubtaskMutation.isPending}
                                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                                        >
                                          {createSubtaskMutation.isPending ? 'Adding...' : 'Add'}
                                        </button>
                                        <button
                                          onClick={() => {
                                            setShowAddSubtaskForm(null);
                                            setSubtaskFormData({ name: '', description: '', status: 'pending', assignee: '', startDate: '', endDate: '' });
                                          }}
                                          className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}

                              {/* Add Subtask Button Row */}
                              {showAddSubtaskForm !== task.id && (
                                <tr className="bg-gray-50">
                                  <td colSpan={8} className="px-6 py-2">
                                    <div className="ml-6">
                                      <button
                                        onClick={() => setShowAddSubtaskForm(task.id)}
                                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                                      >
                                        + Add Subtask
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )}

                              {/* Existing Subtasks */}
                              {taskSubtasks.map((subtask) => {
                                const subtaskDuration = subtask.startDate && subtask.endDate ? 
                                  calculateDuration(subtask.startDate, subtask.endDate) : null;

                                return (
                                  <tr key={`subtask-${subtask.id}`} className="bg-gray-50 hover:bg-gray-100">
                                    <td className="px-6 py-3">
                                      <div className="ml-6 pl-4 border-l-2 border-gray-300" style={{ maxWidth: '180px' }}>
                                        <div className="text-sm font-medium text-gray-800 overflow-hidden whitespace-nowrap text-ellipsis">📋 {subtask.name}</div>
                                        {subtask.description && (
                                          <div 
                                            className="text-sm text-gray-600 cursor-help overflow-hidden whitespace-nowrap text-ellipsis"
                                            title={subtask.description}
                                          >
                                            {subtask.description}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-6 py-3 text-sm text-gray-600">
                                      <span className="italic">Subtask</span>
                                    </td>
                                    <td className="px-6 py-3 text-sm text-gray-600">
                                      {subtask.startDate ? new Date(subtask.startDate).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-6 py-3 text-sm text-gray-600">
                                      {subtask.endDate ? new Date(subtask.endDate).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-6 py-3 text-sm text-gray-600">
                                      {subtaskDuration ? `${subtaskDuration} day${subtaskDuration !== 1 ? 's' : ''}` : '-'}
                                    </td>
                                    <td className="px-6 py-3 text-sm text-gray-600">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                        subtask.assignee 
                                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                          : 'bg-gray-50 text-gray-500 border border-gray-200'
                                      }`}>
                                        {subtask.assignee || 'Unassigned'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-3">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                        subtask.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {subtask.status.toUpperCase()}
                                      </span>
                                    </td>
                                    <td className="px-6 py-3 text-sm font-medium">
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() => handleToggleSubtaskStatus(subtask)}
                                          disabled={updateSubtaskStatusMutation.isPending}
                                          className={`${
                                            subtask.status === 'pending' 
                                              ? 'text-green-600 hover:text-green-800' 
                                              : 'text-yellow-600 hover:text-yellow-800'
                                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                          {updateSubtaskStatusMutation.isPending ? 'Updating...' : 
                                           (subtask.status === 'pending' ? 'Complete' : 'Reopen')}
                                        </button>
                                        <button
                                          onClick={() => handleDeleteSubtask(subtask.id)}
                                          disabled={deleteSubtaskMutation.isPending}
                                          className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </>
                          )}
                        </Fragment>
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