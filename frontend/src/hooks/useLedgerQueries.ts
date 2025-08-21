import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ledgerService } from '../services/ledger';
import { LedgerEntry, LedgerEntryFormData, LedgerFilters } from '../types';

// Query keys for consistent cache management
export const ledgerKeys = {
  all: ['ledger'] as const,
  entries: () => [...ledgerKeys.all, 'entries'] as const,
  entry: (id: number) => [...ledgerKeys.all, 'entry', id] as const,
  summary: () => [...ledgerKeys.all, 'summary'] as const,
  filtered: (filters: LedgerFilters) => [...ledgerKeys.entries(), 'filtered', filters] as const,
};

// Hook to get ledger entries with filtering
export const useLedgerEntries = (filters?: LedgerFilters & { limit?: number; offset?: number }) => {
  return useQuery({
    queryKey: ledgerKeys.filtered(filters || {}),
    queryFn: () => ledgerService.getLedgerEntries(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

// Hook to get a single ledger entry
export const useLedgerEntry = (id: number) => {
  return useQuery({
    queryKey: ledgerKeys.entry(id),
    queryFn: () => ledgerService.getLedgerEntry(id),
    enabled: !!id && id > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
};

// Hook to get ledger summary
export const useLedgerSummary = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: [...ledgerKeys.summary(), startDate, endDate],
    queryFn: () => ledgerService.getLedgerSummary(startDate, endDate),
    staleTime: 1000 * 60 * 3, // 3 minutes
    retry: 2,
  });
};

// Hook to create a new ledger entry
export const useCreateLedgerEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LedgerEntryFormData) => ledgerService.createLedgerEntry(data),
    onSuccess: (newEntry) => {
      // Invalidate and refetch ledger entries
      queryClient.invalidateQueries({ queryKey: ledgerKeys.entries() });
      queryClient.invalidateQueries({ queryKey: ledgerKeys.summary() });
      
      // Add the new entry to existing queries (optimistic update)
      queryClient.setQueriesData(
        { queryKey: ledgerKeys.entries() },
        (oldData: any) => {
          if (oldData?.entries) {
            return {
              ...oldData,
              entries: [newEntry, ...oldData.entries],
            };
          }
          return oldData;
        }
      );
    },
    onError: (error) => {
      console.error('Error creating ledger entry:', error);
    },
  });
};

// Hook to update a ledger entry
export const useUpdateLedgerEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<LedgerEntryFormData> }) =>
      ledgerService.updateLedgerEntry(id, data),
    onSuccess: (updatedEntry, { id }) => {
      // Update the specific entry in cache
      queryClient.setQueryData(ledgerKeys.entry(id), updatedEntry);
      
      // Invalidate entries list to refetch
      queryClient.invalidateQueries({ queryKey: ledgerKeys.entries() });
      queryClient.invalidateQueries({ queryKey: ledgerKeys.summary() });
    },
    onError: (error) => {
      console.error('Error updating ledger entry:', error);
    },
  });
};

// Hook to delete a ledger entry
export const useDeleteLedgerEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => ledgerService.deleteLedgerEntry(id),
    onSuccess: (_, deletedId) => {
      // Remove the entry from cache
      queryClient.removeQueries({ queryKey: ledgerKeys.entry(deletedId) });
      
      // Update entries list by removing the deleted entry
      queryClient.setQueriesData(
        { queryKey: ledgerKeys.entries() },
        (oldData: any) => {
          if (oldData?.entries) {
            return {
              ...oldData,
              entries: oldData.entries.filter((entry: LedgerEntry) => entry.id !== deletedId),
            };
          }
          return oldData;
        }
      );
      
      // Invalidate summary to refetch
      queryClient.invalidateQueries({ queryKey: ledgerKeys.summary() });
    },
    onError: (error) => {
      console.error('Error deleting ledger entry:', error);
    },
  });
};

// Hook for prefetching ledger data
export const useLedgerPrefetching = () => {
  const queryClient = useQueryClient();

  const prefetchLedgerEntries = (filters?: LedgerFilters) => {
    queryClient.prefetchQuery({
      queryKey: ledgerKeys.filtered(filters || {}),
      queryFn: () => ledgerService.getLedgerEntries(filters),
      staleTime: 1000 * 60 * 2,
    });
  };

  const prefetchLedgerEntry = (id: number) => {
    queryClient.prefetchQuery({
      queryKey: ledgerKeys.entry(id),
      queryFn: () => ledgerService.getLedgerEntry(id),
      staleTime: 1000 * 60 * 5,
    });
  };

  const prefetchLedgerSummary = (startDate?: string, endDate?: string) => {
    queryClient.prefetchQuery({
      queryKey: [...ledgerKeys.summary(), startDate, endDate],
      queryFn: () => ledgerService.getLedgerSummary(startDate, endDate),
      staleTime: 1000 * 60 * 3,
    });
  };

  return {
    prefetchLedgerEntries,
    prefetchLedgerEntry,
    prefetchLedgerSummary,
  };
};