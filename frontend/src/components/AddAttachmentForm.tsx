import React, { useState } from 'react';
import FileUpload from './FileUpload';
import { UploadedFile } from '../types';
import { useCreateAttachment } from '../hooks/useAttachmentQueries';

interface AddAttachmentFormProps {
  entryId: number;
}

const AddAttachmentForm: React.FC<AddAttachmentFormProps> = ({ entryId }) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const createAttachmentMutation = useCreateAttachment();

  const handleFileUpload = (files: UploadedFile[]) => {
    setUploadedFiles(files);
  };

  const handleSubmit = async (file: UploadedFile) => {
    try {
      await createAttachmentMutation.mutateAsync({
        entryId,
        data: {
          file: {
            name: file.name,
            url: file.url,
            size: file.size,
            type: file.type,
          },
        },
      });

      // Remove the uploaded file from the list
      setUploadedFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch (error) {
      console.error('Error adding attachment:', error);
      alert('Failed to add attachment. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Files
        </label>
        <FileUpload
          uploaderType="fileUploader"
          variant="dropzone"
          onUploadComplete={handleFileUpload}
        />
        <p className="mt-1 text-xs text-gray-500">
          Supported: All file types
        </p>
      </div>

      {/* Recently Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recently Uploaded Files
          </label>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 border border-blue-200 rounded-md bg-blue-50"
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSubmit(file)}
                  disabled={createAttachmentMutation.isPending}
                  className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createAttachmentMutation.isPending ? 'Adding...' : 'Add to Entry'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadedFiles.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          Upload files above to add them to this entry
        </p>
      )}
    </div>
  );
};

export default AddAttachmentForm;
