import { useState, useEffect } from 'react';
import { 
  Currency, 
  convertCurrency, 
  getExchangeRate, 
  formatCurrencyAmount,
  getDisplayConversion,
  ConversionResult 
} from '../utils/currencyConverter';

/**
 * Hook for converting currency amounts
 */
export const useCurrencyConversion = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convert = async (
    amount: number,
    from: Currency,
    to: Currency
  ): Promise<ConversionResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await convertCurrency(amount, from, to);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Conversion failed';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    convert,
    isLoading,
    error,
  };
};

/**
 * Hook for getting real-time exchange rates
 */
export const useExchangeRate = (from: Currency, to: Currency) => {
  const [rate, setRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchRate = async () => {
    if (from === to) {
      setRate(1);
      setLastUpdated(new Date());
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const exchangeRate = await getExchangeRate(from, to);
      setRate(exchangeRate);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch exchange rate';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRate();
  }, [from, to]);

  return {
    rate,
    isLoading,
    error,
    lastUpdated,
    refetch: fetchRate,
  };
};

/**
 * Hook for displaying converted amounts alongside original amounts
 */
export const useDisplayConversion = (amount: number, baseCurrency: Currency) => {
  const [conversion, setConversion] = useState<{
    amount: number;
    currency: Currency;
    formatted: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!amount || amount === 0) {
      setConversion(null);
      return;
    }

    const fetchConversion = async () => {
      setIsLoading(true);
      try {
        const result = await getDisplayConversion(amount, baseCurrency);
        setConversion(result);
      } catch (error) {
        console.error('Error fetching display conversion:', error);
        setConversion(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversion();
  }, [amount, baseCurrency]);

  return {
    conversion,
    isLoading,
  };
};

/**
 * Hook for formatted currency display
 */
export const useCurrencyFormatter = () => {
  const formatAmount = (amount: number, currency: Currency): string => {
    return formatCurrencyAmount(amount, currency);
  };

  const formatWithConversion = async (
    amount: number,
    baseCurrency: Currency,
    showConversion: boolean = true
  ): Promise<string> => {
    const baseFormatted = formatCurrencyAmount(amount, baseCurrency);
    
    if (!showConversion) {
      return baseFormatted;
    }

    try {
      const conversion = await getDisplayConversion(amount, baseCurrency);
      return `${baseFormatted} (≈ ${conversion.formatted})`;
    } catch (error) {
      return baseFormatted;
    }
  };

  return {
    formatAmount,
    formatWithConversion,
  };
};