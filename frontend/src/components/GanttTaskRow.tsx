import React, { memo } from 'react';
import { Task, Subtask } from '../types';
import { formatDateForDisplay, calculateDuration } from '../utils/dateUtils';
import GanttCalendarView from './GanttCalendarView';

interface GanttTaskRowProps {
  task: Task;
  subtasks: Subtask[];
  subtaskCount: number;
  isExpanded: boolean;
  showCalendar: boolean;
  onToggleExpansion: (taskId: number) => void;
  onToggleCalendar: (taskId: number) => void;
  onEditTask: (task: Task) => void;
  onAddSubtask: (taskId: number) => void;
  onUpdateSubtaskStatus: (subtaskId: number, status: 'pending' | 'completed') => void;
  onDeleteSubtask: (subtaskId: number) => void;
}

const GanttTaskRow: React.FC<GanttTaskRowProps> = memo(({
  task,
  subtasks,
  subtaskCount,
  isExpanded,
  showCalendar,
  onToggleExpansion,
  onToggleCalendar,
  onEditTask,
  onAddSubtask,
  onUpdateSubtaskStatus,
  onDeleteSubtask
}) => {
  const duration = task.startDate && task.endDate 
    ? calculateDuration(task.startDate, task.endDate)
    : null;

  const completedSubtasks = subtasks.filter(s => s.status === 'completed').length;
  const totalSubtasks = subtasks.length;
  const hasSubtasks = subtaskCount > 0;

  return (
    <div className="border rounded-lg shadow-sm mb-4 bg-white">
      {/* Task Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {hasSubtasks && (
              <button
                onClick={() => onToggleExpansion(task.id)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {isExpanded ? '🔽' : '▶️'}
              </button>
            )}
            
            <div>
              <h3 className="font-semibold text-lg text-gray-900">{task.title}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <span className={`px-2 py-1 rounded text-xs ${
                  task.priority === 'high' ? 'bg-red-100 text-red-800' :
                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {task.priority}
                </span>
                
                <span className={`px-2 py-1 rounded text-xs ${
                  task.status === 'completed' ? 'bg-green-100 text-green-800' :
                  task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {task.status}
                </span>
                
                {task.username && (
                  <span className="text-gray-500">
                    👤 {task.firstName} {task.lastName} (@{task.username})
                  </span>
                )}
                
                {hasSubtasks && (
                  <span className="text-blue-600">
                    📋 {isExpanded && totalSubtasks > 0 ? 
                      `${completedSubtasks}/${totalSubtasks} subtasks completed` : 
                      `${subtaskCount} subtasks available`}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {task.startDate && task.endDate && (
              <button
                onClick={() => onToggleCalendar(task.id)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
              </button>
            )}
            
            {/* Show Add Subtask button if no subtasks exist */}
            {!hasSubtasks && (
              <button
                onClick={() => onAddSubtask(task.id)}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
              >
                + Add Subtask
              </button>
            )}
            
            <button
              onClick={() => onEditTask(task)}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Edit Timeline
            </button>
          </div>
        </div>
        
        {/* Task Timeline Info */}
        <div className="mt-3 flex items-center space-x-6 text-sm">
          <div>
            <span className="text-gray-500">Start:</span>
            <span className="ml-1 font-medium">
              {task.startDate ? formatDateForDisplay(task.startDate) : 'Not set'}
            </span>
          </div>
          
          <div>
            <span className="text-gray-500">End:</span>
            <span className="ml-1 font-medium">
              {task.endDate ? formatDateForDisplay(task.endDate) : 'Not set'}
            </span>
          </div>
          
          {duration && (
            <div>
              <span className="text-gray-500">Duration:</span>
              <span className="ml-1 font-medium">{duration} days</span>
            </div>
          )}
        </div>
      </div>

      {/* Calendar View */}
      {showCalendar && task.startDate && task.endDate && (
        <div className="p-4 border-b">
          <GanttCalendarView task={task} subtasks={subtasks} />
        </div>
      )}

      {/* Subtasks */}
      {isExpanded && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">
              Subtasks {totalSubtasks > 0 ? `(${totalSubtasks})` : hasSubtasks ? '(Loading...)' : '(0)'}
            </h4>
            <button
              onClick={() => onAddSubtask(task.id)}
              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
            >
              + Add Subtask
            </button>
          </div>
          
          {totalSubtasks > 0 ? (
            <div className="space-y-2">
              {subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => onUpdateSubtaskStatus(subtask.id, subtask.status === 'completed' ? 'pending' : 'completed')}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      subtask.status === 'completed'
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-green-500'
                    }`}
                  >
                    {subtask.status === 'completed' && '✓'}
                  </button>
                  
                  <div>
                    <div className={`font-medium ${
                      subtask.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}>
                      {subtask.name}
                    </div>
                    
                    {subtask.description && (
                      <div className="text-sm text-gray-600 mt-1">{subtask.description}</div>
                    )}
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      {subtask.assignee && <span>👤 {subtask.assignee}</span>}
                      {subtask.startDate && (
                        <span>📅 {formatDateForDisplay(subtask.startDate)}</span>
                      )}
                      {subtask.endDate && (
                        <span>📅 {formatDateForDisplay(subtask.endDate)}</span>
                      )}
                      {subtask.referenceName && (
                        <span>🔗 {subtask.referenceName}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => onDeleteSubtask(subtask.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  🗑️
                </button>
              </div>
              ))}
            </div>
          ) : hasSubtasks ? (
            <div className="text-center py-4 text-gray-500">
              <p>Loading subtasks...</p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-3">No subtasks yet</p>
              <button
                onClick={() => onAddSubtask(task.id)}
                className="px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
              >
                + Add First Subtask
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

GanttTaskRow.displayName = 'GanttTaskRow';

export default GanttTaskRow;