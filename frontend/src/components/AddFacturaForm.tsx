import React, { useState } from 'react';
import FileUpload from './FileUpload';
import { UploadedFile } from '../types';
import { useCreateFactura } from '../hooks/useFacturaQueries';

interface AddFacturaFormProps {
  entryId: number;
}

const AddFacturaForm: React.FC<AddFacturaFormProps> = ({ entryId }) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [facturaData, setFacturaData] = useState<{
    folio?: string;
    uuid?: string;
    rfcEmisor?: string;
    rfcReceptor?: string;
    total?: number;
    notes?: string;
  }>({});

  const createFacturaMutation = useCreateFactura();

  const handleFileUpload = (files: UploadedFile[]) => {
    // Validate file types (only PDF and XML allowed for facturas)
    const validTypes = ['application/pdf', 'text/xml', 'application/xml'];
    const validFiles = files.filter((file) => {
      if (!file.type) return true; // Allow if type is not specified
      return validTypes.includes(file.type);
    });

    if (validFiles.length !== files.length) {
      const invalidCount = files.length - validFiles.length;
      alert(`${invalidCount} file(s) rejected. Only PDF and XML files are allowed for facturas.`);
    }

    setUploadedFiles(validFiles);
  };

  const handleSubmit = async (file: UploadedFile) => {
    try {
      await createFacturaMutation.mutateAsync({
        entryId,
        data: {
          file: {
            name: file.name,
            url: file.url,
            size: file.size,
            type: file.type,
          },
          folio: facturaData.folio,
          uuid: facturaData.uuid,
          rfcEmisor: facturaData.rfcEmisor,
          rfcReceptor: facturaData.rfcReceptor,
          total: facturaData.total,
          notes: facturaData.notes,
        },
      });

      // Remove the uploaded file from the list and reset form
      setUploadedFiles((prev) => prev.filter((f) => f.id !== file.id));
      setFacturaData({});
    } catch (error) {
      console.error('Error adding factura:', error);
      alert('Failed to add factura. Please try again.');
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Information Banner */}
      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-green-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-green-800">
            <p className="font-medium">Facturas Fiscales (Comprobantes SAT)</p>
            <p className="mt-1">Only PDF or XML files. Add fiscal metadata for better tracking.</p>
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Factura (PDF/XML)
        </label>
        <FileUpload
          uploaderType="fileUploader"
          variant="dropzone"
          onUploadComplete={handleFileUpload}
        />
        <p className="mt-1 text-xs text-gray-500">
          Only PDF and XML files are accepted
        </p>
      </div>

      {/* Recently Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recently Uploaded Facturas
          </label>

          {/* Fiscal Metadata Form */}
          <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-md space-y-3">
            <p className="text-xs font-medium text-gray-700">Fiscal Metadata (Optional)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-700 mb-1">Folio</label>
                <input
                  type="text"
                  value={facturaData.folio || ''}
                  onChange={(e) => setFacturaData({ ...facturaData, folio: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  placeholder="A1234"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">UUID</label>
                <input
                  type="text"
                  value={facturaData.uuid || ''}
                  onChange={(e) => setFacturaData({ ...facturaData, uuid: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  placeholder="12345678-1234-1234..."
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">RFC Emisor</label>
                <input
                  type="text"
                  value={facturaData.rfcEmisor || ''}
                  onChange={(e) => setFacturaData({ ...facturaData, rfcEmisor: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  placeholder="ABC123456XYZ"
                  maxLength={13}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">RFC Receptor</label>
                <input
                  type="text"
                  value={facturaData.rfcReceptor || ''}
                  onChange={(e) => setFacturaData({ ...facturaData, rfcReceptor: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  placeholder="XYZ987654ABC"
                  maxLength={13}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">Total (MXN)</label>
                <input
                  type="number"
                  step="0.01"
                  value={facturaData.total || ''}
                  onChange={(e) =>
                    setFacturaData({
                      ...facturaData,
                      total: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
                {facturaData.total && facturaData.total > 0 && (
                  <p className="mt-1 text-xs text-green-600 font-medium">
                    {formatCurrency(facturaData.total)}
                  </p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-700 mb-1">Notes</label>
                <textarea
                  value={facturaData.notes || ''}
                  onChange={(e) => setFacturaData({ ...facturaData, notes: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  rows={2}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          </div>

          {/* File List */}
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 border border-green-200 rounded-md bg-green-50"
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  disabled={createFacturaMutation.isPending}
                  className="px-3 py-1.5 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createFacturaMutation.isPending ? 'Adding...' : 'Add Factura'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadedFiles.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          Upload a PDF or XML factura above to add it to this entry
        </p>
      )}
    </div>
  );
};

export default AddFacturaForm;
