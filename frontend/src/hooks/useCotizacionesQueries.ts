import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  cotizacionesService, 
  CotizacionesEntry, 
  CotizacionesEntryFormData, 
  CotizacionesFilters 
} from '../services/cotizaciones';

// Query keys for consistent cache management (Cotizaciones)
export const cotizacionesKeys = {
  all: ['cotizaciones'] as const,
  entries: () => [...cotizacionesKeys.all, 'entries'] as const,
  entry: (id: number) => [...cotizacionesKeys.all, 'entry', id] as const,
  summary: () => [...cotizacionesKeys.all, 'summary'] as const,
  filtered: (filters: CotizacionesFilters) => [...cotizacionesKeys.entries(), 'filtered', filters] as const,
};

// Hook to get cotizaciones entries with filtering
export const useCotizacionesEntries = (filters?: CotizacionesFilters & { limit?: number; offset?: number }) => {
  return useQuery({
    queryKey: cotizacionesKeys.filtered(filters || {}),
    queryFn: () => cotizacionesService.getCotizacionesEntries(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

// Hook to get a single cotizaciones entry
export const useCotizacionesEntry = (id: number) => {
  return useQuery({
    queryKey: cotizacionesKeys.entry(id),
    queryFn: () => cotizacionesService.getCotizacionesEntry(id),
    enabled: !!id && id > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
};

// Hook to get cotizaciones summary
export const useCotizacionesSummary = (startDate?: string, endDate?: string, currency?: 'USD' | 'MXN') => {
  return useQuery({
    queryKey: [...cotizacionesKeys.summary(), startDate, endDate, currency],
    queryFn: () => cotizacionesService.getCotizacionesSummary(startDate, endDate, currency),
    staleTime: 1000 * 60 * 3, // 3 minutes
    retry: 2,
  });
};

// Hook to create a new cotizaciones entry
export const useCreateCotizacionesEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CotizacionesEntryFormData) => cotizacionesService.createCotizacionesEntry(data),
    onSuccess: (newEntry) => {
      // Invalidate and refetch cotizaciones entries
      queryClient.invalidateQueries({ queryKey: cotizacionesKeys.entries() });
      queryClient.invalidateQueries({ queryKey: cotizacionesKeys.summary() });
      
      // Add the new entry to existing queries (optimistic update)
      queryClient.setQueriesData(
        { queryKey: cotizacionesKeys.entries() },
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
      console.error('Error creating cotizaciones entry:', error);
    },
  });
};

// Hook to update a cotizaciones entry
export const useUpdateCotizacionesEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CotizacionesEntryFormData> }) =>
      cotizacionesService.updateCotizacionesEntry(id, data),
    onSuccess: (updatedEntry, { id }) => {
      // Update the specific entry in cache
      queryClient.setQueryData(cotizacionesKeys.entry(id), updatedEntry);
      
      // Invalidate entries list to refetch
      queryClient.invalidateQueries({ queryKey: cotizacionesKeys.entries() });
      queryClient.invalidateQueries({ queryKey: cotizacionesKeys.summary() });
    },
    onError: (error) => {
      console.error('Error updating cotizaciones entry:', error);
    },
  });
};

// Hook to delete a cotizaciones entry
export const useDeleteCotizacionesEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => cotizacionesService.deleteCotizacionesEntry(id),
    onSuccess: (_, deletedId) => {
      // Remove the entry from cache
      queryClient.removeQueries({ queryKey: cotizacionesKeys.entry(deletedId) });
      
      // Update entries list by removing the deleted entry
      queryClient.setQueriesData(
        { queryKey: cotizacionesKeys.entries() },
        (oldData: any) => {
          if (oldData?.entries) {
            return {
              ...oldData,
              entries: oldData.entries.filter((entry: CotizacionesEntry) => entry.id !== deletedId),
            };
          }
          return oldData;
        }
      );
      
      // Invalidate summary to refetch
      queryClient.invalidateQueries({ queryKey: cotizacionesKeys.summary() });
    },
    onError: (error) => {
      console.error('Error deleting cotizaciones entry:', error);
    },
  });
};

// Hook for prefetching cotizaciones data
export const useCotizacionesPrefetching = () => {
  const queryClient = useQueryClient();

  const prefetchCotizacionesEntries = (filters?: CotizacionesFilters) => {
    queryClient.prefetchQuery({
      queryKey: cotizacionesKeys.filtered(filters || {}),
      queryFn: () => cotizacionesService.getCotizacionesEntries(filters),
      staleTime: 1000 * 60 * 2,
    });
  };

  const prefetchCotizacionesEntry = (id: number) => {
    queryClient.prefetchQuery({
      queryKey: cotizacionesKeys.entry(id),
      queryFn: () => cotizacionesService.getCotizacionesEntry(id),
      staleTime: 1000 * 60 * 5,
    });
  };

  const prefetchCotizacionesSummary = (startDate?: string, endDate?: string, currency?: 'USD' | 'MXN') => {
    queryClient.prefetchQuery({
      queryKey: [...cotizacionesKeys.summary(), startDate, endDate, currency],
      queryFn: () => cotizacionesService.getCotizacionesSummary(startDate, endDate, currency),
      staleTime: 1000 * 60 * 3,
    });
  };

  return {
    prefetchCotizacionesEntries,
    prefetchCotizacionesEntry,
    prefetchCotizacionesSummary,
  };
};