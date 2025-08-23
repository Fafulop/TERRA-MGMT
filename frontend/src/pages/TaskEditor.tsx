import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { TaskFormData, Task } from '../types';
import { taskService } from '../services/tasks';
import AreaSubareaSelector from '../components/AreaSubareaSelector';

const TaskEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    area: '',
    subarea: ''
  });

  // Fetch the task to edit
  const { data: task, isLoading: isLoadingTask, error: loadError } = useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      const tasks = await taskService.getTasks(token!);
      const foundTask = tasks.find(t => t.id === parseInt(id!));
      if (!foundTask) {
        throw new Error('Task not found');
      }
      return foundTask;
    },
    enabled: !!token && !!id,
    refetchOnWindowFocus: false
  });

  // Update form data when task is loaded
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '', // Convert to YYYY-MM-DD format
        area: task.area,
        subarea: task.subarea
      });
    }
  }, [task]);

  const updateTaskMutation = useMutation({
    mutationFn: async (taskData: TaskFormData) => {
      return taskService.updateTask(parseInt(id!), taskData, token!);
    },
    onSuccess: () => {
      navigate('/tasks');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim() && formData.area.trim() && formData.subarea.trim()) {
      updateTaskMutation.mutate(formData);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAreaChange = (areaName: string) => {
    setFormData(prev => ({
      ...prev,
      area: areaName
    }));
  };

  const handleSubareaChange = (subareaName: string) => {
    setFormData(prev => ({
      ...prev,
      subarea: subareaName
    }));
  };

  if (isLoadingTask) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading task...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Task Not Found</h2>
          <p className="text-gray-600 mb-4">The task you're trying to edit doesn't exist or you don't have permission to edit it.</p>
          <button
            onClick={() => navigate('/tasks')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Tasks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-900">Edit Task</h1>
              <button
                onClick={() => navigate('/tasks')}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter task title..."
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter task description..."
              />
            </div>

            {/* Area and Subarea */}
            <AreaSubareaSelector
              selectedArea={formData.area}
              selectedSubarea={formData.subarea}
              onAreaChange={handleAreaChange}
              onSubareaChange={handleSubareaChange}
              required={true}
              showLabels={true}
              areaPlaceholder="Select area..."
              subareaPlaceholder="Select subarea..."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {task && (
              <div className="bg-gray-50 rounded-md p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Task Information</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Status: <span className="capitalize">{task.status.replace('_', ' ')}</span></div>
                  <div>Created: {new Date(task.createdAt).toLocaleString()}</div>
                  {task.updatedAt !== task.createdAt && (
                    <div>Last Updated: {new Date(task.updatedAt).toLocaleString()}</div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={updateTaskMutation.isPending || !formData.title.trim() || !formData.area.trim() || !formData.subarea.trim()}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateTaskMutation.isPending ? 'Updating...' : 'Update Task'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/tasks')}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>

            {updateTaskMutation.error && (
              <div className="text-red-600 text-sm">
                Error: {updateTaskMutation.error.message}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskEditor;