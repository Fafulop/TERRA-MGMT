import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ledgerFacturasService } from '../services/ledgerFacturas';
import { Factura, FacturaFormData } from '../types';

// Query keys for consistent cache management
export const facturaKeys = {
  all: ['facturas'] as const,
  forEntry: (entryId: number) => [...facturaKeys.all, 'entry', entryId] as const,
};

// Hook to get all facturas for a specific ledger entry
export const useFacturas = (entryId: number) => {
  return useQuery({
    queryKey: facturaKeys.forEntry(entryId),
    queryFn: () => ledgerFacturasService.getFacturas(entryId),
    enabled: !!entryId && entryId > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
};

// Hook to create a new factura
export const useCreateFactura = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId, data }: { entryId: number; data: FacturaFormData }) =>
      ledgerFacturasService.createFactura(entryId, data),
    onSuccess: (newFactura, { entryId }) => {
      // Invalidate facturas for this entry
      queryClient.invalidateQueries({ queryKey: facturaKeys.forEntry(entryId) });

      // Invalidate ledger entries to update factura count
      queryClient.invalidateQueries({ queryKey: ['ledgerMxn', 'entries'] });
    },
    onError: (error) => {
      console.error('Error creating factura:', error);
    },
  });
};

// Hook to update a factura
export const useUpdateFactura = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ facturaId, data }: { facturaId: number; data: Partial<FacturaFormData> }) =>
      ledgerFacturasService.updateFactura(facturaId, data),
    onSuccess: (updatedFactura) => {
      // Invalidate facturas for the entry this factura belongs to
      queryClient.invalidateQueries({ queryKey: facturaKeys.forEntry(updatedFactura.ledgerEntryId) });

      // Invalidate ledger entries
      queryClient.invalidateQueries({ queryKey: ['ledgerMxn', 'entries'] });
    },
    onError: (error) => {
      console.error('Error updating factura:', error);
    },
  });
};

// Hook to delete a factura
export const useDeleteFactura = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ facturaId, entryId }: { facturaId: number; entryId: number }) =>
      ledgerFacturasService.deleteFactura(facturaId),
    onSuccess: (_, { entryId }) => {
      // Invalidate facturas for this entry
      queryClient.invalidateQueries({ queryKey: facturaKeys.forEntry(entryId) });

      // Invalidate ledger entries to update factura count
      queryClient.invalidateQueries({ queryKey: ['ledgerMxn', 'entries'] });
    },
    onError: (error) => {
      console.error('Error deleting factura:', error);
    },
  });
};

// Hook for prefetching facturas
export const useFacturaPrefetching = () => {
  const queryClient = useQueryClient();

  const prefetchFacturas = (entryId: number) => {
    queryClient.prefetchQuery({
      queryKey: facturaKeys.forEntry(entryId),
      queryFn: () => ledgerFacturasService.getFacturas(entryId),
      staleTime: 1000 * 60 * 5,
    });
  };

  return {
    prefetchFacturas,
  };
};
