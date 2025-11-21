import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export interface InventoryAvailabilityItem {
  pedido_item_id: number;
  product_id: number;
  product_name: string;
  tipo_name: string;
  esmalte_color_id?: number;
  esmalte_color?: string;
  esmalte_hex_code?: string;
  quantity_needed: number;
  quantity_allocated: number;
  inventory_items: InventoryItemDetail[];
  total_cant: number;
  total_apartados: number;
  total_disponibles: number;
  still_needed: number;
  shortfall: number;
}

export interface InventoryItemDetail {
  inventory_id: number;
  product_id: number;
  cant: number;
  apartados: number;
  disponibles: number;
  costo_unitario: number;
  etapa: string;
  product_name: string;
  tipo_name: string;
  esmalte_color?: string;
  esmalte_hex_code?: string;
}

export interface AllocationRequest {
  pedido_id: number;
  pedido_item_id: number;
  inventory_id: number;
  quantity: number;
}

export interface Allocation {
  id: number;
  pedido_id: number;
  pedido_item_id: number;
  inventory_id: number;
  quantity_allocated: number;
  allocated_at: string;
  allocated_by: number;
  product_name: string;
  tipo_name: string;
  esmalte_color?: string;
  inventory_cant: number;
  inventory_apartados: number;
  allocated_by_name: string;
}

// Get inventory availability for a pedido
export const usePedidoInventoryAvailability = (pedido_id?: number) => {
  return useQuery({
    queryKey: ['pedido-inventory', pedido_id],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/ventas/pedidos/${pedido_id}/inventory`, {
        headers: getHeaders(),
      });
      return res.data as InventoryAvailabilityItem[];
    },
    enabled: !!pedido_id,
  });
};

// Get allocations for a pedido
export const usePedidoAllocations = (pedido_id?: number) => {
  return useQuery({
    queryKey: ['pedido-allocations', pedido_id],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/ventas/pedidos/${pedido_id}/allocations`, {
        headers: getHeaders(),
      });
      return res.data as Allocation[];
    },
    enabled: !!pedido_id,
  });
};

// Allocate inventory to pedido item
export const useAllocateInventory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AllocationRequest) => {
      const res = await axios.post(`${API_URL}/ventas/pedidos/allocations`, data, {
        headers: getHeaders(),
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['pedido-inventory', variables.pedido_id] });
      queryClient.invalidateQueries({ queryKey: ['pedido-allocations', variables.pedido_id] });
      queryClient.invalidateQueries({ queryKey: ['produccion-inventory'] });
    },
  });
};

// Deallocate inventory
export const useDeallocateInventory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (allocation_id: number) => {
      const res = await axios.delete(`${API_URL}/ventas/pedidos/allocations/${allocation_id}`, {
        headers: getHeaders(),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedido-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['pedido-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['produccion-inventory'] });
    },
  });
};
