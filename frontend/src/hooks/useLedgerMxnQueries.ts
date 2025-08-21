import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ledgerMxnService } from '../services/ledgerMxn';
import { LedgerEntry, LedgerEntryFormData, LedgerFilters } from '../types';

// Query keys for consistent cache management (MXN)
export const ledgerMxnKeys = {
  all: ['ledgerMxn'] as const,
  entries: () => [...ledgerMxnKeys.all, 'entries'] as const,
  entry: (id: number) => [...ledgerMxnKeys.all, 'entry', id] as const,
  summary: () => [...ledgerMxnKeys.all, 'summary'] as const,
  filtered: (filters: LedgerFilters) => [...ledgerMxnKeys.entries(), 'filtered', filters] as const,
};

// Hook to get MXN ledger entries with filtering
export const useLedgerMxnEntries = (filters?: LedgerFilters & { limit?: number; offset?: number }) => {
  return useQuery({
    queryKey: ledgerMxnKeys.filtered(filters || {}),
    queryFn: () => ledgerMxnService.getLedgerEntries(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

// Hook to get a single MXN ledger entry
export const useLedgerMxnEntry = (id: number) => {
  return useQuery({
    queryKey: ledgerMxnKeys.entry(id),
    queryFn: () => ledgerMxnService.getLedgerEntry(id),
    enabled: !!id && id > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
};

// Hook to get MXN ledger summary
export const useLedgerMxnSummary = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: [...ledgerMxnKeys.summary(), startDate, endDate],
    queryFn: () => ledgerMxnService.getLedgerSummary(startDate, endDate),
    staleTime: 1000 * 60 * 3, // 3 minutes
    retry: 2,
  });
};

// Hook to create a new MXN ledger entry
export const useCreateLedgerMxnEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LedgerEntryFormData) => ledgerMxnService.createLedgerEntry(data),
    onSuccess: (newEntry) => {
      // Invalidate and refetch MXN ledger entries
      queryClient.invalidateQueries({ queryKey: ledgerMxnKeys.entries() });
      queryClient.invalidateQueries({ queryKey: ledgerMxnKeys.summary() });
      
      // Add the new entry to existing queries (optimistic update)
      queryClient.setQueriesData(
        { queryKey: ledgerMxnKeys.entries() },
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
      console.error('Error creating MXN ledger entry:', error);
    },
  });
};

// Hook to update a MXN ledger entry
export const useUpdateLedgerMxnEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<LedgerEntryFormData> }) =>
      ledgerMxnService.updateLedgerEntry(id, data),
    onSuccess: (updatedEntry, { id }) => {
      // Update the specific entry in cache
      queryClient.setQueryData(ledgerMxnKeys.entry(id), updatedEntry);
      
      // Invalidate entries list to refetch
      queryClient.invalidateQueries({ queryKey: ledgerMxnKeys.entries() });
      queryClient.invalidateQueries({ queryKey: ledgerMxnKeys.summary() });
    },
    onError: (error) => {
      console.error('Error updating MXN ledger entry:', error);
    },
  });
};

// Hook to delete a MXN ledger entry
export const useDeleteLedgerMxnEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => ledgerMxnService.deleteLedgerEntry(id),
    onSuccess: (_, deletedId) => {
      // Remove the entry from cache
      queryClient.removeQueries({ queryKey: ledgerMxnKeys.entry(deletedId) });
      
      // Update entries list by removing the deleted entry
      queryClient.setQueriesData(
        { queryKey: ledgerMxnKeys.entries() },
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
      queryClient.invalidateQueries({ queryKey: ledgerMxnKeys.summary() });
    },
    onError: (error) => {
      console.error('Error deleting MXN ledger entry:', error);
    },
  });
};

// Hook for prefetching MXN ledger data
export const useLedgerMxnPrefetching = () => {
  const queryClient = useQueryClient();

  const prefetchLedgerMxnEntries = (filters?: LedgerFilters) => {
    queryClient.prefetchQuery({
      queryKey: ledgerMxnKeys.filtered(filters || {}),
      queryFn: () => ledgerMxnService.getLedgerEntries(filters),
      staleTime: 1000 * 60 * 2,
    });
  };

  const prefetchLedgerMxnEntry = (id: number) => {
    queryClient.prefetchQuery({
      queryKey: ledgerMxnKeys.entry(id),
      queryFn: () => ledgerMxnService.getLedgerEntry(id),
      staleTime: 1000 * 60 * 5,
    });
  };

  const prefetchLedgerMxnSummary = (startDate?: string, endDate?: string) => {
    queryClient.prefetchQuery({
      queryKey: [...ledgerMxnKeys.summary(), startDate, endDate],
      queryFn: () => ledgerMxnService.getLedgerSummary(startDate, endDate),
      staleTime: 1000 * 60 * 3,
    });
  };

  return {
    prefetchLedgerMxnEntries,
    prefetchLedgerMxnEntry,
    prefetchLedgerMxnSummary,
  };
};