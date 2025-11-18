import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  ItemCategory,
  ItemCategoriesResponse,
  CeramicProduct,
  CeramicEnamelColor,
  Concepto,
  ProductsResponse,
  ColorsResponse,
  CreateProductData,
  UpdateProductData
} from '../types/ceramics';

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
// MASTER DATA HOOKS - ITEM CATEGORIES
// ============================================================

export const useItemCategories = (status: string = 'active') => {
  return useQuery<ItemCategoriesResponse>({
    queryKey: ['item-categories', status],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/ceramics/item-categories?status=${status}`,
        getAuthHeaders()
      );
      return response.data;
    },
  });
};

export const useCreateItemCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await axios.post(
        `${API_URL}/ceramics/item-categories`,
        data,
        getAuthHeaders()
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-categories'] });
    },
  });
};

export const useUpdateItemCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name?: string; description?: string; status?: string } }) => {
      const response = await axios.put(
        `${API_URL}/ceramics/item-categories/${id}`,
        data,
        getAuthHeaders()
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-categories'] });
      queryClient.invalidateQueries({ queryKey: ['ceramic-products'] });
    },
  });
};

export const useDeleteItemCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await axios.delete(
        `${API_URL}/ceramics/item-categories/${id}`,
        getAuthHeaders()
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-categories'] });
    },
  });
};

// ============================================================
// MASTER DATA HOOKS - PRODUCTS
// ============================================================

export const useProducts = (status: string = 'active', concepto?: Concepto) => {
  return useQuery<ProductsResponse>({
    queryKey: ['ceramic-products', status, concepto],
    queryFn: async () => {
      let url = `${API_URL}/ceramics/products?status=${status}`;
      if (concepto) {
        url += `&concepto=${concepto}`;
      }
      const response = await axios.get(url, getAuthHeaders());
      return response.data;
    },
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductData) => {
      const response = await axios.post(
        `${API_URL}/ceramics/products`,
        data,
        getAuthHeaders()
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ceramic-products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateProductData }) => {
      const response = await axios.put(
        `${API_URL}/ceramics/products/${id}`,
        data,
        getAuthHeaders()
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ceramic-products'] });
    },
  });
};

// ============================================================
// MASTER DATA HOOKS - SIZES (DEPRECATED)
// ============================================================
// Size hooks removed - sizes are now stored in products table

// ============================================================
// MASTER DATA HOOKS - ENAMEL COLORS
// ============================================================

export const useColors = (status: string = 'active') => {
  return useQuery<ColorsResponse>({
    queryKey: ['ceramic-colors', status],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/ceramics/colors?status=${status}`,
        getAuthHeaders()
      );
      return response.data;
    },
  });
};

export const useCreateColor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      color_name: string;
      color_code?: string;
      hex_code?: string;
    }) => {
      const response = await axios.post(
        `${API_URL}/ceramics/colors`,
        data,
        getAuthHeaders()
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ceramic-colors'] });
    },
  });
};

export const useUpdateColor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { color_name?: string; color_code?: string; hex_code?: string; status?: string } }) => {
      const response = await axios.put(
        `${API_URL}/ceramics/colors/${id}`,
        data,
        getAuthHeaders()
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ceramic-colors'] });
    },
  });
};

// ============================================================
// INVENTORY & TRANSACTION HOOKS (DEPRECATED)
// ============================================================
// All inventory and transaction hooks removed - we're now using
// simple product catalog (not 3-stage inventory tracking)
