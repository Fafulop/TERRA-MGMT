import axios, { AxiosInstance } from 'axios';
import { Contact, ContactFormData, ContactFilters, ContactsResponse, ContactsSummary } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export class ContactsService {
  public api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/contacts`,
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

  // Get all contacts with filtering and pagination
  getContacts = async (filters?: ContactFilters & { limit?: number; offset?: number }): Promise<ContactsResponse> => {
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

  // Get a single contact with attachments
  getContact = async (id: number): Promise<Contact> => {
    const response = await this.api.get(`/${id}`);
    return response.data;
  }

  // Create a new contact
  createContact = async (data: ContactFormData): Promise<Contact> => {
    const response = await this.api.post('/', data);
    return response.data;
  }

  // Update a contact
  updateContact = async (id: number, data: Partial<ContactFormData>): Promise<Contact> => {
    const response = await this.api.put(`/${id}`, data);
    return response.data;
  }

  // Delete a contact
  deleteContact = async (id: number): Promise<void> => {
    await this.api.delete(`/${id}`);
  }

  // Get contacts summary
  getSummary = async (): Promise<ContactsSummary> => {
    const response = await this.api.get('/summary');
    return response.data;
  }

  // Export contacts data (future enhancement)
  async exportContacts(format: 'csv' | 'pdf', filters?: ContactFilters): Promise<Blob> {
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
export const contactsService = new ContactsService();