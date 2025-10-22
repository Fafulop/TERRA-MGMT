import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Task, TaskFormData } from '../../types';
import AreaSubareaSelector from '../AreaSubareaSelector';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExisting: (taskId: number, startDate: string, endDate: string) => void;
  onCreateNew: (taskData: TaskFormData, startDate: string, endDate: string) => void;
  availableTasks: Task[];
  isLoading?: boolean;
}

export default function AddTaskModal({
  isOpen,
  onClose,
  onAddExisting,
  onCreateNew,
  availableTasks,
  isLoading = false,
}: AddTaskModalProps) {
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // New task form data
  const [newTaskData, setNewTaskData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    area: '',
    subarea: '',
  });

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setMode('existing');
      setSelectedTaskId(null);
      setStartDate('');
      setEndDate('');
      setSearchTerm('');
      setNewTaskData({
        title: '',
        description: '',
        priority: 'medium',
        area: '',
        subarea: '',
      });
    }
  }, [isOpen]);

  const filteredTasks = availableTasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.area?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      alert('Please select start and end dates');
      return;
    }

    if (mode === 'existing') {
      if (!selectedTaskId) {
        alert('Please select a task');
        return;
      }
      onAddExisting(selectedTaskId, startDate, endDate);
    } else {
      if (!newTaskData.title || !newTaskData.area || !newTaskData.subarea) {
        alert('Please fill in all required fields');
        return;
      }
      onCreateNew(newTaskData, startDate, endDate);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Task to Project</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => setMode('existing')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                mode === 'existing'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Add Existing Task
            </button>
            <button
              onClick={() => setMode('new')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                mode === 'new'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Create New Task
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'existing' ? (
            <>
              {/* Search Tasks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Tasks
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title or area..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Task List */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Task <span className="text-red-500">*</span>
                </label>
                <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                  {filteredTasks.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No tasks found</div>
                  ) : (
                    filteredTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedTaskId === task.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                        }`}
                      >
                        <div className="font-medium text-gray-900">{task.title}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {task.area} {task.subarea && `> ${task.subarea}`} • {task.status} •{' '}
                          {task.priority}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* New Task Form */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTaskData.title}
                  onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                  placeholder="Enter task title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newTaskData.description}
                  onChange={(e) =>
                    setNewTaskData({ ...newTaskData, description: e.target.value })
                  }
                  placeholder="Enter task description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={newTaskData.priority}
                  onChange={(e) =>
                    setNewTaskData({
                      ...newTaskData,
                      priority: e.target.value as 'low' | 'medium' | 'high',
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area & Subarea <span className="text-red-500">*</span>
                </label>
                <AreaSubareaSelector
                  selectedArea={newTaskData.area}
                  selectedSubarea={newTaskData.subarea || ''}
                  onAreaChange={(area) => setNewTaskData({ ...newTaskData, area })}
                  onSubareaChange={(subarea) => setNewTaskData({ ...newTaskData, subarea })}
                />
              </div>
            </>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date <span className="text-red-500">*</span>
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
                End Date <span className="text-red-500">*</span>
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

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Adding...' : mode === 'existing' ? 'Add Task' : 'Create & Add Task'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
