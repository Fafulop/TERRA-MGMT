/**
 * Generates unique internal IDs for financial entries
 * Replaces duplicate ID generation functions across controllers
 */

export const generateInternalId = (prefix: string): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Predefined prefixes for different financial entities
 */
export const ID_PREFIXES = {
  TRANSACTION: 'TXN',      // For ledger entries
  MEXICAN_PESO: 'MXN',     // For MXN ledger entries  
  COTIZACION: 'COT',       // For cotizaciones entries
  TASK: 'TSK',             // For future task integration
  COMMENT: 'CMT'           // For future comment integration
} as const;

/**
 * Type-safe ID generation for specific entities
 */
export const generateTransactionId = () => generateInternalId(ID_PREFIXES.TRANSACTION);
export const generateMexicanPesoId = () => generateInternalId(ID_PREFIXES.MEXICAN_PESO);
export const generateCotizacionId = () => generateInternalId(ID_PREFIXES.COTIZACION);
export const generateTaskId = () => generateInternalId(ID_PREFIXES.TASK);
export const generateCommentId = () => generateInternalId(ID_PREFIXES.COMMENT);