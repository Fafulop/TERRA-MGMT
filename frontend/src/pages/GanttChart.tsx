import React, { useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Task } from '../types';

// Import our new hooks and components
import { useGanttData } from '../hooks/useGanttData';
import { useGanttMutations } from '../hooks/useGanttMutations';
import { useGanttState } from '../hooks/useGanttState';
import GanttTaskRow from '../components/GanttTaskRow';
import GanttFormModal from '../components/GanttFormModal';
import ErrorBoundary from '../components/ErrorBoundary';
import { validateSubtaskDates } from '../utils/dateUtils';

const GanttChart: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Use our new state management hook
  const { state, actions } = useGanttState();
  
  // Use our new data fetching hook
  const { tasks, allSubtasks, subtaskCounts, referenceData, tasksLoading, subtasksLoading, tasksError } = useGanttData(state.expandedTasks);
  
  // Use our new mutations hook with form reset callbacks
  const {
    updateTaskDatesMutation,
    createSubtaskMutation,
    updateSubtaskStatusMutation,
    deleteSubtaskMutation
  } = useGanttMutations({
    resetTaskForm: actions.resetForm,
    resetSubtaskForm: actions.resetSubtaskForm
  });

  // Handle authentication
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Memoize stats calculation for performance
  const stats = useMemo(() => {
    const totalSubtasks = Object.values(allSubtasks).flat().length;
    return {
      totalTasks: tasks.length,
      totalSubtasks,
      expandedTasks: state.expandedTasks.size
    };
  }, [tasks.length, allSubtasks, state.expandedTasks.size]);

  // Handle task timeline form submission
  const handleSubmitTimeline = useCallback(() => {
    if (!state.selectedTaskId || !state.startDate || !state.endDate) {
      alert('Please fill in all required fields.');
      return;
    }

    if (new Date(state.startDate) >= new Date(state.endDate)) {
      alert('Start date must be before end date.');
      return;
    }

    updateTaskDatesMutation.mutate({
      taskId: state.editingEntry?.taskId || state.selectedTaskId,
      startDate: state.startDate,
      endDate: state.endDate
    });
  }, [state.selectedTaskId, state.startDate, state.endDate, state.editingEntry, updateTaskDatesMutation]);

  // Handle subtask form submission
  const handleSubmitSubtask = useCallback(() => {
    if (!state.subtaskFormData.name.trim() || !state.showAddSubtaskForm) {
      alert('Please fill in the subtask name.');
      return;
    }
    
    // Find the parent task for validation
    const parentTask = tasks.find(task => task.id === state.showAddSubtaskForm);
    if (!parentTask) {
      alert('Parent task not found.');
      return;
    }

    // Validate dates if provided
    if (state.subtaskFormData.startDate && state.subtaskFormData.endDate) {
      const validation = validateSubtaskDates(
        state.subtaskFormData.startDate,
        state.subtaskFormData.endDate,
        parentTask.startDate,
        parentTask.endDate
      );

      if (!validation.isValid) {
        alert(validation.errors.join('\n'));
        return;
      }
    }

    createSubtaskMutation.mutate({
      taskId: state.showAddSubtaskForm,
      subtaskData: state.subtaskFormData
    });
  }, [state.subtaskFormData, state.showAddSubtaskForm, tasks, createSubtaskMutation]);

  // Handle editing a task timeline
  const handleEditTask = useCallback((task: Task) => {
    actions.setEditingEntry({
      taskId: task.id,
      startDate: task.startDate || '',
      endDate: task.endDate || ''
    });
  }, [actions]);

  // Handle subtask status toggle
  const handleUpdateSubtaskStatus = useCallback((subtaskId: number, status: 'pending' | 'completed') => {
    // Find the current subtask to preserve all its data
    let currentSubtask = null;
    for (const taskSubtasks of Object.values(allSubtasks)) {
      const subtask = taskSubtasks.find(s => s.id === subtaskId);
      if (subtask) {
        currentSubtask = subtask;
        break;
      }
    }
    
    if (!currentSubtask) {
      console.error('Subtask not found for status update');
      return;
    }

    // Preserve all current subtask data, only changing the status
    updateSubtaskStatusMutation.mutate({ 
      subtaskId, 
      status, 
      currentSubtask: {
        name: currentSubtask.name,
        description: currentSubtask.description || '',
        assignee: currentSubtask.assignee || '',
        referenceType: (currentSubtask.referenceType as 'task' | 'subtask') || 'task',
        referenceId: currentSubtask.referenceId,
        referenceName: currentSubtask.referenceName || '',
        startDate: currentSubtask.startDate || '',
        endDate: currentSubtask.endDate || ''
      }
    });
  }, [updateSubtaskStatusMutation, allSubtasks]);

  // Handle subtask deletion
  const handleDeleteSubtask = useCallback((subtaskId: number) => {
    if (confirm('Are you sure you want to delete this subtask?')) {
      deleteSubtaskMutation.mutate(subtaskId);
    }
  }, [deleteSubtaskMutation]);

  // Handle form close with proper cleanup
  const handleCloseForm = useCallback(() => {
    actions.resetForm();
  }, [actions]);

  const handleCloseSubtaskForm = useCallback(() => {
    actions.resetSubtaskForm();
  }, [actions]);

  // Loading and error states
  if (tasksLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Gantt chart...</p>
        </div>
      </div>
    );
  }

  if (tasksError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold mb-2">Error loading tasks</p>
          <p className="text-sm">{tasksError.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Home"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Home
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gantt Chart</h1>
                <p className="text-gray-600 mt-2">Project timeline and task management</p>
              </div>
            </div>
            
            <button
              onClick={() => actions.toggleAddForm(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              + Add Task Timeline
            </button>
          </div>
          
          {/* Stats - Memoized for performance */}
          <div className="flex items-center space-x-6 mt-4 text-sm text-gray-600">
            <span>📊 {stats.totalTasks} tasks</span>
            <span>📋 {stats.totalSubtasks} subtasks</span>
            <span>🔍 {stats.expandedTasks} expanded</span>
            {subtasksLoading && <span>🔄 Loading subtasks...</span>}
          </div>
        </div>

        {/* Task List */}
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <p className="text-xl text-gray-600 mb-4">No tasks in Gantt chart yet</p>
            <p className="text-gray-500 mb-6">Add task timelines to start planning your project</p>
            <button
              onClick={() => actions.toggleAddForm(true)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add First Task Timeline
            </button>
          </div>
        ) : (
          <ErrorBoundary fallback={
            <div className="text-center py-8 bg-red-50 rounded-lg">
              <p className="text-red-600">Failed to render task list. Please refresh the page.</p>
            </div>
          }>
            <div className="space-y-4">
              {tasks.map((task) => {
                const taskSubtasks = allSubtasks[task.id] || [];
                const subtaskCount = subtaskCounts[task.id] || 0;
                const isExpanded = state.expandedTasks.has(task.id);
                const showCalendar = state.showCalendar.has(task.id);

                return (
                  <ErrorBoundary
                    key={task.id}
                    fallback={
                      <div className="p-4 bg-red-50 rounded border-red-200 border">
                        <p className="text-red-600">Error loading task: {task.title}</p>
                      </div>
                    }
                  >
                    <GanttTaskRow
                      task={task}
                      subtasks={taskSubtasks}
                      subtaskCount={subtaskCount}
                      isExpanded={isExpanded}
                      showCalendar={showCalendar}
                      onToggleExpansion={actions.toggleTaskExpansion}
                      onToggleCalendar={actions.toggleCalendar}
                      onEditTask={handleEditTask}
                      onAddSubtask={actions.setSubtaskForm}
                      onUpdateSubtaskStatus={handleUpdateSubtaskStatus}
                      onDeleteSubtask={handleDeleteSubtask}
                    />
                  </ErrorBoundary>
                );
              })}
            </div>
          </ErrorBoundary>
        )}

        {/* Form Modal */}
        <ErrorBoundary fallback={
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md">
              <p className="text-red-600">Error loading form. Please close and try again.</p>
              <button 
                onClick={() => {actions.resetForm(); actions.resetSubtaskForm();}}
                className="mt-4 px-4 py-2 bg-gray-500 text-white rounded"
              >
                Close
              </button>
            </div>
          </div>
        }>
          <GanttFormModal
          // Task timeline form props
          showAddForm={state.showAddForm}
          editingEntry={state.editingEntry}
          selectedTaskId={state.selectedTaskId}
          startDate={state.startDate}
          endDate={state.endDate}
          tasks={tasks}
          
          // Subtask form props
          showAddSubtaskForm={state.showAddSubtaskForm}
          subtaskFormData={state.subtaskFormData}
          referenceData={referenceData}
          
          // Actions
          onSetSelectedTask={actions.setSelectedTask}
          onSetDates={actions.setDates}
          onCloseForm={handleCloseForm}
          onSubmitTimeline={handleSubmitTimeline}
          onUpdateSubtaskForm={actions.updateSubtaskForm}
          onSubmitSubtask={handleSubmitSubtask}
          onCloseSubtaskForm={handleCloseSubtaskForm}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default GanttChart;