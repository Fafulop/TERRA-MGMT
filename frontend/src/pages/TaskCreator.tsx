import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { TaskFormData, AttachmentFormData } from '../types';
import { taskService, attachmentService } from '../services/tasks';
import { useAttachmentManager } from '../hooks/useAttachmentManager';
import AttachmentSection from '../components/AttachmentSection';
import AreaSubareaSelector from '../components/AreaSubareaSelector';

const TaskCreator = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  // Task form data
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    area: '',
    subarea: ''
  });

  // Attachment management
  const {
    uploadedFiles,
    fileAttachments,
    urlAttachments,
    urlForm,
    handleFileUpload,
    addFileAttachment,
    updateFileAttachment,
    removeFileAttachment,
    addUrlAttachment,
    removeUrlAttachment,
    updateUrlForm,
    getAttachmentData
  } = useAttachmentManager();

  const createTaskWithAttachmentsMutation = useMutation({
    mutationFn: async (data: { task: TaskFormData }) => {
      // First create the task
      const task = await taskService.createTask(data.task, token!);
      const taskId = task.id;

      // Get attachment data from hook
      const { fileAttachments: currentFileAttachments, urlAttachments: currentUrlAttachments } = getAttachmentData();

      // Then create all attachments
      const attachmentPromises = [];

      // Add file attachments
      for (const fileAttachment of currentFileAttachments) {
        const attachmentData: AttachmentFormData = {
          fileName: fileAttachment.title,
          fileUrl: fileAttachment.file.url || fileAttachment.file.fileUrl,
          fileSize: fileAttachment.file.size,
          fileType: fileAttachment.file.type,
          attachmentType: 'file'
        };
        attachmentPromises.push(
          attachmentService.createTaskAttachment(taskId, attachmentData, token!)
        );
      }

      // Add URL attachments
      for (const urlAttachment of currentUrlAttachments) {
        const attachmentData: AttachmentFormData = {
          fileName: urlAttachment.title,
          fileUrl: urlAttachment.url,
          attachmentType: 'url'
        };
        attachmentPromises.push(
          attachmentService.createTaskAttachment(taskId, attachmentData, token!)
        );
      }

      // Wait for all attachments to be created
      await Promise.all(attachmentPromises);

      return task;
    },
    onSuccess: () => {
      navigate('/tasks');
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAreaChange = (areaName: string) => {
    setFormData(prev => ({
      ...prev,
      area: areaName
    }));
  };

  const handleSubareaChange = (subareaName: string) => {
    setFormData(prev => ({
      ...prev,
      subarea: subareaName
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim() && formData.area.trim() && formData.subarea.trim()) {
      createTaskWithAttachmentsMutation.mutate({
        task: formData
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-900">Create New Task</h1>
              <button
                onClick={() => navigate('/tasks')}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Task Information */}
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter task title..."
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                  placeholder="Describe your task..."
                />
              </div>

              {/* Area and Subarea */}
              <AreaSubareaSelector
                selectedArea={formData.area}
                selectedSubarea={formData.subarea}
                onAreaChange={handleAreaChange}
                onSubareaChange={handleSubareaChange}
                required={true}
                showLabels={true}
                areaPlaceholder="Select area..."
                subareaPlaceholder="Select subarea..."
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Attachments Section */}
            <AttachmentSection
              uploadedFiles={uploadedFiles}
              fileAttachments={fileAttachments}
              onFileUpload={handleFileUpload}
              onAddFileAttachment={addFileAttachment}
              onUpdateFileAttachment={updateFileAttachment}
              onRemoveFileAttachment={removeFileAttachment}
              urlAttachments={urlAttachments}
              urlForm={urlForm}
              onUpdateUrlForm={updateUrlForm}
              onAddUrlAttachment={addUrlAttachment}
              onRemoveUrlAttachment={removeUrlAttachment}
              showTitle={true}
              compact={false}
            />

            {/* Submit Section */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={createTaskWithAttachmentsMutation.isPending || !formData.title.trim() || !formData.area.trim() || !formData.subarea.trim()}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createTaskWithAttachmentsMutation.isPending ? 'Creating Task...' : 'Create Task'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/tasks')}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              </div>

              {createTaskWithAttachmentsMutation.error && (
                <div className="mt-3 text-red-600 text-sm">
                  Error: {createTaskWithAttachmentsMutation.error.message}
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskCreator;