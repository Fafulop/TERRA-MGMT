import axios, { AxiosInstance } from 'axios';
import { Document, DocumentFormData, DocumentFilters, DocumentsResponse, DocumentsSummary } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export class DocumentsService {
  public api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/documents`,
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

  // Get all documents with filtering and pagination
  getDocuments = async (filters?: DocumentFilters & { limit?: number; offset?: number }): Promise<DocumentsResponse> => {
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

  // Get a single document with attachments
  getDocument = async (id: number): Promise<Document> => {
    const response = await this.api.get(`/${id}`);
    return response.data;
  }

  // Create a new document
  createDocument = async (data: DocumentFormData): Promise<Document> => {
    const response = await this.api.post('/', data);
    return response.data;
  }

  // Update a document
  updateDocument = async (id: number, data: Partial<DocumentFormData>): Promise<Document> => {
    const response = await this.api.put(`/${id}`, data);
    return response.data;
  }

  // Delete a document
  deleteDocument = async (id: number): Promise<void> => {
    await this.api.delete(`/${id}`);
  }

  // Get documents summary
  getSummary = async (): Promise<DocumentsSummary> => {
    const response = await this.api.get('/summary');
    return response.data;
  }

  // Export documents data (future enhancement)
  async exportDocuments(format: 'csv' | 'pdf', filters?: DocumentFilters): Promise<Blob> {
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

// Create and export a singleton instance
export const documentsService = new DocumentsService();