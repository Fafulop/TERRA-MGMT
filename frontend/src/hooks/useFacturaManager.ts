import { useState, useCallback } from 'react';
import { UploadedFile, FacturaAttachment } from '../types';

export const useFacturaManager = () => {
  // Factura attachments state
  const [uploadedFacturas, setUploadedFacturas] = useState<UploadedFile[]>([]);
  const [facturaAttachments, setFacturaAttachments] = useState<FacturaAttachment[]>([]);

  // Factura upload handler
  const handleFacturaUpload = useCallback((files: UploadedFile[]) => {
    // Validate file types (only PDF and XML allowed for facturas)
    const validTypes = ['application/pdf', 'text/xml', 'application/xml'];
    const validFiles = files.filter(file => {
      if (!file.type) return true; // Allow if type is not specified
      return validTypes.includes(file.type);
    });

    if (validFiles.length !== files.length) {
      const invalidCount = files.length - validFiles.length;
      alert(`${invalidCount} file(s) rejected. Only PDF and XML files are allowed for facturas.`);
    }

    setUploadedFacturas(prev => [...prev, ...validFiles]);
  }, []);

  // Add a factura attachment from uploaded files
  const addFacturaAttachment = useCallback((file: UploadedFile) => {
    setFacturaAttachments(prev => [...prev, {
      file,
      folio: '',
      uuid: '',
      rfcEmisor: '',
      rfcReceptor: '',
      total: undefined,
      notes: ''
    }]);
    setUploadedFacturas(prev => prev.filter(f => f !== file));
  }, []);

  // Update a factura attachment field
  const updateFacturaAttachment = useCallback((index: number, field: string, value: string | number | undefined) => {
    setFacturaAttachments(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  }, []);

  // Remove a factura attachment
  const removeFacturaAttachment = useCallback((index: number) => {
    setFacturaAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Reset all facturas
  const resetFacturas = useCallback(() => {
    setUploadedFacturas([]);
    setFacturaAttachments([]);
  }, []);

  // Check if there are any factura attachments
  const hasFacturas = facturaAttachments.length > 0;

  return {
    // State
    uploadedFacturas,
    facturaAttachments,
    hasFacturas,

    // Methods
    handleFacturaUpload,
    addFacturaAttachment,
    updateFacturaAttachment,
    removeFacturaAttachment,
    resetFacturas
  };
};
