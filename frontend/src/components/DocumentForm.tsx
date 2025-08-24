import React, { useState } from 'react';
import { DocumentFormData, Document } from '../types';
import AreaSubareaSelector from './AreaSubareaSelector';
import { useAttachmentManager } from '../hooks/useAttachmentManager';
import FileAttachmentSection from './FileAttachmentSection';

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

  // Use attachment manager for UploadThing integration
  const {
    fileAttachments,
    uploadedFiles,
    handleFileUpload,
    addFileAttachment,
    updateFileAttachment,
    removeFileAttachment
  } = useAttachmentManager();

  // File upload is now handled by useAttachmentManager hook

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAreaChange = (areaName: string) => {
    setFormData(prev => ({ ...prev, area: areaName }));
  };

  const handleSubareaChange = (subareaName: string) => {
    setFormData(prev => ({ ...prev, subarea: subareaName }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required file attachments
    if (fileAttachments.length === 0) {
      alert('Please upload at least one file attachment before submitting.');
      return;
    }
    
    const submitData: DocumentFormData = {
      ...formData,
      fileAttachments: fileAttachments
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
          <div className="space-y-4">
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

            <AreaSubareaSelector
              selectedArea={formData.area}
              selectedSubarea={formData.subarea}
              onAreaChange={handleAreaChange}
              onSubareaChange={handleSubareaChange}
              required={true}
              showLabels={true}
              disabled={isLoading}
              areaPlaceholder="Select document area..."
              subareaPlaceholder="Select document subarea..."
            />
          </div>
        </div>

        {/* File Attachments Section */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Document Files *</h4>
          <p className="text-sm text-gray-600 mb-4">Upload document files (PDF, DOC, XLS, images). At least one file is required.</p>
          <FileAttachmentSection
            fileAttachments={fileAttachments}
            uploadedFiles={uploadedFiles}
            onFileUpload={handleFileUpload}
            onAddFileAttachment={addFileAttachment}
            onUpdateFileAttachment={updateFileAttachment}
            onRemoveFileAttachment={removeFileAttachment}
            showTitle={false}
            compact={false}
          />
          {fileAttachments.length === 0 && (
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
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags?.map((tag, index) => (
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
            disabled={isLoading || fileAttachments.length === 0}
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