import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { TaskFormData, AttachmentFormData } from '../types';
import { taskService, attachmentService } from '../services/tasks';
import FileUpload from '../components/FileUpload';

const TaskCreator = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  // Task form data
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: ''
  });

  // File attachments
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [fileAttachments, setFileAttachments] = useState<{file: any, title: string}[]>([]);

  // URL attachments
  const [urlAttachments, setUrlAttachments] = useState<{url: string, title: string}[]>([]);
  const [urlForm, setUrlForm] = useState({ url: '', title: '' });

  const createTaskWithAttachmentsMutation = useMutation({
    mutationFn: async (data: { task: TaskFormData, fileAttachments: any[], urlAttachments: any[] }) => {
      // First create the task
      const task = await taskService.createTask(data.task, token!);
      const taskId = task.id;

      // Then create all attachments
      const attachmentPromises = [];

      // Add file attachments
      for (const fileAttachment of data.fileAttachments) {
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
      for (const urlAttachment of data.urlAttachments) {
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

  const handleFileUpload = (files: any[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const addFileAttachment = (file: any) => {
    setFileAttachments(prev => [...prev, { file, title: file.name || 'Uploaded File' }]);
    setUploadedFiles(prev => prev.filter(f => f !== file));
  };

  const updateFileAttachment = (index: number, field: string, value: string) => {
    setFileAttachments(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeFileAttachment = (index: number) => {
    setFileAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const addUrlAttachment = () => {
    if (urlForm.url.trim() && urlForm.title.trim()) {
      setUrlAttachments(prev => [...prev, { ...urlForm }]);
      setUrlForm({ url: '', title: '' });
    }
  };

  const removeUrlAttachment = (index: number) => {
    setUrlAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim()) {
      createTaskWithAttachmentsMutation.mutate({
        task: formData,
        fileAttachments,
        urlAttachments
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

            {/* File Upload Section */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Attach Files</h3>
              
              <div className="space-y-4">
                <FileUpload
                  onUploadComplete={handleFileUpload}
                  uploaderType="fileUploader"
                  variant="dropzone"
                />

                {uploadedFiles.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Uploaded Files (Add Details):</h4>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-blue-900">📄 {file.name}</span>
                          <button
                            type="button"
                            onClick={() => addFileAttachment(file)}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Add to Task
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {fileAttachments.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">File Attachments:</h4>
                    {fileAttachments.map((attachment, index) => (
                      <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-900">📄 {attachment.file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFileAttachment(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
                          <input
                            type="text"
                            value={attachment.title}
                            onChange={(e) => updateFileAttachment(index, 'title', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="File title"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* URL Attachments Section */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Attach URLs</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                    <input
                      type="url"
                      value={urlForm.url}
                      onChange={(e) => setUrlForm({ ...urlForm, url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={urlForm.title}
                      onChange={(e) => setUrlForm({ ...urlForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Link title"
                    />
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={addUrlAttachment}
                  disabled={!urlForm.url.trim() || !urlForm.title.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Add URL
                </button>

                {urlAttachments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">URL Attachments:</h4>
                    {urlAttachments.map((attachment, index) => (
                      <div key={index} className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-purple-900">🔗 {attachment.title}</div>
                          <div className="text-sm text-purple-700">{attachment.url}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeUrlAttachment(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Section */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={createTaskWithAttachmentsMutation.isPending || !formData.title.trim()}
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