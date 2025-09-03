import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Subtask, SubtaskFormData } from '../types';
import { subtaskService } from '../services/subtasks';

interface SubtaskManagerProps {
  taskId: number;
  taskTitle: string;
}

const SubtaskManager = ({ taskId, taskTitle }: SubtaskManagerProps) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null);
  const [formData, setFormData] = useState<SubtaskFormData>({
    name: '',
    description: '',
    startDate: '',
    endDate: ''
  });

  // Fetch subtasks for this task
  const { data: subtasks, isLoading, error } = useQuery({
    queryKey: ['subtasks', taskId],
    queryFn: () => subtaskService.getSubtasksByTaskId(taskId, token!),
    enabled: !!token,
  });

  // Create subtask mutation
  const createSubtaskMutation = useMutation({
    mutationFn: (data: SubtaskFormData) => subtaskService.createSubtask(taskId, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] });
      resetForm();
      setShowAddForm(false);
    },
  });

  // Update subtask mutation
  const updateSubtaskMutation = useMutation({
    mutationFn: ({ subtaskId, data }: { subtaskId: number; data: SubtaskFormData }) =>
      subtaskService.updateSubtask(subtaskId, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] });
      resetForm();
      setEditingSubtask(null);
      setShowAddForm(false);
    },
  });

  // Delete subtask mutation
  const deleteSubtaskMutation = useMutation({
    mutationFn: (subtaskId: number) => subtaskService.deleteSubtask(subtaskId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;
    
    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      alert('Start date cannot be after end date');
      return;
    }

    if (editingSubtask) {
      updateSubtaskMutation.mutate({
        subtaskId: editingSubtask.id,
        data: formData
      });
    } else {
      createSubtaskMutation.mutate(formData);
    }
  };

  const handleEdit = (subtask: Subtask) => {
    setEditingSubtask(subtask);
    setFormData({
      name: subtask.name,
      description: subtask.description || '',
      startDate: subtask.startDate ? subtask.startDate.split('T')[0] : '',
      endDate: subtask.endDate ? subtask.endDate.split('T')[0] : '',
    });
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingSubtask(null);
    resetForm();
  };

  const handleDelete = (subtaskId: number) => {
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

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading subtasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <p>Error loading subtasks: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 mt-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-medium text-gray-900">
          Subtasks for "{taskTitle}" ({subtasks?.length || 0})
        </h4>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm"
          >
            Add Subtask
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg p-4 mb-4 border">
          <h5 className="text-md font-medium text-gray-900 mb-3">
            {editingSubtask ? 'Edit Subtask' : 'Add New Subtask'}
          </h5>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter subtask name"
                  required
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter subtask description (optional)"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createSubtaskMutation.isPending || updateSubtaskMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createSubtaskMutation.isPending || updateSubtaskMutation.isPending ? 
                  'Saving...' : (editingSubtask ? 'Update Subtask' : 'Add Subtask')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Subtasks List */}
      {subtasks && subtasks.length > 0 ? (
        <div className="space-y-3">
          {subtasks.map((subtask) => (
            <div key={subtask.id} className="bg-white rounded-lg p-3 border">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h6 className="font-medium text-gray-900">{subtask.name}</h6>
                  {subtask.description && (
                    <p className="text-sm text-gray-600 mt-1">{subtask.description}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    {subtask.startDate && (
                      <span>Start: {new Date(subtask.startDate).toLocaleDateString()}</span>
                    )}
                    {subtask.endDate && (
                      <span>End: {new Date(subtask.endDate).toLocaleDateString()}</span>
                    )}
                    {subtask.startDate && subtask.endDate && (
                      <span className="font-medium text-blue-600">
                        Duration: {calculateDuration(subtask.startDate, subtask.endDate)} days
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(subtask)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(subtask.id)}
                    disabled={deleteSubtaskMutation.isPending}
                    className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <p className="text-gray-500">No subtasks created yet</p>
          <p className="text-sm text-gray-400">Add subtasks to break down this task into smaller components</p>
        </div>
      )}
    </div>
  );
};

export default SubtaskManager;