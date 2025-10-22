import { useState } from 'react';
import { Calendar, Plus, ArrowLeft, FolderKanban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GanttChart from '../components/gantt/GanttChart';
import ProjectForm from '../components/gantt/ProjectForm';
import AddTaskModal from '../components/gantt/AddTaskModal';
import TaskDetailModal from '../components/gantt/TaskDetailModal';
import {
  useProjects,
  useProject,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useAddTaskToProject,
  useUpdateProjectTask,
  useRemoveTaskFromProject,
} from '../hooks/useProjectQueries';
import { useTasksOptimized } from '../hooks/useTaskQueries';
import type { ProjectFormData, TaskFormData, ProjectTask } from '../types';

export default function GanttChartPage() {
  const navigate = useNavigate();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);

  // Queries
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: projectDetails, isLoading: projectLoading } = useProject(selectedProjectId || 0);
  const { data: allTasks } = useTasksOptimized();

  // Mutations
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();
  const addTaskMutation = useAddTaskToProject();
  const updateTaskMutation = useUpdateProjectTask();
  const removeTaskMutation = useRemoveTaskFromProject();

  // Auto-select first project
  useState(() => {
    if (projects && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  });

  const handleCreateProject = async (data: ProjectFormData) => {
    try {
      const newProject = await createProjectMutation.mutateAsync(data);
      setSelectedProjectId(newProject.id);
      setShowProjectForm(false);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project');
    }
  };

  const handleAddExistingTask = async (taskId: number, startDate: string, endDate: string) => {
    if (!selectedProjectId) return;

    try {
      await addTaskMutation.mutateAsync({
        projectId: selectedProjectId,
        data: {
          taskId,
          start_date: startDate,
          end_date: endDate,
        },
      });
      setShowAddTaskModal(false);
    } catch (error) {
      console.error('Failed to add task:', error);
      alert('Failed to add task to project');
    }
  };

  const handleCreateNewTask = async (
    taskData: TaskFormData,
    startDate: string,
    endDate: string
  ) => {
    if (!selectedProjectId) return;

    try {
      await addTaskMutation.mutateAsync({
        projectId: selectedProjectId,
        data: {
          createTask: taskData,
          start_date: startDate,
          end_date: endDate,
        },
      });
      setShowAddTaskModal(false);
    } catch (error) {
      console.error('Failed to create and add task:', error);
      alert('Failed to create and add task');
    }
  };

  const handleUpdateTask = async (
    taskId: number,
    data: { start_date?: string; end_date?: string; status?: string }
  ) => {
    if (!selectedProjectId) return;

    try {
      await updateTaskMutation.mutateAsync({
        projectId: selectedProjectId,
        taskId,
        data,
      });
      setSelectedTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
      alert('Failed to update task');
    }
  };

  const handleRemoveTask = async (taskId: number) => {
    if (!selectedProjectId) return;

    try {
      await removeTaskMutation.mutateAsync({
        projectId: selectedProjectId,
        taskId,
      });
      setSelectedTask(null);
    } catch (error) {
      console.error('Failed to remove task:', error);
      alert('Failed to remove task from project');
    }
  };

  const handleTaskClick = (task: ProjectTask) => {
    setSelectedTask(task);
  };

  const selectedProject = projects?.find((p) => p.id === selectedProjectId);

  // Filter out tasks that are already in the project
  const availableTasks =
    allTasks?.filter(
      (task) => !projectDetails?.tasks?.some((pt) => pt.task_id === task.id || pt.taskId === task.id)
    ) || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div className="flex items-center gap-3">
                <Calendar size={32} className="text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Gantt Chart</h1>
              </div>
            </div>
            <button
              onClick={() => setShowProjectForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              New Project
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {projectsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading projects...</div>
          </div>
        ) : projects && projects.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FolderKanban size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Projects Yet</h2>
            <p className="text-gray-500 mb-6">
              Create your first project to start visualizing tasks in a Gantt chart
            </p>
            <button
              onClick={() => setShowProjectForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Create Project
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Project Selector */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Project
                  </label>
                  <select
                    value={selectedProjectId || ''}
                    onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                    className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {projects?.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name} ({project.task_count || 0} tasks)
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProject && (
                  <button
                    onClick={() => setShowAddTaskModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Plus size={20} />
                    Add Task
                  </button>
                )}
              </div>

              {/* Project Info */}
              {selectedProject && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Area</div>
                      <div className="font-medium text-gray-900">
                        {selectedProject.area}
                        {selectedProject.subarea && ` > ${selectedProject.subarea}`}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Status</div>
                      <div className="font-medium text-gray-900 capitalize">
                        {selectedProject.status.replace('_', ' ')}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Tasks</div>
                      <div className="font-medium text-gray-900">
                        {selectedProject.completed_task_count || 0} /{' '}
                        {selectedProject.task_count || 0} completed
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Progress</div>
                      <div className="font-medium text-gray-900">
                        {selectedProject.progress_percentage || 0}%
                      </div>
                    </div>
                  </div>
                  {selectedProject.description && (
                    <div className="mt-4">
                      <div className="text-sm text-gray-500 mb-1">Description</div>
                      <div className="text-gray-700">{selectedProject.description}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Gantt Chart */}
            {projectLoading ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="text-gray-500">Loading project details...</div>
              </div>
            ) : (
              <GanttChart
                tasks={projectDetails?.tasks || []}
                onTaskClick={handleTaskClick}
              />
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {showProjectForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Project</h2>
            <ProjectForm
              onSubmit={handleCreateProject}
              onCancel={() => setShowProjectForm(false)}
              isLoading={createProjectMutation.isPending}
            />
          </div>
        </div>
      )}

      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onAddExisting={handleAddExistingTask}
        onCreateNew={handleCreateNewTask}
        availableTasks={availableTasks}
        isLoading={addTaskMutation.isPending}
      />

      <TaskDetailModal
        isOpen={!!selectedTask}
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleUpdateTask}
        onRemove={handleRemoveTask}
        isLoading={updateTaskMutation.isPending || removeTaskMutation.isPending}
      />
    </div>
  );
}
