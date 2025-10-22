import axios from 'axios';
import { Factura, FacturaFormData } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with base configuration for facturas
const facturasApi = axios.create({
  baseURL: `${API_BASE_URL}/ledger-mxn`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
facturasApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
facturasApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const ledgerFacturasService = {
  // Get all facturas for a specific ledger entry
  async getFacturas(entryId: number): Promise<Factura[]> {
    const response = await facturasApi.get(`/${entryId}/facturas`);
    return response.data;
  },

  // Create a new factura for a ledger entry
  async createFactura(entryId: number, data: FacturaFormData): Promise<Factura> {
    const response = await facturasApi.post(`/${entryId}/facturas`, data);
    return response.data;
  },

  // Update a factura (fiscal metadata only, not the file)
  async updateFactura(facturaId: number, data: Partial<FacturaFormData>): Promise<Factura> {
    const response = await facturasApi.put(`/facturas/${facturaId}`, data);
    return response.data;
  },

  // Delete a factura
  async deleteFactura(facturaId: number): Promise<void> {
    await facturasApi.delete(`/facturas/${facturaId}`);
  },
};
