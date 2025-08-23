// Currency conversion utilities for USD/MXN ledger system

export type Currency = 'USD' | 'MXN';

export interface ExchangeRate {
  from: Currency;
  to: Currency;
  rate: number;
  lastUpdated: Date;
}

export interface ConversionResult {
  originalAmount: number;
  originalCurrency: Currency;
  convertedAmount: number;
  convertedCurrency: Currency;
  exchangeRate: number;
  conversionDate: Date;
}

// Mock exchange rates (in production, these would come from an API)
// These are approximate rates and should be updated with real-time data
const MOCK_EXCHANGE_RATES: Record<string, number> = {
  'USD_TO_MXN': 17.50, // 1 USD = 17.50 MXN (approximate)
  'MXN_TO_USD': 0.057, // 1 MXN = 0.057 USD (approximate)
};

/**
 * Get the current exchange rate between two currencies
 * In production, this would fetch from a real exchange rate API
 */
export const getExchangeRate = async (from: Currency, to: Currency): Promise<number> => {
  if (from === to) return 1;
  
  const rateKey = `${from}_TO_${to}`;
  const rate = MOCK_EXCHANGE_RATES[rateKey];
  
  if (!rate) {
    throw new Error(`Exchange rate not available for ${from} to ${to}`);
  }
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return rate;
};

/**
 * Convert an amount from one currency to another
 */
export const convertCurrency = async (
  amount: number,
  from: Currency,
  to: Currency
): Promise<ConversionResult> => {
  if (from === to) {
    return {
      originalAmount: amount,
      originalCurrency: from,
      convertedAmount: amount,
      convertedCurrency: to,
      exchangeRate: 1,
      conversionDate: new Date(),
    };
  }
  
  const exchangeRate = await getExchangeRate(from, to);
  const convertedAmount = amount * exchangeRate;
  
  return {
    originalAmount: amount,
    originalCurrency: from,
    convertedAmount: Math.round(convertedAmount * 100) / 100, // Round to 2 decimal places
    convertedCurrency: to,
    exchangeRate,
    conversionDate: new Date(),
  };
};

/**
 * Format currency amount with appropriate symbol and locale
 */
export const formatCurrencyAmount = (amount: number, currency: Currency): string => {
  const formatters: Record<Currency, Intl.NumberFormat> = {
    USD: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }),
    MXN: new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }),
  };
  
  return formatters[currency].format(amount);
};

/**
 * Get currency symbol
 */
export const getCurrencySymbol = (currency: Currency): string => {
  const symbols: Record<Currency, string> = {
    USD: '$',
    MXN: '$',
  };
  
  return symbols[currency];
};

/**
 * Get currency display name
 */
export const getCurrencyDisplayName = (currency: Currency): string => {
  const names: Record<Currency, string> = {
    USD: 'US Dollar',
    MXN: 'Mexican Peso',
  };
  
  return names[currency];
};

/**
 * Validate if amount is valid for currency operations
 */
export const isValidCurrencyAmount = (amount: number): boolean => {
  return !isNaN(amount) && isFinite(amount) && amount >= 0;
};

/**
 * Calculate percentage change between two amounts
 */
export const calculatePercentageChange = (oldAmount: number, newAmount: number): number => {
  if (oldAmount === 0) return newAmount > 0 ? 100 : 0;
  return Math.round(((newAmount - oldAmount) / oldAmount) * 100 * 100) / 100;
};

/**
 * Convert currency amount for display purposes
 * This function is useful for showing equivalent amounts in the UI
 */
export const getDisplayConversion = async (
  amount: number,
  baseCurrency: Currency
): Promise<{ amount: number; currency: Currency; formatted: string }> => {
  const targetCurrency: Currency = baseCurrency === 'USD' ? 'MXN' : 'USD';
  
  try {
    const conversion = await convertCurrency(amount, baseCurrency, targetCurrency);
    
    return {
      amount: conversion.convertedAmount,
      currency: targetCurrency,
      formatted: formatCurrencyAmount(conversion.convertedAmount, targetCurrency),
    };
  } catch (error) {
    console.error('Error converting currency for display:', error);
    return {
      amount: 0,
      currency: targetCurrency,
      formatted: formatCurrencyAmount(0, targetCurrency),
    };
  }
};

