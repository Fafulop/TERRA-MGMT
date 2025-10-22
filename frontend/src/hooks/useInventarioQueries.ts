import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  InventarioItem,
  InventarioItemFormData,
  ItemFilters,
  ItemsResponse,
  InventarioCount,
  CountFormData,
  BatchCountData,
  CountFilters,
  CountsResponse,
  CountSession,
  CountSessionFormData,
  SessionFilters,
  SessionsResponse,
  SessionDetailResponse,
  CurrentInventoryResponse,
  ItemHistoryResponse,
  CountsByDateResponse
} from '../types/inventario';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// ============================================================
// ITEMS CATALOG HOOKS
// ============================================================

export const useItems = (filters: ItemFilters = {}) => {
  return useQuery<ItemsResponse>({
    queryKey: ['inventario-items', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await axios.get(
        `${API_URL}/inventario/items?${params.toString()}`,
        getAuthHeaders()
      );
      return response.data;
    },
  });
};

export const useItem = (id: number | null) => {
  return useQuery<InventarioItem>({
    queryKey: ['inventario-items', id],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/inventario/items/${id}`,
        getAuthHeaders()
      );
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InventarioItemFormData) => {
      const response = await axios.post(
        `${API_URL}/inventario/items`,
        data,
        getAuthHeaders()
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-current'] });
    },
  });
};

export const useUpdateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InventarioItemFormData> }) => {
      const response = await axios.put(
        `${API_URL}/inventario/items/${id}`,
        data,
        getAuthHeaders()
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-current'] });
    },
  });
};

export const useDeleteItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await axios.delete(
        `${API_URL}/inventario/items/${id}`,
        getAuthHeaders()
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-current'] });
    },
  });
};

export const usePermanentlyDeleteItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await axios.delete(
        `${API_URL}/inventario/items/${id}/permanent`,
        getAuthHeaders()
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-current'] });
    },
    onError: (error: any) => {
      console.error('Error deleting item:', error);
    },
  });
};

export const useItemHistory = (id: number | null) => {
  return useQuery<ItemHistoryResponse>({
    queryKey: ['inventario-items', id, 'history'],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/inventario/items/${id}/history`,
        getAuthHeaders()
      );
      return response.data;
    },
    enabled: !!id,
  });
};

// ============================================================
// INVENTORY COUNTS HOOKS
// ============================================================

export const useCurrentInventory = () => {
  return useQuery<CurrentInventoryResponse>({
    queryKey: ['inventario-current'],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/inventario/current`,
        getAuthHeaders()
      );
      return response.data;
    },
  });
};

export const useCounts = (filters: CountFilters = {}) => {
  return useQuery<CountsResponse>({
    queryKey: ['inventario-counts', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await axios.get(
        `${API_URL}/inventario/counts?${params.toString()}`,
        getAuthHeaders()
      );
      return response.data;
    },
  });
};

export const useCreateCount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CountFormData) => {
      const response = await axios.post(
        `${API_URL}/inventario/counts`,
        data,
        getAuthHeaders()
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario-counts'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-current'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-items'] });
    },
  });
};

export const useCreateBatchCounts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BatchCountData) => {
      const response = await axios.post(
        `${API_URL}/inventario/counts/batch`,
        data,
        getAuthHeaders()
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario-counts'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-current'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-sessions'] });
    },
  });
};

export const useUpdateCount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CountFormData> }) => {
      const response = await axios.put(
        `${API_URL}/inventario/counts/${id}`,
        data,
        getAuthHeaders()
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario-counts'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-current'] });
    },
  });
};

export const useDeleteCount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await axios.delete(
        `${API_URL}/inventario/counts/${id}`,
        getAuthHeaders()
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario-counts'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-current'] });
    },
  });
};

export const useCountsByDate = () => {
  return useQuery<CountsByDateResponse>({
    queryKey: ['inventario-counts', 'by-date'],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/inventario/counts/by-date`,
        getAuthHeaders()
      );
      return response.data;
    },
  });
};

export const useCountsForDate = (date: string | null) => {
  return useQuery({
    queryKey: ['inventario-counts', 'for-date', date],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/inventario/counts/for-date?date=${date}`,
        getAuthHeaders()
      );
      return response.data;
    },
    enabled: !!date,
  });
};

// ============================================================
// COUNT SESSIONS HOOKS
// ============================================================

export const useCountSessions = (filters: SessionFilters = {}) => {
  return useQuery<SessionsResponse>({
    queryKey: ['inventario-sessions', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await axios.get(
        `${API_URL}/inventario/sessions?${params.toString()}`,
        getAuthHeaders()
      );
      return response.data;
    },
  });
};

export const useCountSession = (id: number | null) => {
  return useQuery<SessionDetailResponse>({
    queryKey: ['inventario-sessions', id],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/inventario/sessions/${id}`,
        getAuthHeaders()
      );
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateCountSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CountSessionFormData) => {
      const response = await axios.post(
        `${API_URL}/inventario/sessions`,
        data,
        getAuthHeaders()
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario-sessions'] });
    },
  });
};

export const useUpdateCountSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CountSessionFormData> & { status?: string } }) => {
      const response = await axios.put(
        `${API_URL}/inventario/sessions/${id}`,
        data,
        getAuthHeaders()
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario-sessions'] });
    },
  });
};

export const useCompleteCountSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await axios.post(
        `${API_URL}/inventario/sessions/${id}/complete`,
        {},
        getAuthHeaders()
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario-sessions'] });
    },
  });
};

export const useDeleteCountSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await axios.delete(
        `${API_URL}/inventario/sessions/${id}`,
        getAuthHeaders()
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-counts'] });
    },
  });
};
