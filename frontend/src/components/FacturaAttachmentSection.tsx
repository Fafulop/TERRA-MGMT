import React from 'react';
import FileUpload from './FileUpload';
import { UploadedFile, FacturaAttachment } from '../types';

interface FacturaAttachmentSectionProps {
  uploadedFacturas: UploadedFile[];
  facturaAttachments: FacturaAttachment[];
  onFacturaUpload: (files: UploadedFile[]) => void;
  onAddFactura: (file: UploadedFile) => void;
  onUpdateFactura: (index: number, field: string, value: string | number | undefined) => void;
  onRemoveFactura: (index: number) => void;
  showTitle?: boolean;
  compact?: boolean;
}

const FacturaAttachmentSection: React.FC<FacturaAttachmentSectionProps> = ({
  uploadedFacturas,
  facturaAttachments,
  onFacturaUpload,
  onAddFactura,
  onUpdateFactura,
  onRemoveFactura,
  showTitle = true,
  compact = false
}) => {
  const titleClass = compact ? "text-sm font-medium text-gray-700 mb-3" : "text-lg font-medium text-gray-900 mb-4";
  const inputClass = compact ?
    "w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500" :
    "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500";

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Factura Upload Section */}
      <div className={!showTitle ? "" : "border-t border-green-200 pt-6"}>
        {showTitle && (
          <div className="flex items-center mb-4">
            <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className={titleClass}>Facturas Fiscales</h3>
            <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">
              Comprobantes SAT
            </span>
          </div>
        )}

        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-green-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-green-800">
              <p className="font-medium">Facturas Fiscales (Comprobantes SAT)</p>
              <p className="mt-1">Solo archivos PDF o XML. Puede incluir metadatos fiscales como UUID, RFC, y montos.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* File Upload Component */}
          <div>
            <label className={`block ${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>
              Subir Facturas (PDF/XML)
            </label>
            <FileUpload
              uploaderType="fileUploader"
              variant="dropzone"
              onUploadComplete={onFacturaUpload}
            />
            <p className="mt-1 text-xs text-gray-500">Solo se aceptan archivos PDF y XML</p>
          </div>

          {/* Uploaded Facturas (waiting to be attached) */}
          {uploadedFacturas.length > 0 && (
            <div>
              <label className={`block ${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                Facturas Subidas Recientemente
              </label>
              <div className="space-y-2">
                {uploadedFacturas.map((file, _index) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border border-green-200 rounded-md bg-green-50">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      onClick={() => onAddFactura(file)}
                      className={`${compact ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm'} bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500`}
                    >
                      Adjuntar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Factura Attachments with Fiscal Metadata */}
          {facturaAttachments.length > 0 && (
            <div>
              <label className={`block ${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                Facturas Adjuntas
              </label>
              <div className="space-y-4">
                {facturaAttachments.map((attachment, index) => (
                  <div key={index} className="border border-green-200 rounded-md p-4 bg-green-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-900`}>
                            {attachment.file.name}
                          </span>
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded font-medium">
                            FACTURA
                          </span>
                        </div>
                        <a
                          href={attachment.file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${compact ? 'text-xs' : 'text-sm'} text-green-600 hover:text-green-800 underline`}
                        >
                          Ver Archivo
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveFactura(index)}
                        className="ml-3 text-red-600 hover:text-red-800"
                        title="Eliminar factura"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* Fiscal Metadata Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-green-200">
                      {/* Folio */}
                      <div>
                        <label className={`block ${compact ? 'text-xs' : 'text-sm'} text-gray-700 mb-1`}>
                          Folio (Número de Factura)
                        </label>
                        <input
                          type="text"
                          value={attachment.folio || ''}
                          onChange={(e) => onUpdateFactura(index, 'folio', e.target.value)}
                          className={inputClass}
                          placeholder="A1234"
                        />
                      </div>

                      {/* UUID */}
                      <div>
                        <label className={`block ${compact ? 'text-xs' : 'text-sm'} text-gray-700 mb-1`}>
                          UUID (Folio Fiscal)
                        </label>
                        <input
                          type="text"
                          value={attachment.uuid || ''}
                          onChange={(e) => onUpdateFactura(index, 'uuid', e.target.value)}
                          className={inputClass}
                          placeholder="12345678-1234-1234-1234-123456789012"
                        />
                      </div>

                      {/* RFC Emisor */}
                      <div>
                        <label className={`block ${compact ? 'text-xs' : 'text-sm'} text-gray-700 mb-1`}>
                          RFC Emisor
                        </label>
                        <input
                          type="text"
                          value={attachment.rfcEmisor || ''}
                          onChange={(e) => onUpdateFactura(index, 'rfcEmisor', e.target.value)}
                          className={inputClass}
                          placeholder="ABC123456XYZ"
                          maxLength={13}
                        />
                      </div>

                      {/* RFC Receptor */}
                      <div>
                        <label className={`block ${compact ? 'text-xs' : 'text-sm'} text-gray-700 mb-1`}>
                          RFC Receptor
                        </label>
                        <input
                          type="text"
                          value={attachment.rfcReceptor || ''}
                          onChange={(e) => onUpdateFactura(index, 'rfcReceptor', e.target.value)}
                          className={inputClass}
                          placeholder="XYZ987654ABC"
                          maxLength={13}
                        />
                      </div>

                      {/* Total */}
                      <div>
                        <label className={`block ${compact ? 'text-xs' : 'text-sm'} text-gray-700 mb-1`}>
                          Total (MXN)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={attachment.total || ''}
                          onChange={(e) => onUpdateFactura(index, 'total', e.target.value ? parseFloat(e.target.value) : undefined)}
                          className={inputClass}
                          placeholder="0.00"
                        />
                        {attachment.total && attachment.total > 0 && (
                          <p className="mt-1 text-xs text-green-600 font-medium">
                            {formatCurrency(attachment.total)}
                          </p>
                        )}
                      </div>

                      {/* Notes (full width) */}
                      <div className="md:col-span-2">
                        <label className={`block ${compact ? 'text-xs' : 'text-sm'} text-gray-700 mb-1`}>
                          Notas Adicionales
                        </label>
                        <textarea
                          value={attachment.notes || ''}
                          onChange={(e) => onUpdateFactura(index, 'notes', e.target.value)}
                          className={inputClass}
                          placeholder="Notas sobre esta factura..."
                          rows={2}
                        />
                      </div>
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

export default FacturaAttachmentSection;
