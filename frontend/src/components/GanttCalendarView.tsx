import React, { memo } from 'react';
import { Task, Subtask } from '../types';
import { getDaysInRange } from '../utils/dateUtils';

interface GanttCalendarViewProps {
  task: Task;
  subtasks: Subtask[];
}

const GanttCalendarView: React.FC<GanttCalendarViewProps> = memo(({ task, subtasks }) => {
  if (!task.startDate || !task.endDate) {
    return (
      <div className="p-4 bg-gray-50 rounded">
        <p className="text-gray-500 text-sm">No date range set for this task.</p>
      </div>
    );
  }

  const days = getDaysInRange(task.startDate, task.endDate);

  return (
    <div className="space-y-3 p-4 bg-gray-50 rounded">
      {/* Main Task Timeline */}
      <div className="flex items-center">
        <div className="w-48 text-sm font-medium text-gray-900 pr-4 flex-shrink-0">
          🎯 {task.title}
        </div>
        <div className="flex space-x-1 flex-1">
          {days.map((day, dayIndex) => (
            <div key={dayIndex} className="flex-1 flex flex-col min-w-0">
              <div className="text-xs text-center text-gray-600 mb-1 py-1 w-full overflow-hidden">
                <div className="truncate">{day.label}</div>
              </div>
              <div className="relative h-8 bg-blue-500 rounded" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Subtask Timelines */}
      {subtasks.map((subtask) => {
        if (!subtask.startDate || !subtask.endDate) return null;
        
        return (
          <div key={subtask.id} className="flex items-center">
            <div className="w-48 text-sm text-gray-700 pr-4 flex-shrink-0 truncate">
              📋 {subtask.name}
            </div>
            <div className="flex space-x-1 flex-1">
              {days.map((day, dayIndex) => {
                const subtaskStart = new Date(subtask.startDate!);
                const subtaskEnd = new Date(subtask.endDate!);
                const currentDay = day.date;
                
                const isWithinSubtaskRange = currentDay >= subtaskStart && currentDay <= subtaskEnd;
                
                return (
                  <div key={dayIndex} className="flex-1 flex flex-col min-w-0">
                    <div className="text-xs text-center text-transparent mb-1 py-1 w-full overflow-hidden">
                      <div className="truncate">{day.label}</div>
                    </div>
                    <div className={`relative h-6 rounded ${
                      isWithinSubtaskRange 
                        ? (subtask.status === 'completed' ? 'bg-green-500' : 'bg-orange-500')
                        : 'bg-gray-200'
                    }`} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
});

GanttCalendarView.displayName = 'GanttCalendarView';

export default GanttCalendarView;