import React from 'react';
import FileUpload from './FileUpload';
import { UploadedFile, FileAttachment, UrlAttachment } from '../types';

interface AttachmentSectionProps {
  // File attachment props
  uploadedFiles: UploadedFile[];
  fileAttachments: FileAttachment[];
  onFileUpload: (files: UploadedFile[]) => void;
  onAddFileAttachment: (file: UploadedFile) => void;
  onUpdateFileAttachment: (index: number, field: string, value: string) => void;
  onRemoveFileAttachment: (index: number) => void;

  // URL attachment props
  urlAttachments: UrlAttachment[];
  urlForm: { url: string; title: string };
  onUpdateUrlForm: (field: string, value: string) => void;
  onAddUrlAttachment: () => void;
  onRemoveUrlAttachment: (index: number) => void;

  // UI props
  showTitle?: boolean;
  compact?: boolean;
}

const AttachmentSection: React.FC<AttachmentSectionProps> = ({
  uploadedFiles,
  fileAttachments,
  onFileUpload,
  onAddFileAttachment,
  onUpdateFileAttachment,
  onRemoveFileAttachment,
  urlAttachments,
  urlForm,
  onUpdateUrlForm,
  onAddUrlAttachment,
  onRemoveUrlAttachment,
  showTitle = true,
  compact = false
}) => {
  const titleClass = compact ? "text-sm font-medium text-gray-700 mb-3" : "text-lg font-medium text-gray-900 mb-4";
  const gridClass = compact ? "grid-cols-2 gap-2" : "grid-cols-1 md:grid-cols-2 gap-3";
  const inputClass = compact ? 
    "w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" :
    "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  return (
    <div className="space-y-4">
      {/* File Upload Section */}
      <div className={!showTitle ? "" : "border-t border-gray-200 pt-6"}>
        {showTitle && (
          <h3 className={titleClass}>Attach Files</h3>
        )}
        
        <div className="space-y-4">
          <FileUpload
            onUploadComplete={onFileUpload}
            uploaderType="fileUploader"
            variant="dropzone"
          />

          {uploadedFiles.length > 0 && (
            <div className="space-y-3">
              <h4 className={compact ? "text-xs font-medium text-gray-600" : "text-sm font-medium text-gray-700"}>
                Uploaded Files (Add Details):
              </h4>
              {uploadedFiles.map((file, index) => (
                <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className={compact ? "text-xs font-medium text-blue-900" : "text-sm font-medium text-blue-900"}>
                      📄 {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => onAddFileAttachment(file)}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Add to {compact ? 'Comment' : 'Task'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {fileAttachments.length > 0 && (
            <div className="space-y-3">
              <h4 className={compact ? "text-xs font-medium text-gray-600" : "text-sm font-medium text-gray-700"}>
                File Attachments:
              </h4>
              {fileAttachments.map((attachment, index) => (
                <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={compact ? "text-xs font-medium text-green-900" : "text-sm font-medium text-green-900"}>
                      📄 {attachment.file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveFileAttachment(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                  <div>
                    <label className={`block ${compact ? 'text-xs' : 'text-xs'} font-medium text-gray-700 mb-1`}>
                      Title *
                    </label>
                    <input
                      type="text"
                      value={attachment.title}
                      onChange={(e) => onUpdateFileAttachment(index, 'title', e.target.value)}
                      className={inputClass}
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
      <div className={!showTitle ? "" : "border-t border-gray-200 pt-6"}>
        {showTitle && (
          <h3 className={titleClass}>Attach URLs</h3>
        )}
        
        <div className="space-y-4">
          <div className={`grid ${gridClass}`}>
            <div>
              <label className={`block ${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-1`}>
                URL
              </label>
              <input
                type="url"
                value={urlForm.url}
                onChange={(e) => onUpdateUrlForm('url', e.target.value)}
                className={inputClass}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className={`block ${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-1`}>
                Title
              </label>
              <input
                type="text"
                value={urlForm.title}
                onChange={(e) => onUpdateUrlForm('title', e.target.value)}
                className={inputClass}
                placeholder="Link title"
              />
            </div>
          </div>
          
          <button
            type="button"
            onClick={onAddUrlAttachment}
            disabled={!urlForm.url.trim() || !urlForm.title.trim()}
            className={`${compact ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm'} bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50`}
          >
            Add URL
          </button>

          {urlAttachments.length > 0 && (
            <div className="space-y-2">
              <h4 className={compact ? "text-xs font-medium text-gray-600" : "text-sm font-medium text-gray-700"}>
                URL Attachments:
              </h4>
              {urlAttachments.map((attachment, index) => (
                <div key={index} className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className={`${compact ? 'text-xs' : 'font-medium'} text-purple-900`}>
                      🔗 {attachment.title}
                    </div>
                    <div className={`${compact ? 'text-xs' : 'text-sm'} text-purple-700 ${compact ? 'truncate' : ''}`}>
                      {attachment.url}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveUrlAttachment(index)}
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
    </div>
  );
};

export default AttachmentSection;