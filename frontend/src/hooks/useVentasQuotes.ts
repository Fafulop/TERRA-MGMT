import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Quote, QuoteFormData, QuoteFilters, QuoteSummary } from '../types/ventas';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

// ========================================
// Fetch Quotes List
// ========================================
export const useQuotes = (filters?: QuoteFilters) => {
  return useQuery({
    queryKey: ['ventas-quotes', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.customer_id) params.append('customer_id', filters.customer_id.toString());
      if (filters?.currency) params.append('currency', filters.currency);
      if (filters?.from_date) params.append('from_date', filters.from_date);
      if (filters?.to_date) params.append('to_date', filters.to_date);

      const res = await axios.get(`${API_URL}/ventas/quotes?${params}`, {
        headers: getHeaders(),
      });
      return res.data as Quote[];
    },
  });
};

// ========================================
// Fetch Single Quote
// ========================================
export const useQuote = (id: number | string | undefined) => {
  return useQuery({
    queryKey: ['ventas-quote', id],
    queryFn: async () => {
      if (!id) throw new Error('Quote ID is required');
      const res = await axios.get(`${API_URL}/ventas/quotes/${id}`, {
        headers: getHeaders(),
      });
      return res.data as Quote;
    },
    enabled: !!id,
  });
};

// ========================================
// Fetch Quotes Summary
// ========================================
export const useQuotesSummary = () => {
  return useQuery({
    queryKey: ['ventas-quotes-summary'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/ventas/quotes/summary`, {
        headers: getHeaders(),
      });
      return res.data as QuoteSummary[];
    },
  });
};

// ========================================
// Create Quote
// ========================================
export const useCreateQuote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: QuoteFormData) => {
      const res = await axios.post(`${API_URL}/ventas/quotes`, data, {
        headers: getHeaders(),
      });
      return res.data as Quote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventas-quotes'] });
      queryClient.invalidateQueries({ queryKey: ['ventas-quotes-summary'] });
    },
    onError: (error: any) => {
      console.error('Error creating quote:', error);
      const message = error.response?.data?.error || 'Failed to create quote';
      alert(message);
    },
  });
};

// ========================================
// Update Quote
// ========================================
export const useUpdateQuote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: QuoteFormData }) => {
      const res = await axios.put(`${API_URL}/ventas/quotes/${id}`, data, {
        headers: getHeaders(),
      });
      return res.data as Quote;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ventas-quotes'] });
      queryClient.invalidateQueries({ queryKey: ['ventas-quote', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['ventas-quotes-summary'] });
    },
    onError: (error: any) => {
      console.error('Error updating quote:', error);
      const message = error.response?.data?.error || 'Failed to update quote';
      alert(message);
    },
  });
};

// ========================================
// Update Quote Status
// ========================================
export const useUpdateQuoteStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await axios.put(
        `${API_URL}/ventas/quotes/${id}/status`,
        { status },
        { headers: getHeaders() }
      );
      return res.data as Quote;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ventas-quotes'] });
      queryClient.invalidateQueries({ queryKey: ['ventas-quote', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['ventas-quotes-summary'] });
    },
    onError: (error: any) => {
      console.error('Error updating quote status:', error);
      const message = error.response?.data?.error || 'Failed to update quote status';
      alert(message);
    },
  });
};

// ========================================
// Delete Quote
// ========================================
export const useDeleteQuote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await axios.delete(`${API_URL}/ventas/quotes/${id}`, {
        headers: getHeaders(),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventas-quotes'] });
      queryClient.invalidateQueries({ queryKey: ['ventas-quotes-summary'] });
    },
    onError: (error: any) => {
      console.error('Error deleting quote:', error);
      const message = error.response?.data?.error || 'Failed to delete quote';
      alert(message);
    },
  });
};
