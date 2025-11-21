import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

// Types
export interface PedidoItem {
  id?: number;
  pedido_id?: number;
  kit_id: number;
  kit_name?: string;
  kit_sku?: string;
  quantity: number;
  unit_price: number;
  subtotal?: number;
  kit_current_stock?: number;
}

export interface EcommercePedido {
  id: number;
  pedido_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  payment_status: 'PENDING' | 'PAID' | 'REFUNDED';
  payment_method?: string;
  order_date: string;
  shipped_date?: string;
  delivered_date?: string;
  notes?: string;
  tracking_number?: string;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  items_count?: number;
  total_kits?: number;
  items?: PedidoItem[];
}

export interface PedidoFormData {
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  shipping_cost?: number;
  discount?: number;
  payment_method?: string;
  notes?: string;
  items: { kit_id: number; quantity: number; unit_price: number }[];
}

// Get all pedidos
export const useEcommercePedidos = () => {
  return useQuery({
    queryKey: ['ecommerce-pedidos'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/ecommerce/pedidos`, {
        headers: getHeaders(),
      });
      return res.data as EcommercePedido[];
    },
  });
};

// Get single pedido with items
export const useEcommercePedido = (pedidoId?: number) => {
  return useQuery({
    queryKey: ['ecommerce-pedido', pedidoId],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/ecommerce/pedidos/${pedidoId}`, {
        headers: getHeaders(),
      });
      return res.data as EcommercePedido;
    },
    enabled: !!pedidoId,
  });
};

// Create pedido
export const useCreateEcommercePedido = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PedidoFormData) => {
      const res = await axios.post(`${API_URL}/ecommerce/pedidos`, data, {
        headers: getHeaders(),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecommerce-pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['ecommerce-kits'] });
    },
  });
};

// Update pedido
export const useUpdateEcommercePedido = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<EcommercePedido> }) => {
      const res = await axios.put(`${API_URL}/ecommerce/pedidos/${id}`, data, {
        headers: getHeaders(),
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ecommerce-pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['ecommerce-pedido', variables.id] });
    },
  });
};

// Update pedido status
export const useUpdateEcommercePedidoStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await axios.patch(
        `${API_URL}/ecommerce/pedidos/${id}/status`,
        { status },
        { headers: getHeaders() }
      );
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ecommerce-pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['ecommerce-pedido', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['ecommerce-kits'] });
    },
  });
};

// Delete pedido
export const useDeleteEcommercePedido = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await axios.delete(`${API_URL}/ecommerce/pedidos/${id}`, {
        headers: getHeaders(),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecommerce-pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['ecommerce-kits'] });
    },
  });
};
