import React, { useState, useEffect } from 'react';
import { CotizacionesEntryFormData } from '../services/cotizaciones';
import { useAttachmentManager } from '../hooks/useAttachmentManager';
import FileAttachmentSection from './FileAttachmentSection';
import AreaSubareaSelector from './AreaSubareaSelector';

interface CotizacionesEntryFormProps {
  onSubmit: (data: CotizacionesEntryFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<CotizacionesEntryFormData>;
}

const CotizacionesEntryForm: React.FC<CotizacionesEntryFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
  initialData
}) => {
  const [formData, setFormData] = useState<CotizacionesEntryFormData>({
    amount: initialData?.amount || 0,
    currency: initialData?.currency || 'USD',
    concept: initialData?.concept || '',
    bank_account: initialData?.bank_account || '',
    entry_type: initialData?.entry_type || 'income',
    transaction_date: initialData?.transaction_date || new Date().toISOString().split('T')[0],
    area: initialData?.area || '',
    subarea: initialData?.subarea || '',
    description: initialData?.description || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const {
    fileAttachments,
    uploadedFiles,
    handleFileUpload,
    addFileAttachment,
    updateFileAttachment,
    removeFileAttachment
  } = useAttachmentManager();

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        amount: initialData.amount || 0,
        currency: initialData.currency || 'USD',
        concept: initialData.concept || '',
        bank_account: initialData.bank_account || '',
        entry_type: initialData.entry_type || 'income',
        transaction_date: initialData.transaction_date || new Date().toISOString().split('T')[0],
        area: initialData.area || '',
        subarea: initialData.subarea || '',
        description: initialData.description || ''
      });
    } else {
      // Reset form for create mode
      setFormData({
        amount: 0,
        currency: 'USD',
        concept: '',
        bank_account: '',
        entry_type: 'income',
        transaction_date: new Date().toISOString().split('T')[0],
        area: '',
        subarea: '',
        description: ''
      });
    }
    // Clear errors when switching modes
    setErrors({});
  }, [initialData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.concept.trim()) {
      newErrors.concept = 'Concept is required';
    }

    if (!formData.bank_account.trim()) {
      newErrors.bank_account = 'Bank account is required';
    }

    if (!formData.transaction_date) {
      newErrors.transaction_date = 'Transaction date is required';
    }

    if (!formData.area.trim()) {
      newErrors.area = 'Area is required';
    }

    if (!formData.subarea.trim()) {
      newErrors.subarea = 'Subarea is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const submissionData: CotizacionesEntryFormData = {
        ...formData,
        fileAttachments
      };
      onSubmit(submissionData);
    }
  };

  const handleChange = (field: keyof CotizacionesEntryFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleAreaChange = (areaName: string) => {
    handleChange('area', areaName);
  };

  const handleSubareaChange = (subareaName: string) => {
    handleChange('subarea', subareaName);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {initialData ? 'Edit Cotización Entry' : 'Add New Cotización Entry'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <input
              type="number"
              id="amount"
              step="0.01"
              min="0"
              value={formData.amount || ''}
              onChange={(e) => handleChange('amount', parseFloat(e.target.value))}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.amount ? 'border-red-500' : ''
              }`}
              placeholder="0.00"
              disabled={isLoading}
            />
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
          </div>

          {/* Currency Selection */}
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
              Currency *
            </label>
            <select
              id="currency"
              value={formData.currency}
              onChange={(e) => handleChange('currency', e.target.value as 'USD' | 'MXN')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            >
              <option value="USD">🇺🇸 US Dollar (USD)</option>
              <option value="MXN">🇲🇽 Mexican Peso (MXN)</option>
            </select>
          </div>

          {/* Entry Type */}
          <div>
            <label htmlFor="entry_type" className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <select
              id="entry_type"
              value={formData.entry_type}
              onChange={(e) => handleChange('entry_type', e.target.value as 'income' | 'expense')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            >
              <option value="income">💰 Income</option>
              <option value="expense">💸 Expense</option>
            </select>
          </div>

          {/* Transaction Date */}
          <div>
            <label htmlFor="transaction_date" className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Date *
            </label>
            <input
              type="date"
              id="transaction_date"
              value={formData.transaction_date}
              onChange={(e) => handleChange('transaction_date', e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.transaction_date ? 'border-red-500' : ''
              }`}
              disabled={isLoading}
            />
            {errors.transaction_date && <p className="text-red-500 text-xs mt-1">{errors.transaction_date}</p>}
          </div>
        </div>

        {/* Concept */}
        <div>
          <label htmlFor="concept" className="block text-sm font-medium text-gray-700 mb-1">
            Concept *
          </label>
          <input
            type="text"
            id="concept"
            value={formData.concept}
            onChange={(e) => handleChange('concept', e.target.value)}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.concept ? 'border-red-500' : ''
            }`}
            placeholder="Enter the concept or purpose of this transaction"
            disabled={isLoading}
          />
          {errors.concept && <p className="text-red-500 text-xs mt-1">{errors.concept}</p>}
        </div>

        {/* Area and Subarea */}
        <div>
          <AreaSubareaSelector
            selectedArea={formData.area}
            selectedSubarea={formData.subarea}
            onAreaChange={handleAreaChange}
            onSubareaChange={handleSubareaChange}
            required={true}
            showLabels={true}
            disabled={isLoading}
            areaPlaceholder="Select area..."
            subareaPlaceholder="Select subarea..."
          />
          {errors.area && <p className="text-red-500 text-xs mt-1">{errors.area}</p>}
          {errors.subarea && <p className="text-red-500 text-xs mt-1">{errors.subarea}</p>}
        </div>

        {/* Bank Account */}
        <div>
          <label htmlFor="bank_account" className="block text-sm font-medium text-gray-700 mb-1">
            Bank Account *
          </label>
          <input
            type="text"
            id="bank_account"
            value={formData.bank_account}
            onChange={(e) => handleChange('bank_account', e.target.value)}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.bank_account ? 'border-red-500' : ''
            }`}
            placeholder="Enter bank account name or identifier"
            disabled={isLoading}
          />
          {errors.bank_account && <p className="text-red-500 text-xs mt-1">{errors.bank_account}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            id="description"
            rows={3}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Add any additional details about this transaction"
            disabled={isLoading}
          />
        </div>

        {/* File Attachments */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">File Attachments</h3>
          <FileAttachmentSection
            fileAttachments={fileAttachments}
            uploadedFiles={uploadedFiles}
            onFileUpload={handleFileUpload}
            onAddFileAttachment={addFileAttachment}
            onUpdateFileAttachment={updateFileAttachment}
            onRemoveFileAttachment={removeFileAttachment}
            showTitle={false}
            compact={false}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </div>
            ) : (
              initialData ? 'Update Entry' : 'Add Entry'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CotizacionesEntryForm;