import axios from 'axios';
import { LedgerEntry, LedgerEntryFormData, LedgerFilters, LedgerSummary } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with base configuration for MXN ledger
const ledgerMxnApi = axios.create({
  baseURL: `${API_BASE_URL}/ledger-mxn`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
ledgerMxnApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
ledgerMxnApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface LedgerEntriesResponse {
  entries: LedgerEntry[];
  summary: {
    total_income: number;
    total_expenses: number;
    net_cash_flow: number;
    total_entries: number;
  };
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export const ledgerMxnService = {
  // Get all MXN ledger entries with filtering and pagination
  async getLedgerEntries(filters?: LedgerFilters & { limit?: number; offset?: number }): Promise<LedgerEntriesResponse> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await ledgerMxnApi.get(`/?${params.toString()}`);
    return response.data;
  },

  // Get a single MXN ledger entry with attachments
  async getLedgerEntry(id: number): Promise<LedgerEntry> {
    const response = await ledgerMxnApi.get(`/${id}`);
    return response.data;
  },

  // Create a new MXN ledger entry
  async createLedgerEntry(data: LedgerEntryFormData): Promise<LedgerEntry> {
    const response = await ledgerMxnApi.post('/', data);
    return response.data;
  },

  // Update a MXN ledger entry
  async updateLedgerEntry(id: number, data: Partial<LedgerEntryFormData>): Promise<LedgerEntry> {
    const response = await ledgerMxnApi.put(`/${id}`, data);
    return response.data;
  },

  // Delete a MXN ledger entry
  async deleteLedgerEntry(id: number): Promise<void> {
    await ledgerMxnApi.delete(`/${id}`);
  },

  // Get MXN ledger summary/dashboard data
  async getLedgerSummary(startDate?: string, endDate?: string): Promise<LedgerSummary> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await ledgerMxnApi.get(`/summary?${params.toString()}`);
    return {
      totalIncome: response.data.total_income,
      totalExpenses: response.data.total_expenses,
      netCashFlow: response.data.net_cash_flow,
      periodStart: startDate || '',
      periodEnd: endDate || ''
    };
  },

  // Export MXN ledger data (future enhancement)
  async exportLedgerData(format: 'csv' | 'pdf', filters?: LedgerFilters): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('format', format);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await ledgerMxnApi.get(`/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};