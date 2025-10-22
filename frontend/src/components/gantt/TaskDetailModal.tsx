import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { ProjectTask } from '../../types';
import { format } from 'date-fns';

interface TaskDetailModalProps {
  isOpen: boolean;
  task: ProjectTask | null;
  onClose: () => void;
  onUpdate: (taskId: number, data: { start_date?: string; end_date?: string; status?: string }) => void;
  onRemove: (taskId: number) => void;
  isLoading?: boolean;
}

export default function TaskDetailModal({
  isOpen,
  task,
  onClose,
  onUpdate,
  onRemove,
  isLoading = false,
}: TaskDetailModalProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');

  useEffect(() => {
    if (task) {
      setStartDate(format(new Date(task.start_date || task.startDate), 'yyyy-MM-dd'));
      setEndDate(format(new Date(task.end_date || task.endDate), 'yyyy-MM-dd'));
      setStatus(task.status || 'pending');
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    onUpdate(task.task_id || task.taskId, {
      start_date: startDate,
      end_date: endDate,
      status,
    });
  };

  const handleRemove = () => {
    if (!task) return;
    if (confirm('Remove this task from the project? The task itself will not be deleted.')) {
      onRemove(task.task_id || task.taskId);
    }
  };

  if (!isOpen || !task) return null;

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (p?: string) => {
    switch (p) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{task.title}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-1 rounded ${getStatusColor(status)}`}>
                {status.replace('_', ' ')}
              </span>
              {task.priority && (
                <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-4"
          >
            <X size={24} />
          </button>
        </div>

        {/* Task Info */}
        <div className="p-6 space-y-4">
          {task.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
              <p className="text-gray-600">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Area</h3>
              <p className="text-gray-600">{task.area || task.task_area}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Subarea</h3>
              <p className="text-gray-600">{task.subarea || task.task_subarea || '-'}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Assigned To</h3>
            <p className="text-gray-600">
              {task.username ||
                task.task_username ||
                `${task.first_name || task.task_first_name || ''} ${
                  task.last_name || task.task_last_name || ''
                }`.trim() ||
                'Unknown'}
            </p>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="p-6 border-t border-gray-200 space-y-4">
          <h3 className="font-semibold text-gray-900">Update Timeline & Status</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'pending' | 'in_progress' | 'completed')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Updating...' : 'Update Task'}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isLoading}
              className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Trash2 size={16} />
              Remove
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
