import React, { useState, useEffect } from 'react';
import { LedgerEntry, LedgerEntryFormData } from '../types';
import AreaSubareaSelector from './AreaSubareaSelector';

interface LedgerEntryEditModalProps {
  entry: LedgerEntry;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, data: Partial<LedgerEntryFormData>) => void;
  isLoading?: boolean;
}

const LedgerEntryEditModal: React.FC<LedgerEntryEditModalProps> = ({
  entry,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    amount: entry.amount,
    concept: entry.concept,
    bankAccount: entry.bankAccount,
    bankMovementId: entry.bankMovementId || '',
    entryType: entry.entryType,
    date: entry.date.split('T')[0],
    area: entry.area,
    subarea: entry.subarea,
    por_realizar: entry.por_realizar || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form when entry changes
  useEffect(() => {
    setFormData({
      amount: entry.amount,
      concept: entry.concept,
      bankAccount: entry.bankAccount,
      bankMovementId: entry.bankMovementId || '',
      entryType: entry.entryType,
      date: entry.date.split('T')[0],
      area: entry.area,
      subarea: entry.subarea,
      por_realizar: entry.por_realizar || false,
    });
  }, [entry]);

  const bankAccounts = ['BANK', 'EFECTIVO'];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'amount' ? parseFloat(value) || 0 : value)
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAreaChange = (areaName: string) => {
    setFormData(prev => ({ ...prev, area: areaName }));
    if (errors.area) {
      setErrors(prev => ({ ...prev, area: '' }));
    }
  };

  const handleSubareaChange = (subareaName: string) => {
    setFormData(prev => ({ ...prev, subarea: subareaName }));
    if (errors.subarea) {
      setErrors(prev => ({ ...prev, subarea: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.concept.trim()) {
      newErrors.concept = 'Concept is required';
    }

    if (!formData.bankAccount) {
      newErrors.bankAccount = 'Método de pago es requerido';
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
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

    if (!validateForm()) {
      return;
    }

    onSubmit(entry.id, formData);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Edit Ledger Entry</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Entry Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entry Type *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="entryType"
                      value="income"
                      checked={formData.entryType === 'income'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Money In (Income)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="entryType"
                      value="expense"
                      checked={formData.entryType === 'expense'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Money Out (Expense)</span>
                  </label>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (MXN) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    step="0.01"
                    min="0"
                    value={formData.amount || ''}
                    onChange={handleInputChange}
                    className={`block w-full pl-8 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.amount ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                </div>
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
                {formData.amount > 0 && (
                  <p className={`mt-1 text-sm ${formData.entryType === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {formData.entryType === 'income' ? '+' : '-'}{formatAmount(formData.amount)}
                  </p>
                )}
              </div>

              {/* Concept */}
              <div>
                <label htmlFor="concept" className="block text-sm font-medium text-gray-700 mb-2">
                  Concept/Description *
                </label>
                <textarea
                  id="concept"
                  name="concept"
                  rows={3}
                  value={formData.concept}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.concept ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter transaction description..."
                />
                {errors.concept && (
                  <p className="mt-1 text-sm text-red-600">{errors.concept}</p>
                )}
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
                {errors.area && (
                  <p className="mt-1 text-sm text-red-600">{errors.area}</p>
                )}
                {errors.subarea && (
                  <p className="mt-1 text-sm text-red-600">{errors.subarea}</p>
                )}
              </div>

              {/* Bank Account */}
              <div>
                <label htmlFor="bankAccount" className="block text-sm font-medium text-gray-700 mb-2">
                  MÉTODO DE PAGO *
                </label>
                <select
                  id="bankAccount"
                  name="bankAccount"
                  value={formData.bankAccount}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.bankAccount ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar método de pago...</option>
                  {bankAccounts.map((account) => (
                    <option key={account} value={account}>
                      {account}
                    </option>
                  ))}
                </select>
                {errors.bankAccount && (
                  <p className="mt-1 text-sm text-red-600">{errors.bankAccount}</p>
                )}
              </div>

              {/* Date */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                )}
              </div>

              {/* Por Realizar */}
              <div>
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="por_realizar"
                      name="por_realizar"
                      type="checkbox"
                      checked={formData.por_realizar}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="por_realizar" className="text-sm font-medium text-gray-700">
                      Por Realizar (Future Transaction)
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Check this box if this is a future transaction that hasn't happened yet.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bank Movement ID */}
              <div>
                <label htmlFor="bankMovementId" className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Movement ID (Optional)
                </label>
                <input
                  type="text"
                  id="bankMovementId"
                  name="bankMovementId"
                  value={formData.bankMovementId}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Reference ID from bank statement"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? 'Saving...' : 'Update Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LedgerEntryEditModal;
