import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Quotation, QuotationFormData } from '../types/ventas';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

// Get all quotations
export const useQuotations = () => {
  return useQuery({
    queryKey: ['ventas-quotations'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/ventas/quotations`, {
        headers: getHeaders(),
      });
      return res.data as Quotation[];
    },
  });
};

// Get single quotation
export const useQuotation = (id: number | undefined) => {
  return useQuery({
    queryKey: ['ventas-quotation', id],
    queryFn: async () => {
      if (!id) throw new Error('Quotation ID is required');
      const res = await axios.get(`${API_URL}/ventas/quotations/${id}`, {
        headers: getHeaders(),
      });
      return res.data as Quotation;
    },
    enabled: !!id,
  });
};

// Create quotation
export const useCreateQuotation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: QuotationFormData) => {
      const res = await axios.post(`${API_URL}/ventas/quotations`, data, {
        headers: getHeaders(),
      });
      return res.data as Quotation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventas-quotations'] });
    },
    onError: (error: any) => {
      console.error('Error creating quotation:', error);
      alert(error.response?.data?.error || 'Failed to create quotation');
    },
  });
};

// Update quotation
export const useUpdateQuotation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: QuotationFormData }) => {
      const res = await axios.put(`${API_URL}/ventas/quotations/${id}`, data, {
        headers: getHeaders(),
      });
      return res.data as Quotation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ventas-quotations'] });
      queryClient.invalidateQueries({ queryKey: ['ventas-quotation', variables.id] });
    },
    onError: (error: any) => {
      console.error('Error updating quotation:', error);
      alert(error.response?.data?.error || 'Failed to update quotation');
    },
  });
};

// Delete quotation
export const useDeleteQuotation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`${API_URL}/ventas/quotations/${id}`, {
        headers: getHeaders(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventas-quotations'] });
    },
    onError: (error: any) => {
      console.error('Error deleting quotation:', error);
      alert(error.response?.data?.error || 'Failed to delete quotation');
    },
  });
};
