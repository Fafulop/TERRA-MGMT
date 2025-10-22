import React, { useState } from 'react';
import { useAttachments } from '../hooks/useAttachmentQueries';
import { useFacturas } from '../hooks/useFacturaQueries';
import ExistingAttachmentsList from './ExistingAttachmentsList';
import ExistingFacturasList from './ExistingFacturasList';
import AddAttachmentForm from './AddAttachmentForm';
import AddFacturaForm from './AddFacturaForm';

interface AttachmentManagerModalProps {
  entryId: number;
  entryInternalId: string;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'attachments' | 'facturas';

const AttachmentManagerModal: React.FC<AttachmentManagerModalProps> = ({
  entryId,
  entryInternalId,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('attachments');

  // Fetch attachments and facturas
  const { data: attachments, isLoading: attachmentsLoading } = useAttachments(entryId);
  const { data: facturas, isLoading: facturasLoading } = useFacturas(entryId);

  if (!isOpen) return null;

  const attachmentCount = attachments?.length || 0;
  const facturaCount = facturas?.length || 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Manage Attachments
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Entry: {entryInternalId}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 bg-white">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('attachments')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'attachments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a2 2 0 00-2.828-2.828z" />
                  </svg>
                  <span>File Attachments</span>
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {attachmentCount}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('facturas')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'facturas'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Facturas Fiscales</span>
                  <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {facturaCount}
                  </span>
                </div>
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {activeTab === 'attachments' && (
              <div className="space-y-6">
                {/* Existing Attachments */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Existing File Attachments
                  </h3>
                  {attachmentsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Loading attachments...</p>
                    </div>
                  ) : (
                    <ExistingAttachmentsList
                      attachments={attachments || []}
                      entryId={entryId}
                    />
                  )}
                </div>

                {/* Add New Attachment */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Add New Attachment
                  </h3>
                  <AddAttachmentForm entryId={entryId} />
                </div>
              </div>
            )}

            {activeTab === 'facturas' && (
              <div className="space-y-6">
                {/* Existing Facturas */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <span>Existing Facturas</span>
                    <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">
                      Comprobantes SAT
                    </span>
                  </h3>
                  {facturasLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Loading facturas...</p>
                    </div>
                  ) : (
                    <ExistingFacturasList
                      facturas={facturas || []}
                      entryId={entryId}
                    />
                  )}
                </div>

                {/* Add New Factura */}
                <div className="border-t border-green-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Add New Factura
                  </h3>
                  <AddFacturaForm entryId={entryId} />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttachmentManagerModal;
