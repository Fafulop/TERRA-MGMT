import axios from 'axios';
import { LedgerAttachment } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with base configuration for attachments
const attachmentsApi = axios.create({
  baseURL: `${API_BASE_URL}/ledger-mxn`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
attachmentsApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
attachmentsApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface AttachmentFormData {
  file: {
    name: string;
    url: string;
    size?: number;
    type?: string;
  };
  title?: string;
}

export const ledgerAttachmentsService = {
  // Get all attachments for a specific ledger entry
  async getAttachments(entryId: number): Promise<LedgerAttachment[]> {
    const response = await attachmentsApi.get(`/${entryId}/attachments`);
    return response.data;
  },

  // Create a new attachment for a ledger entry (post-creation)
  async createAttachment(entryId: number, data: AttachmentFormData): Promise<LedgerAttachment> {
    const response = await attachmentsApi.post(`/${entryId}/attachments`, data);
    return response.data;
  },

  // Delete an attachment
  async deleteAttachment(attachmentId: number): Promise<void> {
    await attachmentsApi.delete(`/attachments/${attachmentId}`);
  },
};
