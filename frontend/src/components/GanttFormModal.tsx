import React, { memo } from 'react';
import { Task, TaskReference } from '../types';
import { formatDateForInput } from '../utils/dateUtils';

interface GanttFormModalProps {
  // Task timeline form
  showAddForm: boolean;
  editingEntry: { taskId: number; startDate: string; endDate: string } | null;
  selectedTaskId: number | null;
  startDate: string;
  endDate: string;
  tasks: Task[];
  
  // Subtask form
  showAddSubtaskForm: number | null;
  subtaskFormData: {
    name: string;
    description: string;
    status: 'pending' | 'completed';
    assignee: string;
    referenceType: 'task' | 'subtask' | '';
    referenceId: number | undefined;
    referenceName: string;
    startDate: string;
    endDate: string;
  };
  referenceData: TaskReference[];
  
  // Actions
  onSetSelectedTask: (taskId: number | null) => void;
  onSetDates: (startDate: string, endDate: string) => void;
  onCloseForm: () => void;
  onSubmitTimeline: () => void;
  onUpdateSubtaskForm: (data: any) => void;
  onSubmitSubtask: () => void;
  onCloseSubtaskForm: () => void;
}

const GanttFormModal: React.FC<GanttFormModalProps> = memo(({
  showAddForm,
  editingEntry,
  selectedTaskId,
  startDate,
  endDate,
  tasks,
  showAddSubtaskForm,
  subtaskFormData,
  referenceData,
  onSetSelectedTask,
  onSetDates,
  onCloseForm,
  onSubmitTimeline,
  onUpdateSubtaskForm,
  onSubmitSubtask,
  onCloseSubtaskForm
}) => {
  if (!showAddForm && !showAddSubtaskForm) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {/* Task Timeline Form */}
        {showAddForm && (
          <>
            <h3 className="text-lg font-semibold mb-4">
              {editingEntry ? 'Edit Task Timeline' : 'Add Task to Gantt'}
            </h3>
            
            <div className="space-y-4">
              {!editingEntry && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Task
                  </label>
                  <select
                    value={selectedTaskId || ''}
                    onChange={(e) => onSetSelectedTask(Number(e.target.value) || null)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Choose a task...</option>
                    {tasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => onSetDates(e.target.value, endDate)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
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
                  onChange={(e) => onSetDates(startDate, e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={onCloseForm}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={onSubmitTimeline}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {editingEntry ? 'Update Timeline' : 'Add to Gantt'}
              </button>
            </div>
          </>
        )}

        {/* Subtask Form */}
        {showAddSubtaskForm && (
          <>
            <h3 className="text-lg font-semibold mb-4">Add Subtask</h3>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subtask Name *
                </label>
                <input
                  type="text"
                  value={subtaskFormData.name}
                  onChange={(e) => onUpdateSubtaskForm({ name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={subtaskFormData.description}
                  onChange={(e) => onUpdateSubtaskForm({ description: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={subtaskFormData.status}
                  onChange={(e) => onUpdateSubtaskForm({ status: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assignee
                </label>
                <input
                  type="text"
                  value={subtaskFormData.assignee}
                  onChange={(e) => onUpdateSubtaskForm({ assignee: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Person responsible"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Type
                </label>
                <select
                  value={subtaskFormData.referenceType}
                  onChange={(e) => onUpdateSubtaskForm({ 
                    referenceType: e.target.value,
                    referenceId: undefined,
                    referenceName: ''
                  })}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">No reference</option>
                  <option value="task">Task Dependency</option>
                  <option value="subtask">Subtask Dependency</option>
                </select>
              </div>
              
              {subtaskFormData.referenceType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference Item
                  </label>
                  <select
                    value={subtaskFormData.referenceId || ''}
                    onChange={(e) => {
                      const selectedId = Number(e.target.value);
                      const selectedItem = referenceData.find(item => item.id === selectedId);
                      onUpdateSubtaskForm({
                        referenceId: selectedId,
                        referenceName: selectedItem ? selectedItem.name : ''
                      });
                    }}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select reference...</option>
                    {referenceData
                      .filter(item => item.type === subtaskFormData.referenceType)
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={subtaskFormData.startDate}
                    onChange={(e) => onUpdateSubtaskForm({ startDate: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={subtaskFormData.endDate}
                    onChange={(e) => onUpdateSubtaskForm({ endDate: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={onCloseSubtaskForm}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={onSubmitSubtask}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Add Subtask
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

GanttFormModal.displayName = 'GanttFormModal';

export default GanttFormModal;