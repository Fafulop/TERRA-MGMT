import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

// Types
export interface KitItem {
  id?: number;
  kit_id?: number;
  product_id: number;
  product_name?: string;
  tipo_name?: string;
  size_cm?: number;
  capacity_ml?: number;
  esmalte_color_id?: number | null;
  esmalte_color?: string;
  esmalte_hex_code?: string;
  quantity: number;
}

export interface Kit {
  id: number;
  name: string;
  description?: string;
  sku?: string;
  price: number;
  min_stock: number;
  max_stock: number;
  current_stock: number;
  is_active: boolean;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  items_count?: number;
  total_products?: number;
  items?: KitItem[];
  allocations?: any[];
}

export interface KitFormData {
  name: string;
  description?: string;
  sku?: string;
  price: number;
  min_stock: number;
  max_stock: number;
  is_active: boolean;
  items: KitItem[];
}

export interface AvailableInventory {
  id: number;
  product_id: number;
  product_name: string;
  tipo_name?: string;
  size_cm?: number;
  capacity_ml?: number;
  esmalte_color_id?: number;
  esmalte_color?: string;
  esmalte_hex_code?: string;
  quantity: number;
  apartados: number;
  disponibles: number;
}

// Get all kits
export const useKits = () => {
  return useQuery({
    queryKey: ['ecommerce-kits'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/ecommerce/kits`, {
        headers: getHeaders(),
      });
      return res.data as Kit[];
    },
  });
};

// Get single kit with items
export const useKit = (kitId?: number) => {
  return useQuery({
    queryKey: ['ecommerce-kit', kitId],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/ecommerce/kits/${kitId}`, {
        headers: getHeaders(),
      });
      return res.data as Kit;
    },
    enabled: !!kitId,
  });
};

// Get available inventory for kit creation
export const useAvailableInventoryForKits = () => {
  return useQuery({
    queryKey: ['available-inventory-for-kits'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/ecommerce/kits/inventory/available`, {
        headers: getHeaders(),
      });
      return res.data as AvailableInventory[];
    },
  });
};

// Create kit
export const useCreateKit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: KitFormData) => {
      const res = await axios.post(`${API_URL}/ecommerce/kits`, data, {
        headers: getHeaders(),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecommerce-kits'] });
    },
  });
};

// Update kit
export const useUpdateKit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: KitFormData }) => {
      const res = await axios.put(`${API_URL}/ecommerce/kits/${id}`, data, {
        headers: getHeaders(),
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ecommerce-kits'] });
      queryClient.invalidateQueries({ queryKey: ['ecommerce-kit', variables.id] });
    },
  });
};

// Delete kit
export const useDeleteKit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await axios.delete(`${API_URL}/ecommerce/kits/${id}`, {
        headers: getHeaders(),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecommerce-kits'] });
    },
  });
};

// Adjust kit stock
export const useAdjustKitStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, adjustment, notes }: { id: number; adjustment: number; notes?: string }) => {
      const res = await axios.post(
        `${API_URL}/ecommerce/kits/${id}/stock`,
        { adjustment, notes },
        { headers: getHeaders() }
      );
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ecommerce-kits'] });
      queryClient.invalidateQueries({ queryKey: ['ecommerce-kit', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['produccion-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['available-inventory-for-kits'] });
    },
  });
};
