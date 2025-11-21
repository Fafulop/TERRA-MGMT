import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Pedido, CreatePedidoFormData } from '../types/ventas';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

// Get all pedidos
export const usePedidos = () => {
  return useQuery({
    queryKey: ['ventas-pedidos'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/ventas/pedidos`, {
        headers: getHeaders(),
      });
      return res.data as Pedido[];
    },
  });
};

// Get single pedido with items
export const usePedido = (id?: number) => {
  return useQuery({
    queryKey: ['ventas-pedidos', id],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/ventas/pedidos/${id}`, {
        headers: getHeaders(),
      });
      return res.data as Pedido;
    },
    enabled: !!id,
  });
};

// Create pedido from quotation
export const useCreatePedido = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePedidoFormData) => {
      const res = await axios.post(`${API_URL}/ventas/pedidos`, data, {
        headers: getHeaders(),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventas-pedidos'] });
    },
  });
};

// Update pedido status
export const useUpdatePedidoStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await axios.patch(
        `${API_URL}/ventas/pedidos/${id}/status`,
        { status },
        { headers: getHeaders() }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventas-pedidos'] });
    },
  });
};

// Delete pedido
export const useDeletePedido = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`${API_URL}/ventas/pedidos/${id}`, {
        headers: getHeaders(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventas-pedidos'] });
    },
  });
};
