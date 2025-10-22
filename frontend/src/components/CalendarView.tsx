import { useMemo, useEffect, useRef } from 'react';
import { Calendar, dateFnsLocalizer, View, Components } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarView.css';
import type { Task, PersonalTask } from '../types';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: {
    type: 'task' | 'personal';
    task: Task | PersonalTask;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
  };
}

interface CalendarViewProps {
  tasks: Task[];
  personalTasks: PersonalTask[];
  onSelectEvent?: (event: CalendarEvent) => void;
  defaultView?: View;
  defaultDate?: Date;
}

export default function CalendarView({
  tasks,
  personalTasks,
  onSelectEvent,
  defaultView = 'month',
  defaultDate = new Date(),
}: CalendarViewProps) {
  const events = useMemo<CalendarEvent[]>(() => {
    const taskEvents: CalendarEvent[] = tasks
      .filter((task) => task.dueDate)
      .map((task) => ({
        id: task.id,
        title: `[Task] ${task.title}`,
        start: new Date(task.dueDate!),
        end: new Date(task.dueDate!),
        resource: {
          type: 'task' as const,
          task,
          status: task.status,
          priority: task.priority,
        },
      }));

    const personalTaskEvents: CalendarEvent[] = personalTasks
      .filter((task) => task.dueDate)
      .map((task) => ({
        id: task.id,
        title: `[Personal] ${task.title}`,
        start: new Date(task.dueDate!),
        end: new Date(task.dueDate!),
        resource: {
          type: 'personal' as const,
          task,
          status: task.status,
          priority: task.priority,
        },
      }));

    return [...taskEvents, ...personalTaskEvents];
  }, [tasks, personalTasks]);

  const eventStyleGetter = (event: CalendarEvent) => {
    const { status, priority, type } = event.resource;

    let backgroundColor = '#d1d5db'; // light gray for pending
    let borderColor = '#9ca3af';

    // Status colors
    if (status === 'in_progress') {
      backgroundColor = '#93c5fd'; // lighter blue
      borderColor = '#60a5fa';
    } else if (status === 'completed') {
      backgroundColor = '#10b981'; // green
      borderColor = '#059669';
    }

    // Personal tasks get a purple tint
    if (type === 'personal') {
      backgroundColor = '#c4b5fd'; // lighter purple
      borderColor = '#a78bfa';
    }

    // High priority tasks get a red border
    if (priority === 'high' && status !== 'completed') {
      borderColor = '#ef4444'; // red
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderWidth: '2px',
        borderStyle: 'solid',
        borderRadius: '4px',
        opacity: status === 'completed' ? 0.7 : 1,
        color: 'white',
        fontSize: '0.875rem',
        padding: '2px 6px',
      },
    };
  };

  // Custom Agenda Event component
  const AgendaEvent = ({ event }: { event: CalendarEvent }) => {
    const task = event.resource.task;
    const { status, priority, type } = event.resource;

    const priorityColor =
      priority === 'high' ? 'bg-red-100 text-red-800' :
      priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
      'bg-gray-100 text-gray-800';

    const personInCharge = type === 'personal' ? 'You' :
      (task.username || task.firstName || task.lastName
        ? `${task.firstName || ''} ${task.lastName || ''}`.trim() || task.username
        : 'Unknown');

    return (
      <div className="flex items-center gap-2 py-1">
        <span className="flex-1 font-medium text-gray-900">{task.title}</span>
        <span className="w-32 text-sm text-gray-900 truncate">{personInCharge}</span>
        <span className="w-28 text-sm text-gray-900 truncate">{task.area}</span>
        <span className="w-28 text-sm text-gray-900 truncate">{task.subarea}</span>
        <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColor} w-20 text-center`}>
          {priority}
        </span>
      </div>
    );
  };

  // Custom components for the calendar
  const calendarComponents: Components<CalendarEvent> = {
    agenda: {
      event: AgendaEvent,
    },
  };

  // Use useEffect to inject custom headers into the Event column header
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!calendarRef.current) return;

    // Find the Event column header in agenda view
    const eventHeader = calendarRef.current.querySelector(
      '.rbc-agenda-view table.rbc-agenda-table thead > tr > th:nth-child(3)'
    );

    if (eventHeader) {
      // Create custom header content
      eventHeader.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; padding: 12px 8px;">
          <span style="flex: 1; font-weight: 600;">Event</span>
          <span style="width: 128px; font-weight: 600;">Person in Charge</span>
          <span style="width: 112px; font-weight: 600;">Area</span>
          <span style="width: 112px; font-weight: 600;">Subarea</span>
          <span style="width: 80px; text-align: center; font-weight: 600;">Priority</span>
        </div>
      `;
    }
  });

  return (
    <div className="h-full" ref={calendarRef}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%', minHeight: '600px' }}
        onSelectEvent={onSelectEvent}
        eventPropGetter={eventStyleGetter}
        defaultView={defaultView}
        defaultDate={defaultDate}
        views={['month']}
        popup
        components={calendarComponents}
        length={365} // Show all tasks in agenda view for 1 year range
        tooltipAccessor={(event: CalendarEvent) => {
          const { status, priority, type } = event.resource;
          return `${event.title}\nStatus: ${status}\nPriority: ${priority}\nType: ${type}`;
        }}
      />

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-500 rounded"></div>
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded opacity-70"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-500 rounded"></div>
          <span>Personal Task</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-red-500 rounded"></div>
          <span>High Priority</span>
        </div>
      </div>
    </div>
  );
}
