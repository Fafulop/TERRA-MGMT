import { 
  cotizacionesService
} from '../services/cotizaciones';
import { createFinancialHooks } from './useBaseFinancialQueries';

// Create service wrapper that matches the expected interface
const serviceWrapper = {
  getEntries: cotizacionesService.getCotizacionesEntries,
  getEntry: cotizacionesService.getCotizacionesEntry,
  createEntry: cotizacionesService.createCotizacionesEntry,
  updateEntry: cotizacionesService.updateCotizacionesEntry,
  deleteEntry: cotizacionesService.deleteCotizacionesEntry,
  getSummary: cotizacionesService.getCotizacionesSummary,
  exportData: cotizacionesService.exportCotizacionesData
};

// Create generic hooks for cotizaciones
const cotizacionesHooks = createFinancialHooks('cotizaciones', serviceWrapper as any);

// Export query keys
export const cotizacionesKeys = cotizacionesHooks.queryKeys;

// Hook to get cotizaciones entries with filtering
export const useCotizacionesEntries = cotizacionesHooks.useEntries;

// Hook to get a single cotizaciones entry
export const useCotizacionesEntry = cotizacionesHooks.useEntry;

// Hook to get cotizaciones summary
export const useCotizacionesSummary = (startDate?: string, endDate?: string, currency?: 'USD' | 'MXN') => {
  return cotizacionesHooks.useSummary(startDate, endDate, currency);
};

// Hook to create a new cotizaciones entry
export const useCreateCotizacionesEntry = cotizacionesHooks.useCreateEntry;

// Hook to update a cotizaciones entry
export const useUpdateCotizacionesEntry = cotizacionesHooks.useUpdateEntry;

// Hook to delete a cotizaciones entry
export const useDeleteCotizacionesEntry = cotizacionesHooks.useDeleteEntry;

// Hook for prefetching cotizaciones data
export const useCotizacionesPrefetching = () => {
  const basePrefetching = cotizacionesHooks.usePrefetching();
  
  return {
    prefetchCotizacionesEntries: basePrefetching.prefetchEntries,
    prefetchCotizacionesEntry: basePrefetching.prefetchEntry,
    prefetchCotizacionesSummary: basePrefetching.prefetchSummary,
  };
};