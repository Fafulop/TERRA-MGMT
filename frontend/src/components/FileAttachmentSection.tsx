import React from 'react';
import FileUpload from './FileUpload';
import { UploadedFile, FileAttachment } from '../types';

interface FileAttachmentSectionProps {
  uploadedFiles: UploadedFile[];
  fileAttachments: FileAttachment[];
  onFileUpload: (files: UploadedFile[]) => void;
  onAddFileAttachment: (file: UploadedFile) => void;
  onUpdateFileAttachment: (index: number, field: string, value: string) => void;
  onRemoveFileAttachment: (index: number) => void;
  showTitle?: boolean;
  compact?: boolean;
}

const FileAttachmentSection: React.FC<FileAttachmentSectionProps> = ({
  uploadedFiles,
  fileAttachments,
  onFileUpload,
  onAddFileAttachment,
  onUpdateFileAttachment,
  onRemoveFileAttachment,
  showTitle = true,
  compact = false
}) => {
  const titleClass = compact ? "text-sm font-medium text-gray-700 mb-3" : "text-lg font-medium text-gray-900 mb-4";
  const inputClass = compact ? 
    "w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" :
    "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  return (
    <div className="space-y-4">
      {/* File Upload Section */}
      <div className={!showTitle ? "" : "border-t border-gray-200 pt-6"}>
        {showTitle && (
          <h3 className={titleClass}>File Attachments</h3>
        )}
        
        <div className="space-y-4">
          {/* File Upload Component */}
          <div>
            <label className={`block ${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>
              Upload Files
            </label>
            <FileUpload 
              uploaderType="fileUploader"
              variant="dropzone"
              onUploadComplete={onFileUpload}
            />
          </div>

          {/* Uploaded Files (waiting to be attached) */}
          {uploadedFiles.length > 0 && (
            <div>
              <label className={`block ${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                Recently Uploaded Files
              </label>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-blue-50">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-900`}>{file.name}</p>
                        <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-500`}>
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onAddFileAttachment(file)}
                      className={`${compact ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm'} bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      Attach
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File Attachments */}
          {fileAttachments.length > 0 && (
            <div>
              <label className={`block ${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                Attached Files
              </label>
              <div className="space-y-3">
                {fileAttachments.map((attachment, index) => (
                  <div key={index} className="border border-gray-200 rounded-md p-3 bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a2 2 0 00-2.828-2.828z" />
                          </svg>
                          <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-900`}>
                            {attachment.file.name}
                          </span>
                          <span className={`${compact ? 'text-xs' : 'text-sm'} text-gray-500`}>
                            ({(attachment.file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <div>
                          <label className={`block ${compact ? 'text-xs' : 'text-sm'} text-gray-700 mb-1`}>
                            File Description
                          </label>
                          <input
                            type="text"
                            value={attachment.title}
                            onChange={(e) => onUpdateFileAttachment(index, 'title', e.target.value)}
                            className={inputClass}
                            placeholder="Enter file description..."
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <a
                            href={attachment.file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${compact ? 'text-xs' : 'text-sm'} text-blue-600 hover:text-blue-800 underline`}
                          >
                            View File
                          </a>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveFileAttachment(index)}
                        className="ml-3 text-red-600 hover:text-red-800"
                        title="Remove attachment"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileAttachmentSection;