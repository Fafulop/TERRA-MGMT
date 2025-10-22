import { useMemo, useState } from 'react';
import type { ProjectTask } from '../../types';
import { format, differenceInDays, startOfMonth, endOfMonth, eachMonthOfInterval, addMonths } from 'date-fns';

interface GanttChartProps {
  tasks: ProjectTask[];
  onTaskClick?: (task: ProjectTask) => void;
  onTaskUpdate?: (taskId: number, startDate: string, endDate: string) => void;
}

export default function GanttChart({ tasks, onTaskClick, onTaskUpdate }: GanttChartProps) {
  const [hoveredTask, setHoveredTask] = useState<number | null>(null);

  // Calculate timeline range
  const timelineRange = useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date();
      return {
        start: startOfMonth(today),
        end: endOfMonth(addMonths(today, 3)),
      };
    }

    const dates = tasks.flatMap(t => [
      new Date(t.start_date || t.startDate),
      new Date(t.end_date || t.endDate),
    ]);

    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    // Add padding
    return {
      start: startOfMonth(addMonths(minDate, -1)),
      end: endOfMonth(addMonths(maxDate, 1)),
    };
  }, [tasks]);

  const months = useMemo(() => {
    return eachMonthOfInterval({ start: timelineRange.start, end: timelineRange.end });
  }, [timelineRange]);

  const totalDays = differenceInDays(timelineRange.end, timelineRange.start);

  // Calculate task bar position and width
  const getTaskStyle = (task: ProjectTask) => {
    const taskStart = new Date(task.start_date || task.startDate);
    const taskEnd = new Date(task.end_date || task.endDate);

    const daysFromStart = differenceInDays(taskStart, timelineRange.start);
    const taskDuration = differenceInDays(taskEnd, taskStart) + 1;

    const left = (daysFromStart / totalDays) * 100;
    const width = (taskDuration / totalDays) * 100;

    return { left: `${left}%`, width: `${width}%` };
  };

  // Get status color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 hover:bg-green-600';
      case 'in_progress':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'pending':
      default:
        return 'bg-gray-400 hover:bg-gray-500';
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'high':
        return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">High</span>;
      case 'medium':
        return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Med</span>;
      case 'low':
        return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Low</span>;
      default:
        return null;
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No tasks in this project yet. Add tasks to see the Gantt chart.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Timeline Header */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex">
          {/* Task Names Column */}
          <div className="w-64 flex-shrink-0 border-r border-gray-200 p-3 font-semibold text-sm text-gray-700">
            Task
          </div>

          {/* Timeline Months */}
          <div className="flex-1 flex">
            {months.map((month, idx) => (
              <div
                key={idx}
                className="flex-1 border-r border-gray-200 p-3 text-center font-semibold text-sm text-gray-700"
              >
                {format(month, 'MMM yyyy')}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="divide-y divide-gray-200">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex hover:bg-gray-50 transition-colors"
            onMouseEnter={() => setHoveredTask(task.id)}
            onMouseLeave={() => setHoveredTask(null)}
          >
            {/* Task Name Column */}
            <div className="w-64 flex-shrink-0 border-r border-gray-200 p-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">
                    {task.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {getPriorityBadge(task.priority)}
                    <span className="text-xs text-gray-500">
                      {task.username || task.task_username || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Bar */}
            <div className="flex-1 relative p-2">
              {/* Grid lines */}
              <div className="absolute inset-0 flex">
                {months.map((_, idx) => (
                  <div key={idx} className="flex-1 border-r border-gray-100" />
                ))}
              </div>

              {/* Task Bar */}
              <div className="relative h-8">
                <div
                  className={`absolute h-full rounded cursor-pointer transition-all ${getStatusColor(
                    task.status
                  )} ${hoveredTask === task.id ? 'shadow-lg scale-105' : 'shadow'}`}
                  style={getTaskStyle(task)}
                  onClick={() => onTaskClick?.(task)}
                  title={`${task.title}\n${format(
                    new Date(task.start_date || task.startDate),
                    'MMM d'
                  )} - ${format(new Date(task.end_date || task.endDate), 'MMM d, yyyy')}\nStatus: ${
                    task.status
                  }`}
                >
                  {/* Task label on bar */}
                  <div className="h-full flex items-center px-2 text-white text-xs font-medium truncate">
                    {hoveredTask === task.id && (
                      <span>
                        {format(new Date(task.start_date || task.startDate), 'MMM d')} -{' '}
                        {format(new Date(task.end_date || task.endDate), 'MMM d')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="border-t border-gray-200 bg-gray-50 p-3">
        <div className="flex items-center gap-6 text-sm">
          <span className="font-semibold text-gray-700">Status:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-400 rounded"></div>
            <span className="text-gray-600">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-gray-600">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-600">Completed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
