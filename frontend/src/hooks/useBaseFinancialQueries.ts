import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { 
  BaseFinancialService,
  BaseFinancialEntry, 
  BaseFinancialFormData, 
  BaseFinancialFilters
} from '../services/BaseFinancialService';

// Generic query key factory
export const createFinancialQueryKeys = (entityName: string) => ({
  all: [entityName] as const,
  entries: () => [...createFinancialQueryKeys(entityName).all, 'entries'] as const,
  entry: (id: number) => [...createFinancialQueryKeys(entityName).all, 'entry', id] as const,
  summary: () => [...createFinancialQueryKeys(entityName).all, 'summary'] as const,
  filtered: (filters: any) => [...createFinancialQueryKeys(entityName).entries(), 'filtered', filters] as const,
});

// Generic hook factory for financial entities
export function createFinancialHooks<
  TEntry extends BaseFinancialEntry,
  TFormData extends BaseFinancialFormData,
  TFilters extends BaseFinancialFilters,
  TService extends BaseFinancialService<TEntry, TFormData, TFilters>
>(
  entityName: string,
  service: TService
) {
  const queryKeys = createFinancialQueryKeys(entityName);

  // Hook to get entries with filtering
  const useEntries = (filters?: TFilters & { limit?: number; offset?: number }) => {
    return useQuery({
      queryKey: queryKeys.filtered(filters || {}),
      queryFn: () => service.getEntries(filters),
      staleTime: 1000 * 60 * 2, // 2 minutes
      refetchOnWindowFocus: false,
      retry: 2,
    });
  };

  // Hook to get a single entry
  const useEntry = (id: number) => {
    return useQuery({
      queryKey: queryKeys.entry(id),
      queryFn: () => service.getEntry(id),
      enabled: !!id && id > 0,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    });
  };

  // Hook to get summary (to be implemented by specific services)
  const useSummary = (...args: any[]) => {
    return useQuery({
      queryKey: [...queryKeys.summary(), ...args],
      queryFn: () => service.getSummary(...args),
      staleTime: 1000 * 60 * 3, // 3 minutes
      retry: 2,
    });
  };

  // Hook to create a new entry
  const useCreateEntry = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data: TFormData) => service.createEntry(data),
      onSuccess: (newEntry) => {
        // Invalidate and refetch entries
        queryClient.invalidateQueries({ queryKey: queryKeys.entries() });
        queryClient.invalidateQueries({ queryKey: queryKeys.summary() });
        
        // Add the new entry to existing queries (optimistic update)
        queryClient.setQueriesData(
          { queryKey: queryKeys.entries() },
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
        console.error(`Error creating ${entityName} entry:`, error);
      },
    });
  };

  // Hook to update an entry
  const useUpdateEntry = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ id, data }: { id: number; data: Partial<TFormData> }) =>
        service.updateEntry(id, data),
      onSuccess: (updatedEntry, { id }) => {
        // Update the specific entry in cache
        queryClient.setQueryData(queryKeys.entry(id), updatedEntry);
        
        // Invalidate entries list to refetch
        queryClient.invalidateQueries({ queryKey: queryKeys.entries() });
        queryClient.invalidateQueries({ queryKey: queryKeys.summary() });
      },
      onError: (error) => {
        console.error(`Error updating ${entityName} entry:`, error);
      },
    });
  };

  // Hook to delete an entry
  const useDeleteEntry = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (id: number) => service.deleteEntry(id),
      onSuccess: (_, deletedId) => {
        // Remove the entry from cache
        queryClient.removeQueries({ queryKey: queryKeys.entry(deletedId) });
        
        // Update entries list by removing the deleted entry
        queryClient.setQueriesData(
          { queryKey: queryKeys.entries() },
          (oldData: any) => {
            if (oldData?.entries) {
              return {
                ...oldData,
                entries: oldData.entries.filter((entry: TEntry) => entry.id !== deletedId),
              };
            }
            return oldData;
          }
        );
        
        // Invalidate summary to refetch
        queryClient.invalidateQueries({ queryKey: queryKeys.summary() });
      },
      onError: (error) => {
        console.error(`Error deleting ${entityName} entry:`, error);
      },
    });
  };

  // Hook for prefetching data
  const usePrefetching = () => {
    const queryClient = useQueryClient();

    const prefetchEntries = (filters?: TFilters) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.filtered(filters || {}),
        queryFn: () => service.getEntries(filters),
        staleTime: 1000 * 60 * 2,
      });
    };

    const prefetchEntry = (id: number) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.entry(id),
        queryFn: () => service.getEntry(id),
        staleTime: 1000 * 60 * 5,
      });
    };

    const prefetchSummary = (...args: any[]) => {
      queryClient.prefetchQuery({
        queryKey: [...queryKeys.summary(), ...args],
        queryFn: () => service.getSummary(...args),
        staleTime: 1000 * 60 * 3,
      });
    };

    return {
      prefetchEntries,
      prefetchEntry,
      prefetchSummary,
    };
  };

  return {
    queryKeys,
    useEntries,
    useEntry,
    useSummary,
    useCreateEntry,
    useUpdateEntry,
    useDeleteEntry,
    usePrefetching,
  };
}