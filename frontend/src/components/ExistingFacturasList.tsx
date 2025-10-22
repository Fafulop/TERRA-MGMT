import React, { useState } from 'react';
import { Factura } from '../types';
import { useDeleteFactura, useUpdateFactura } from '../hooks/useFacturaQueries';

interface ExistingFacturasListProps {
  facturas: Factura[];
  entryId: number;
}

const ExistingFacturasList: React.FC<ExistingFacturasListProps> = ({
  facturas,
  entryId,
}) => {
  const deleteFacturaMutation = useDeleteFactura();
  const updateFacturaMutation = useUpdateFactura();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Factura>>({});

  const handleDelete = (facturaId: number, fileName: string) => {
    if (window.confirm(`Are you sure you want to delete factura "${fileName}"?`)) {
      deleteFacturaMutation.mutate({ facturaId, entryId });
    }
  };

  const handleEdit = (factura: Factura) => {
    setEditingId(factura.id);
    setEditData({
      folio: factura.folio,
      uuid: factura.uuid,
      rfcEmisor: factura.rfcEmisor,
      rfcReceptor: factura.rfcReceptor,
      total: factura.total,
      notes: factura.notes,
    });
  };

  const handleSave = (facturaId: number) => {
    updateFacturaMutation.mutate(
      { facturaId, data: editData },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditData({});
        },
      }
    );
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(2)} KB`;
  };

  if (facturas.length === 0) {
    return (
      <div className="text-center py-8 bg-green-50 rounded-lg border-2 border-dashed border-green-300">
        <svg className="w-12 h-12 text-green-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-green-700 font-medium">No facturas yet</p>
        <p className="text-sm text-green-600 mt-1">Add fiscal invoices using the form below</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {facturas.map((factura) => {
        const isEditing = editingId === factura.id;

        return (
          <div
            key={factura.id}
            className="bg-white border-2 border-green-200 rounded-lg p-5 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3 flex-1">
                {/* Factura Icon */}
                <div className="flex-shrink-0">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>

                {/* Factura Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {factura.fileName}
                    </h4>
                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded font-medium">
                      FACTURA FISCAL
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatFileSize(factura.fileSize)}
                  </p>
                  {factura.uploadedBy && (
                    <p className="text-xs text-gray-400 mt-1">
                      Uploaded by{' '}
                      <span className="font-medium">
                        {factura.uploadedBy.firstName && factura.uploadedBy.lastName
                          ? `${factura.uploadedBy.firstName} ${factura.uploadedBy.lastName}`
                          : factura.uploadedBy.username}
                      </span>
                      {' '}on {formatDate(factura.createdAt)}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 ml-4">
                {!isEditing && (
                  <>
                    <a
                      href={factura.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
                    >
                      View
                    </a>
                    <button
                      onClick={() => handleEdit(factura)}
                      className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(factura.id, factura.fileName)}
                      disabled={deleteFacturaMutation.isPending}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      {deleteFacturaMutation.isPending ? 'Deleting...' : 'Delete'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Fiscal Metadata */}
            {isEditing ? (
              <div className="mt-4 pt-4 border-t border-green-200 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Folio</label>
                    <input
                      type="text"
                      value={editData.folio || ''}
                      onChange={(e) => setEditData({ ...editData, folio: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                      placeholder="A1234"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">UUID</label>
                    <input
                      type="text"
                      value={editData.uuid || ''}
                      onChange={(e) => setEditData({ ...editData, uuid: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                      placeholder="12345678-1234..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">RFC Emisor</label>
                    <input
                      type="text"
                      value={editData.rfcEmisor || ''}
                      onChange={(e) => setEditData({ ...editData, rfcEmisor: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                      placeholder="ABC123456XYZ"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">RFC Receptor</label>
                    <input
                      type="text"
                      value={editData.rfcReceptor || ''}
                      onChange={(e) => setEditData({ ...editData, rfcReceptor: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                      placeholder="XYZ987654ABC"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Total (MXN)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editData.total || ''}
                      onChange={(e) => setEditData({ ...editData, total: parseFloat(e.target.value) || undefined })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={editData.notes || ''}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                    rows={2}
                    placeholder="Additional notes..."
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSave(factura.id)}
                    disabled={updateFacturaMutation.isPending}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {updateFacturaMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-green-200 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                {factura.folio && (
                  <div>
                    <span className="text-gray-500 text-xs">Folio:</span>
                    <p className="font-medium text-gray-900">{factura.folio}</p>
                  </div>
                )}
                {factura.uuid && (
                  <div className="md:col-span-2">
                    <span className="text-gray-500 text-xs">UUID:</span>
                    <p className="font-mono text-xs text-gray-900 truncate">{factura.uuid}</p>
                  </div>
                )}
                {factura.rfcEmisor && (
                  <div>
                    <span className="text-gray-500 text-xs">RFC Emisor:</span>
                    <p className="font-medium text-gray-900">{factura.rfcEmisor}</p>
                  </div>
                )}
                {factura.rfcReceptor && (
                  <div>
                    <span className="text-gray-500 text-xs">RFC Receptor:</span>
                    <p className="font-medium text-gray-900">{factura.rfcReceptor}</p>
                  </div>
                )}
                {factura.total && (
                  <div>
                    <span className="text-gray-500 text-xs">Total:</span>
                    <p className="font-semibold text-green-700">{formatCurrency(factura.total)}</p>
                  </div>
                )}
                {factura.notes && (
                  <div className="col-span-2 md:col-span-3">
                    <span className="text-gray-500 text-xs">Notes:</span>
                    <p className="text-gray-700 text-sm">{factura.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ExistingFacturasList;
