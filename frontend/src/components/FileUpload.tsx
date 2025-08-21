import { useState } from 'react';
import { UploadButton, UploadDropzone } from '../utils/uploadthing';

interface FileUploadProps {
  onUploadComplete?: (files: any[]) => void;
  uploaderType?: 'imageUploader' | 'pdfUploader' | 'fileUploader';
  variant?: 'button' | 'dropzone';
}

export default function FileUpload({ 
  onUploadComplete, 
  uploaderType = 'imageUploader',
  variant = 'button' 
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadBegin = () => {
    setIsUploading(true);
  };

  const handleUploadComplete = (res: any) => {
    setIsUploading(false);
    console.log('Files uploaded:', res);
    if (onUploadComplete) {
      onUploadComplete(res);
    }
  };

  const handleUploadError = (error: Error) => {
    setIsUploading(false);
    console.error('Upload error:', error);
    
    // More user-friendly error messages
    let errorMessage = 'Upload failed. Please try again.';
    if (error.message.includes('token') || error.message.includes('auth')) {
      errorMessage = 'Authentication error. Please log in and try again.';
    } else if (error.message.includes('size')) {
      errorMessage = 'File is too large. Please choose a smaller file.';
    } else if (error.message.includes('type')) {
      errorMessage = 'File type not supported. Please choose a different file.';
    }
    
    alert(errorMessage);
  };

  // Get auth token from localStorage
  const getToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
    }
    return token;
  };

  if (variant === 'dropzone') {
    return (
      <div className="w-full">
        <UploadDropzone
          endpoint={uploaderType}
          onClientUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          onUploadBegin={handleUploadBegin}
          config={{
            mode: "auto",
          }}
          headers={{
            authorization: `Bearer ${getToken()}`,
          }}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
        />
        {isUploading && (
          <div className="mt-2 text-sm text-blue-600">
            Uploading files...
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start">
      <UploadButton
        endpoint={uploaderType}
        onClientUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
        onUploadBegin={handleUploadBegin}
        config={{
          mode: "auto",
        }}
        headers={{
          authorization: `Bearer ${getToken()}`,
        }}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
      />
      {isUploading && (
        <div className="mt-2 text-sm text-blue-600">
          Uploading files...
        </div>
      )}
    </div>
  );
}