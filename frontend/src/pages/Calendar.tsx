import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getTasks } from '../services/tasks';
import { getPersonalTasks } from '../services/personalTasks';
import CalendarView from '../components/CalendarView';
import NotificationBell from '../components/NotificationBell';
import NotificationCenter from '../components/NotificationCenter';
import type { Task, PersonalTask } from '../types';

export default function Calendar() {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Fetch all tasks
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: getTasks,
  });

  // Fetch personal tasks
  const { data: personalTasks = [], isLoading: isLoadingPersonal } = useQuery<PersonalTask[]>({
    queryKey: ['personalTasks'],
    queryFn: getPersonalTasks,
  });

  const isLoading = isLoadingTasks || isLoadingPersonal;

  const handleEventSelect = (event: any) => {
    setSelectedEvent(event);
  };

  const handleViewTask = () => {
    if (selectedEvent) {
      if (selectedEvent.resource.type === 'task') {
        navigate(`/task/${selectedEvent.id}`);
      } else {
        // Personal tasks don't have a detail page yet, could navigate to personal tasks page
        navigate('/personal');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div className="flex items-center gap-3">
                <CalendarIcon className="text-blue-600" size={32} />
                <h1 className="text-3xl font-bold text-gray-900">Task Calendar</h1>
              </div>
            </div>
            <NotificationBell onClick={() => setShowNotifications(true)} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <CalendarView
              tasks={tasks}
              personalTasks={personalTasks}
              onSelectEvent={handleEventSelect}
            />
          </div>
        )}
      </main>

      {/* Notification Center Modal */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedEvent.resource.task.title}
            </h3>

            {selectedEvent.resource.task.description && (
              <p className="text-gray-600 mb-4">{selectedEvent.resource.task.description}</p>
            )}

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-gray-700">Type:</span>
                <span className="text-gray-600 capitalize">
                  {selectedEvent.resource.type === 'task' ? 'General Task' : 'Personal Task'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-gray-700">Status:</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedEvent.resource.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : selectedEvent.resource.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {selectedEvent.resource.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-gray-700">Priority:</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedEvent.resource.priority === 'high'
                      ? 'bg-red-100 text-red-800'
                      : selectedEvent.resource.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {selectedEvent.resource.priority}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-gray-700">Area:</span>
                <span className="text-gray-600">{selectedEvent.resource.task.area}</span>
              </div>
              {selectedEvent.resource.task.subarea && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-700">Subarea:</span>
                  <span className="text-gray-600">{selectedEvent.resource.task.subarea}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleViewTask}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                View Details
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
