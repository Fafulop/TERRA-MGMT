import axios from 'axios';
import { FileAttachment } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Cotizaciones-specific types
export interface CotizacionesEntry {
  id: number;
  user_id: number;
  internal_id: string;
  amount: number;
  currency: 'USD' | 'MXN';
  concept: string;
  bank_account: string;
  entry_type: 'income' | 'expense';
  transaction_date: string;
  description?: string;
  created_at: string;
  updated_at: string;
  attachments?: Array<{
    id: number;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
    attachmentType: 'file' | 'url';
    urlTitle?: string;
    createdAt: string;
  }>;
}

export interface CotizacionesEntryFormData {
  amount: number;
  currency: 'USD' | 'MXN';
  concept: string;
  bank_account: string;
  entry_type: 'income' | 'expense';
  transaction_date: string;
  description?: string;
  fileAttachments?: FileAttachment[];
}

export interface CotizacionesFilters {
  currency?: 'USD' | 'MXN';
  entry_type?: 'income' | 'expense';
  bank_account?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}

export interface CotizacionesSummary {
  [currency: string]: {
    totalIncome: number;
    totalExpenses: number;
    netCashFlow: number;
    totalEntries: number;
    incomeEntries: number;
    expenseEntries: number;
  };
}

// Create axios instance with base configuration
const cotizacionesApi = axios.create({
  baseURL: `${API_BASE_URL}/cotizaciones`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
cotizacionesApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
cotizacionesApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface CotizacionesEntriesResponse {
  entries: CotizacionesEntry[];
  summary: {
    [currency: string]: {
      total_income: number;
      total_expenses: number;
      net_cash_flow: number;
      total_entries: number;
    };
  };
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export const cotizacionesService = {
  // Get all cotizaciones entries with filtering and pagination
  async getCotizacionesEntries(filters?: CotizacionesFilters & { limit?: number; offset?: number }): Promise<CotizacionesEntriesResponse> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await cotizacionesApi.get(`/?${params.toString()}`);
    return response.data;
  },

  // Get a single cotizaciones entry with attachments
  async getCotizacionesEntry(id: number): Promise<CotizacionesEntry> {
    const response = await cotizacionesApi.get(`/${id}`);
    return response.data;
  },

  // Create a new cotizaciones entry
  async createCotizacionesEntry(data: CotizacionesEntryFormData): Promise<CotizacionesEntry> {
    const response = await cotizacionesApi.post('/', data);
    return response.data;
  },

  // Update a cotizaciones entry
  async updateCotizacionesEntry(id: number, data: Partial<CotizacionesEntryFormData>): Promise<CotizacionesEntry> {
    const response = await cotizacionesApi.put(`/${id}`, data);
    return response.data;
  },

  // Delete a cotizaciones entry
  async deleteCotizacionesEntry(id: number): Promise<void> {
    await cotizacionesApi.delete(`/${id}`);
  },

  // Get cotizaciones summary/dashboard data
  async getCotizacionesSummary(startDate?: string, endDate?: string, currency?: 'USD' | 'MXN'): Promise<CotizacionesSummary> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (currency) params.append('currency', currency);
    
    const response = await cotizacionesApi.get(`/summary?${params.toString()}`);
    
    // Transform the response to match our interface
    const transformedSummary: CotizacionesSummary = {};
    Object.entries(response.data).forEach(([curr, data]: [string, any]) => {
      transformedSummary[curr] = {
        totalIncome: data.total_income,
        totalExpenses: data.total_expenses,
        netCashFlow: data.net_cash_flow,
        totalEntries: data.total_entries,
        incomeEntries: data.income_entries,
        expenseEntries: data.expense_entries
      };
    });
    
    return transformedSummary;
  },

  // Export cotizaciones data (future enhancement)
  async exportCotizacionesData(format: 'csv' | 'pdf', filters?: CotizacionesFilters): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('format', format);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await cotizacionesApi.get(`/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};