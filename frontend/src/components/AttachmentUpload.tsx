import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { attachmentService } from '../services/tasks';
import { AttachmentFormData } from '../types';
import FileUpload from './FileUpload';

interface AttachmentUploadProps {
  taskId?: number;
  commentId?: number;
  onAttachmentAdded?: () => void;
}

const AttachmentUpload = ({ taskId, commentId, onAttachmentAdded }: AttachmentUploadProps) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  // File upload states
  const [showFileForm, setShowFileForm] = useState(false);
  const [fileFormData, setFileFormData] = useState({ title: '' });
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  
  // URL upload states
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [urlFormData, setUrlFormData] = useState({ url: '', title: '' });

  const createAttachmentMutation = useMutation({
    mutationFn: (attachmentData: AttachmentFormData) => {
      if (taskId) {
        return attachmentService.createTaskAttachment(taskId, attachmentData, token!);
      } else if (commentId) {
        return attachmentService.createCommentAttachment(commentId, attachmentData, token!);
      }
      throw new Error('Either taskId or commentId must be provided');
    },
    onSuccess: () => {
      if (taskId) {
        queryClient.invalidateQueries({ queryKey: ['task-attachments', taskId] });
      } else if (commentId) {
        queryClient.invalidateQueries({ queryKey: ['comment-attachments', commentId] });
      }
      // Reset forms
      setShowFileForm(false);
      setShowUrlForm(false);
      setFileFormData({ title: '' });
      setUrlFormData({ url: '', title: '' });
      setUploadedFile(null);
      onAttachmentAdded?.();
    }
  });

  const handleFileUpload = (files: any[]) => {
    if (files.length > 0) {
      console.log('UploadThing file response:', files[0]); // Debug log
      setUploadedFile(files[0]);
      setShowFileForm(true);
    }
  };

  const handleFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFile || !fileFormData.title.trim()) return;

    const attachmentData: AttachmentFormData = {
      fileName: fileFormData.title.trim(),
      fileUrl: uploadedFile.url || uploadedFile.fileUrl,
      fileSize: uploadedFile.size,
      fileType: uploadedFile.type,
      attachmentType: 'file'
    };

    createAttachmentMutation.mutate(attachmentData);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlFormData.url.trim() || !urlFormData.title.trim()) return;

    const attachmentData: AttachmentFormData = {
      fileName: urlFormData.title.trim(),
      fileUrl: urlFormData.url.trim(),
      attachmentType: 'url'
    };

    createAttachmentMutation.mutate(attachmentData);
  };

  const cancelFileUpload = () => {
    setShowFileForm(false);
    setFileFormData({ title: '' });
    setUploadedFile(null);
  };

  const cancelUrlForm = () => {
    setShowUrlForm(false);
    setUrlFormData({ url: '', title: '' });
  };

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Upload File</h4>
        
        {!showFileForm ? (
          <div className="text-center">
            <FileUpload
              onUploadComplete={handleFileUpload}
              uploaderType="fileUploader"
              variant="dropzone"
            />
            <p className="text-xs text-gray-500 mt-2">
              Upload images, PDFs, documents, and other files
            </p>
          </div>
        ) : (
          <form onSubmit={handleFileSubmit} className="space-y-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center text-green-800">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                File uploaded successfully: {uploadedFile?.name}
              </div>
            </div>
            
            <div>
              <label htmlFor="file-title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                id="file-title"
                type="text"
                value={fileFormData.title}
                onChange={(e) => setFileFormData({ ...fileFormData, title: e.target.value })}
                placeholder="Enter a title for this file"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createAttachmentMutation.isPending || !fileFormData.title.trim()}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {createAttachmentMutation.isPending ? 'Saving...' : 'Save File'}
              </button>
              <button
                type="button"
                onClick={cancelFileUpload}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* URL Upload Section */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">Add URL Link</h4>
          {!showUrlForm && (
            <button
              onClick={() => setShowUrlForm(true)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add URL
            </button>
          )}
        </div>
        
        {showUrlForm && (
          <form onSubmit={handleUrlSubmit} className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                URL *
              </label>
              <input
                id="url"
                type="url"
                value={urlFormData.url}
                onChange={(e) => setUrlFormData({ ...urlFormData, url: e.target.value })}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="url-title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                id="url-title"
                type="text"
                value={urlFormData.title}
                onChange={(e) => setUrlFormData({ ...urlFormData, title: e.target.value })}
                placeholder="Enter a title for this link"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createAttachmentMutation.isPending || !urlFormData.url.trim() || !urlFormData.title.trim()}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {createAttachmentMutation.isPending ? 'Saving...' : 'Save URL'}
              </button>
              <button
                type="button"
                onClick={cancelUrlForm}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {createAttachmentMutation.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-800 text-sm">
            Error: {createAttachmentMutation.error.message}
          </p>
        </div>
      )}
    </div>
  );
};

export default AttachmentUpload;