import { useState, useCallback } from 'react';
import { UploadedFile, FileAttachment, UrlAttachment, AttachmentData } from '../types';

export const useAttachmentManager = () => {
  // File attachments state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [fileAttachments, setFileAttachments] = useState<FileAttachment[]>([]);

  // URL attachments state
  const [urlAttachments, setUrlAttachments] = useState<UrlAttachment[]>([]);
  const [urlForm, setUrlForm] = useState({ url: '', title: '' });

  // File attachment methods
  const handleFileUpload = useCallback((files: UploadedFile[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
  }, []);

  const addFileAttachment = useCallback((file: UploadedFile) => {
    setFileAttachments(prev => [...prev, { file, title: file.name || 'Uploaded File' }]);
    setUploadedFiles(prev => prev.filter(f => f !== file));
  }, []);

  const updateFileAttachment = useCallback((index: number, field: string, value: string) => {
    setFileAttachments(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  }, []);

  const removeFileAttachment = useCallback((index: number) => {
    setFileAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  // URL attachment methods
  const addUrlAttachment = useCallback(() => {
    if (urlForm.url.trim() && urlForm.title.trim()) {
      setUrlAttachments(prev => [...prev, { ...urlForm }]);
      setUrlForm({ url: '', title: '' });
    }
  }, [urlForm]);

  const removeUrlAttachment = useCallback((index: number) => {
    setUrlAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateUrlForm = useCallback((field: string, value: string) => {
    setUrlForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // Reset all attachments
  const resetAttachments = useCallback(() => {
    setUploadedFiles([]);
    setFileAttachments([]);
    setUrlAttachments([]);
    setUrlForm({ url: '', title: '' });
  }, []);

  // Get attachment data for API calls
  const getAttachmentData = useCallback((): AttachmentData => ({
    fileAttachments,
    urlAttachments
  }), [fileAttachments, urlAttachments]);

  // Check if there are any attachments
  const hasAttachments = fileAttachments.length + urlAttachments.length > 0;

  return {
    // State
    uploadedFiles,
    fileAttachments,
    urlAttachments,
    urlForm,
    hasAttachments,

    // File methods
    handleFileUpload,
    addFileAttachment,
    updateFileAttachment,
    removeFileAttachment,

    // URL methods
    addUrlAttachment,
    removeUrlAttachment,
    updateUrlForm,

    // Utility methods
    resetAttachments,
    getAttachmentData
  };
};