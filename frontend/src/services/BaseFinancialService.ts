import axios, { AxiosInstance } from 'axios';
import { FileAttachment } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Base interfaces
export interface BaseFinancialEntry {
  id: number;
  user_id: number;
  internal_id: string;
  amount: number;
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

export interface BaseFinancialFormData {
  amount: number;
  concept: string;
  bank_account: string;
  entry_type: 'income' | 'expense';
  transaction_date: string;
  description?: string;
  fileAttachments?: FileAttachment[];
}

export interface BaseFinancialFilters {
  entry_type?: 'income' | 'expense';
  bank_account?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}

export interface BaseFinancialEntriesResponse<T extends BaseFinancialEntry> {
  entries: T[];
  summary: any;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export abstract class BaseFinancialService<
  TEntry extends BaseFinancialEntry,
  TFormData extends BaseFinancialFormData,
  TFilters extends BaseFinancialFilters
> {
  protected api: AxiosInstance;
  protected endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Get all entries with filtering and pagination
  async getEntries(filters?: TFilters & { limit?: number; offset?: number }): Promise<BaseFinancialEntriesResponse<TEntry>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await this.api.get(`/?${params.toString()}`);
    return response.data;
  }

  // Get a single entry with attachments
  async getEntry(id: number): Promise<TEntry> {
    const response = await this.api.get(`/${id}`);
    return response.data;
  }

  // Create a new entry
  async createEntry(data: TFormData): Promise<TEntry> {
    const response = await this.api.post('/', data);
    return response.data;
  }

  // Update an entry
  async updateEntry(id: number, data: Partial<TFormData>): Promise<TEntry> {
    const response = await this.api.put(`/${id}`, data);
    return response.data;
  }

  // Delete an entry
  async deleteEntry(id: number): Promise<void> {
    await this.api.delete(`/${id}`);
  }

  // Get summary/dashboard data - to be implemented by subclasses
  abstract getSummary(startDate?: string, endDate?: string, ...args: any[]): Promise<any>;

  // Export data (future enhancement)
  async exportData(format: 'csv' | 'pdf', filters?: TFilters): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('format', format);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await this.api.get(`/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }
}