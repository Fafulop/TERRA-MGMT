import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { taskService } from '../services/tasks';
import { useTaskOptimized } from '../hooks/useTaskQueries';
import CommentForm from '../components/CommentForm';
import CommentList from '../components/CommentList';
import AttachmentUpload from '../components/AttachmentUpload';
import AttachmentList from '../components/AttachmentList';

const TaskDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, token, logout } = useAuth();
  const queryClient = useQueryClient();
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);

  // Fetch the task details using optimized hook
  const taskId = id ? parseInt(id) : 0;
  const { data: task, isLoading, error, refetch } = useTaskOptimized(taskId);

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: string) => 
      taskService.updateTask(taskId, { status: newStatus }, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: () => taskService.deleteTask(taskId, token!),
    onSuccess: () => {
      navigate('/tasks');
    }
  });

  const handleStatusChange = (newStatus: string) => {
    updateStatusMutation.mutate(newStatus);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-600 mb-4">Please log in to continue</h2>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Task Not Found</h2>
          <p className="text-gray-600 mb-4">The task you're looking for doesn't exist or you don't have permission to view it.</p>
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/tasks')}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Task Details</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.username}!</span>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Task Header */}
          <div className="px-6 py-8 border-b border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">{task.title}</h1>
              {task.userId === user?.id && (
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => navigate(`/edit-task/${task.id}`)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteTaskMutation.isPending}
                    className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {deleteTaskMutation.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(task.priority)}`}>
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                </svg>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(task.status)}`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${task.status === 'completed' ? 'bg-green-500' : task.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                {task.status.replace('_', ' ').charAt(0).toUpperCase() + task.status.replace('_', ' ').slice(1)}
              </span>
              {task.dueDate && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Due: {formatDate(task.dueDate)}
                </span>
              )}
            </div>

            {/* Task Information */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <dl className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-gray-900">{formatDateTime(task.createdAt)}</dd>
                </div>
                {task.updatedAt !== task.createdAt && (
                  <div>
                    <dt className="font-medium text-gray-500">Last Updated</dt>
                    <dd className="mt-1 text-gray-900">{formatDateTime(task.updatedAt)}</dd>
                  </div>
                )}
                <div>
                  <dt className="font-medium text-gray-500">Task ID</dt>
                  <dd className="mt-1 text-gray-900">#{task.id}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Priority Level</dt>
                  <dd className="mt-1 text-gray-900 capitalize">{task.priority}</dd>
                </div>
                {task.dueDate && (
                  <div>
                    <dt className="font-medium text-gray-500">Due Date</dt>
                    <dd className="mt-1 text-gray-900">{formatDate(task.dueDate)}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Change Status:</label>
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updateStatusMutation.isPending}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              {updateStatusMutation.isPending && (
                <div className="text-sm text-gray-500">Updating...</div>
              )}
            </div>
          </div>

          {/* Task Content */}
          <div className="px-6 py-6">
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
                {task.description ? (
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{task.description}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No description provided.</p>
                )}
              </div>

            </div>
          </div>

          {/* Attachments Section */}
          <div className="px-6 py-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Attachments</h3>
              <button
                onClick={() => setShowAttachments(!showAttachments)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg 
                  className="w-4 h-4 mr-2" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a2 2 0 00-2.828-2.828z" />
                </svg>
                {showAttachments ? 'Hide Attachments' : 'Manage Attachments'}
              </button>
            </div>
            
            <div className="space-y-4">
              <AttachmentList taskId={task.id} />
              {showAttachments && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Attachment</h4>
                  <AttachmentUpload 
                    taskId={task.id} 
                    onAttachmentAdded={() => setShowAttachments(false)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="px-6 py-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Comments & Updates</h3>
              <button
                onClick={() => setShowCommentForm(!showCommentForm)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg 
                  className="w-4 h-4 mr-2" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {showCommentForm ? 'Cancel' : 'Add Comment'}
              </button>
            </div>
            
            <div className="space-y-6">
              {showCommentForm && (
                <CommentForm 
                  taskId={task.id} 
                  onCommentAdded={() => setShowCommentForm(false)}
                />
              )}
              <CommentList taskId={task.id} />
            </div>
          </div>

          {/* Actions Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-center">
              <button
                onClick={() => navigate('/tasks')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Tasks
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TaskDetail;