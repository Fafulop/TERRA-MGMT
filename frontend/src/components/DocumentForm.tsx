import React, { useState } from 'react';
import { DocumentFormData, Document } from '../types';

interface DocumentFormProps {
  onSubmit: (data: DocumentFormData) => void;
  onCancel: () => void;
  initialData?: Document;
  isLoading?: boolean;
}

const DocumentForm: React.FC<DocumentFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<DocumentFormData>({
    document_name: initialData?.document_name || '',
    area: initialData?.area || '',
    subarea: initialData?.subarea || '',
    description: initialData?.description || '',
    document_type: initialData?.document_type || '',
    version: initialData?.version || '1.0',
    status: initialData?.status || 'active',
    tags: initialData?.tags || [],
    fileAttachments: []
  });

  const [tagInput, setTagInput] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // For demo purposes, we'll create mock file URLs
    // In a real application, you would upload these files to your storage service first
    const newAttachments = Array.from(files).map((file, index) => ({
      file: {
        id: `${Date.now()}-${index}`,
        name: file.name,
        url: `https://demo-storage.example.com/files/${Date.now()}-${file.name}`,
        fileUrl: `https://demo-storage.example.com/files/${Date.now()}-${file.name}`,
        size: file.size,
        type: file.type,
        uploadedBy: undefined
      },
      title: file.name
    }));

    setFormData(prev => ({
      ...prev,
      fileAttachments: [...prev.fileAttachments, ...newAttachments]
    }));

    // Clear the input so the same file can be selected again
    event.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fileAttachments: prev.fileAttachments.filter((_, i) => i !== index)
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required file attachments
    if (formData.fileAttachments.length === 0) {
      alert('Please upload at least one file attachment before submitting.');
      return;
    }
    
    const submitData: DocumentFormData = {
      ...formData,
      fileAttachments: formData.fileAttachments
    };
    
    onSubmit(submitData);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {initialData ? 'Edit Document' : 'Add New Document'}
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Priority Fields */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Priority Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document Name *
              </label>
              <input
                type="text"
                name="document_name"
                value={formData.document_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Document name (required)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area *
              </label>
              <input
                type="text"
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Document area (required)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subarea *
              </label>
              <input
                type="text"
                name="subarea"
                value={formData.subarea}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Document subarea (required)"
              />
            </div>
          </div>
        </div>

        {/* File Attachments Section */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">File Attachments *</h4>
          <div className="border-2 border-dashed border-red-300 rounded-lg p-6">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Upload document files
                  </span>
                  <span className="mt-1 block text-sm text-gray-500">
                    At least one file is required. PNG, JPG, PDF, DOC, XLS up to 10MB
                  </span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    multiple
                    className="sr-only"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
                  />
                  <span className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                    Choose Files
                  </span>
                </label>
              </div>
            </div>
          </div>
          
          {/* Display selected files */}
          {formData.fileAttachments.length > 0 && (
            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-900 mb-2">Selected Files:</h5>
              <div className="space-y-2">
                {formData.fileAttachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="text-sm text-gray-900">{attachment.file.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({Math.round(attachment.file.size / 1024)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {formData.fileAttachments.length === 0 && (
            <div className="mt-2 text-sm text-red-600">
              At least one file attachment is required to create a document.
            </div>
          )}
        </div>

        {/* Document Details */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Document Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document Type
              </label>
              <input
                type="text"
                name="document_type"
                value={formData.document_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="e.g., PDF, DOC, XLS"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Version
              </label>
              <input
                type="text"
                name="version"
                value={formData.version}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="1.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder="Document description..."
          />
        </div>

        {/* Tags */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Tags</h4>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
              >
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 bg-teal-100 text-teal-800 text-sm rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-teal-600 hover:text-teal-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || formData.fileAttachments.length === 0}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : initialData ? 'Update Document' : 'Create Document'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentForm;