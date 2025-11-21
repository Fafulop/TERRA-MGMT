import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

// Types
export interface AvailablePayment {
  id: number;
  amount: number;
  concept: string;
  transaction_date: string;
  internal_id: string;
  bank_account: string;
  bank_movement_id?: string;
  area: string;
  subarea: string;
  created_at: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface AttachedPayment {
  attachment_id: number;
  attached_at: string;
  attachment_notes?: string;
  ledger_entry_id: number;
  amount: number;
  concept: string;
  transaction_date: string;
  internal_id: string;
  bank_account: string;
  bank_movement_id?: string;
  created_at: string;
  attached_by_username?: string;
  attached_by_first_name?: string;
  attached_by_last_name?: string;
  created_by_username?: string;
  created_by_first_name?: string;
  created_by_last_name?: string;
}

export interface PedidoPaymentsResponse {
  payments: AttachedPayment[];
  totalPaid: number;
  paymentCount: number;
}

export interface PaymentSummary {
  id: number;
  total: number;
  amount_paid: number;
  payment_status: string;
  amount_remaining: number;
  payment_count: number;
}

export interface AttachPaymentRequest {
  pedido_id: number;
  ledger_entry_id: number;
  notes?: string;
}

// Get available payments (VENTAS ECOMMERCE movements not attached to any pedido)
export const useEcommerceAvailablePayments = () => {
  return useQuery({
    queryKey: ['ecommerce-available-payments'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/ecommerce/pedidos/available`, {
        headers: getHeaders(),
      });
      return res.data as AvailablePayment[];
    },
  });
};

// Get payments attached to a specific ecommerce pedido
export const useEcommercePedidoPayments = (pedidoId?: number) => {
  return useQuery({
    queryKey: ['ecommerce-pedido-payments', pedidoId],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/ecommerce/pedidos/${pedidoId}/payments`, {
        headers: getHeaders(),
      });
      return res.data as PedidoPaymentsResponse;
    },
    enabled: !!pedidoId,
  });
};

// Get payment summary for an ecommerce pedido
export const useEcommercePedidoPaymentSummary = (pedidoId?: number) => {
  return useQuery({
    queryKey: ['ecommerce-pedido-payment-summary', pedidoId],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/ecommerce/pedidos/${pedidoId}/payments/summary`, {
        headers: getHeaders(),
      });
      return res.data as PaymentSummary;
    },
    enabled: !!pedidoId,
  });
};

// Attach a payment to an ecommerce pedido
export const useAttachEcommercePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AttachPaymentRequest) => {
      const res = await axios.post(
        `${API_URL}/ecommerce/pedidos/${data.pedido_id}/payments`,
        data,
        { headers: getHeaders() }
      );
      return res.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['ecommerce-pedido-payments', variables.pedido_id] });
      queryClient.invalidateQueries({ queryKey: ['ecommerce-pedido-payment-summary', variables.pedido_id] });
      queryClient.invalidateQueries({ queryKey: ['ecommerce-available-payments'] });
      queryClient.invalidateQueries({ queryKey: ['ecommerce-pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['ecommerce-pedido', variables.pedido_id] });
    },
  });
};

// Detach a payment from an ecommerce pedido
export const useDetachEcommercePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ attachmentId, pedidoId }: { attachmentId: number; pedidoId: number }) => {
      const res = await axios.delete(
        `${API_URL}/ecommerce/pedidos/payments/${attachmentId}`,
        { headers: getHeaders() }
      );
      return res.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['ecommerce-pedido-payments', variables.pedidoId] });
      queryClient.invalidateQueries({ queryKey: ['ecommerce-pedido-payment-summary', variables.pedidoId] });
      queryClient.invalidateQueries({ queryKey: ['ecommerce-available-payments'] });
      queryClient.invalidateQueries({ queryKey: ['ecommerce-pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['ecommerce-pedido', variables.pedidoId] });
    },
  });
};
