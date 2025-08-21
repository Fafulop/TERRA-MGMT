import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { commentService, attachmentService } from '../services/tasks';
import { CommentFormData, AttachmentFormData } from '../types';
import FileUpload from './FileUpload';

interface CommentFormProps {
  taskId: number;
  onCommentAdded?: () => void;
}

const CommentForm = ({ taskId, onCommentAdded }: CommentFormProps) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  // Comment form data
  const [formData, setFormData] = useState<CommentFormData>({
    comment: ''
  });

  // File attachments
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [fileAttachments, setFileAttachments] = useState<{file: any, title: string}[]>([]);

  // URL attachments
  const [urlAttachments, setUrlAttachments] = useState<{url: string, title: string}[]>([]);
  const [urlForm, setUrlForm] = useState({ url: '', title: '' });

  // UI state
  const [showAttachments, setShowAttachments] = useState(false);

  const createCommentWithAttachmentsMutation = useMutation({
    mutationFn: async (data: { comment: CommentFormData, fileAttachments: any[], urlAttachments: any[] }) => {
      // First create the comment
      const comment = await commentService.createTaskComment(taskId, data.comment, token!);
      const commentId = comment.id;

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
          attachmentService.createCommentAttachment(commentId, attachmentData, token!)
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
          attachmentService.createCommentAttachment(commentId, attachmentData, token!)
        );
      }

      // Wait for all attachments to be created
      await Promise.all(attachmentPromises);

      return comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
      // Reset all form state
      setFormData({ comment: '' });
      setUploadedFiles([]);
      setFileAttachments([]);
      setUrlAttachments([]);
      setUrlForm({ url: '', title: '' });
      setShowAttachments(false);
      onCommentAdded?.();
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleFileUpload = (files: any[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
    if (!showAttachments) {
      setShowAttachments(true);
    }
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
    if (formData.comment.trim()) {
      createCommentWithAttachmentsMutation.mutate({
        comment: formData,
        fileAttachments,
        urlAttachments
      });
    }
  };

  const resetForm = () => {
    setFormData({ comment: '' });
    setUploadedFiles([]);
    setFileAttachments([]);
    setUrlAttachments([]);
    setUrlForm({ url: '', title: '', description: '' });
    setShowAttachments(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Comment Text */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            Add a follow-up comment
          </label>
          <textarea
            id="comment"
            name="comment"
            rows={3}
            required
            value={formData.comment}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
            placeholder="Share updates, ask questions, or provide additional context..."
          />
          <div className="mt-1 text-xs text-gray-500">
            Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl+Enter</kbd> to submit quickly
          </div>
        </div>

        {/* Attachments Toggle */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {formData.comment.trim().length} characters
          </div>
          <button
            type="button"
            onClick={() => setShowAttachments(!showAttachments)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a2 2 0 00-2.828-2.828z" />
            </svg>
            {showAttachments ? 'Hide Attachments' : 'Add Attachments'}
          </button>
        </div>

        {/* Attachments Section */}
        {showAttachments && (
          <div className="border-t border-gray-200 pt-4 space-y-4">
            {/* File Upload Section */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Attach Files</h4>
              
              <div className="space-y-3">
                <FileUpload
                  onUploadComplete={handleFileUpload}
                  uploaderType="fileUploader"
                  variant="dropzone"
                />

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-medium text-gray-600">Uploaded Files (Add Details):</h5>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-blue-900">📄 {file.name}</span>
                          <button
                            type="button"
                            onClick={() => addFileAttachment(file)}
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Add to Comment
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {fileAttachments.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-medium text-gray-600">File Attachments:</h5>
                    {fileAttachments.map((attachment, index) => (
                      <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-green-900">📄 {attachment.file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFileAttachment(index)}
                            className="text-red-600 hover:text-red-800 text-xs"
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
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Attach URLs</h4>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">URL</label>
                    <input
                      type="url"
                      value={urlForm.url}
                      onChange={(e) => setUrlForm({ ...urlForm, url: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={urlForm.title}
                      onChange={(e) => setUrlForm({ ...urlForm, title: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Link title"
                    />
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={addUrlAttachment}
                  disabled={!urlForm.url.trim() || !urlForm.title.trim()}
                  className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                >
                  Add URL
                </button>

                {urlAttachments.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-medium text-gray-600">URL Attachments:</h5>
                    {urlAttachments.map((attachment, index) => (
                      <div key={index} className="bg-purple-50 border border-purple-200 rounded-lg p-2 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-medium text-purple-900">🔗 {attachment.title}</div>
                          <div className="text-xs text-purple-700 truncate">{attachment.url}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeUrlAttachment(index)}
                          className="text-red-600 hover:text-red-800 text-xs ml-2"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            {(fileAttachments.length + urlAttachments.length) > 0 && (
              <span>{fileAttachments.length + urlAttachments.length} attachment(s)</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetForm}
              disabled={createCommentWithAttachmentsMutation.isPending}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={createCommentWithAttachmentsMutation.isPending || !formData.comment.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createCommentWithAttachmentsMutation.isPending ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Posting...
                </div>
              ) : (
                'Post Comment'
              )}
            </button>
          </div>
        </div>

        {createCommentWithAttachmentsMutation.error && (
          <div className="mt-2 text-red-600 text-sm">
            Error: {createCommentWithAttachmentsMutation.error.message}
          </div>
        )}
      </form>
    </div>
  );
};

export default CommentForm;