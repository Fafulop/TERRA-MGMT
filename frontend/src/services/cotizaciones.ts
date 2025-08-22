import { 
  BaseFinancialService, 
  BaseFinancialEntry, 
  BaseFinancialFormData, 
  BaseFinancialFilters,
  BaseFinancialEntriesResponse 
} from './BaseFinancialService';
import { FileAttachment } from '../types';

// Cotizaciones-specific types extending base types
export interface CotizacionesEntry extends BaseFinancialEntry {
  currency: 'USD' | 'MXN';
  area: string;
  subarea: string;
}

export interface CotizacionesEntryFormData extends BaseFinancialFormData {
  currency: 'USD' | 'MXN';
  area: string;
  subarea: string;
}

export interface CotizacionesFilters extends BaseFinancialFilters {
  currency?: 'USD' | 'MXN';
  area?: string;
  subarea?: string;
}

export interface CotizacionesSummary {
  [currency: string]: {
    totalIncome: number;
    totalExpenses: number;
    netCashFlow: number;
    totalEntries: number;
    incomeEntries: number;
    expenseEntries: number;
  };
}

class CotizacionesService extends BaseFinancialService<
  CotizacionesEntry,
  CotizacionesEntryFormData,
  CotizacionesFilters
> {
  constructor() {
    super('cotizaciones');
  }

  // Override getSummary with currency-specific implementation
  async getSummary(startDate?: string, endDate?: string, currency?: 'USD' | 'MXN'): Promise<CotizacionesSummary> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (currency) params.append('currency', currency);
    
    const response = await this.api.get(`/summary?${params.toString()}`);
    
    // Transform the response to match our interface
    const transformedSummary: CotizacionesSummary = {};
    Object.entries(response.data).forEach(([curr, data]: [string, any]) => {
      transformedSummary[curr] = {
        totalIncome: data.total_income,
        totalExpenses: data.total_expenses,
        netCashFlow: data.net_cash_flow,
        totalEntries: data.total_entries,
        incomeEntries: data.income_entries,
        expenseEntries: data.expense_entries
      };
    });
    
    return transformedSummary;
  }
}

export interface CotizacionesEntriesResponse extends BaseFinancialEntriesResponse<CotizacionesEntry> {
  summary: {
    [currency: string]: {
      total_income: number;
      total_expenses: number;
      net_cash_flow: number;
      total_entries: number;
    };
  };
}

// Create service instance
const cotizacionesServiceInstance = new CotizacionesService();

// Export service with method aliases for backward compatibility
export const cotizacionesService = {
  getCotizacionesEntries: (filters?: CotizacionesFilters & { limit?: number; offset?: number }) => 
    cotizacionesServiceInstance.getEntries(filters),
  getCotizacionesEntry: (id: number) => 
    cotizacionesServiceInstance.getEntry(id),
  createCotizacionesEntry: (data: CotizacionesEntryFormData) => 
    cotizacionesServiceInstance.createEntry(data),
  updateCotizacionesEntry: (id: number, data: Partial<CotizacionesEntryFormData>) => 
    cotizacionesServiceInstance.updateEntry(id, data),
  deleteCotizacionesEntry: (id: number) => 
    cotizacionesServiceInstance.deleteEntry(id),
  getCotizacionesSummary: (startDate?: string, endDate?: string, currency?: 'USD' | 'MXN') => 
    cotizacionesServiceInstance.getSummary(startDate, endDate, currency),
  exportCotizacionesData: (format: 'csv' | 'pdf', filters?: CotizacionesFilters) => 
    cotizacionesServiceInstance.exportData(format, filters)
};