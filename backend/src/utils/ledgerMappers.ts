/**
 * Utility functions for mapping database results to API responses
 * Reduces code duplication across ledger controllers
 */

export interface DatabaseLedgerEntry {
  id: number;
  user_id: number;
  amount: string; // Database returns decimal as string
  concept: string;
  bank_account: string;
  internal_id: string;
  bank_movement_id: string | null;
  entry_type: 'income' | 'expense';
  transaction_date: string;
  area: string;
  subarea: string;
  por_realizar: boolean;
  created_at: string;
  updated_at: string;
  username?: string;
  first_name?: string | null;
  last_name?: string | null;
  attachment_count?: string; // Database COUNT returns as string
}

export interface MappedLedgerEntry {
  id: number;
  amount: number;
  concept: string;
  bankAccount: string;
  internalId: string;
  bankMovementId: string | null;
  entryType: 'income' | 'expense';
  date: string;
  area: string;
  subarea: string;
  por_realizar: boolean;
  userId: number;
  username?: string;
  firstName?: string | null;
  lastName?: string | null;
  createdAt: string;
  updatedAt: string;
  attachmentCount?: number;
  attachments?: any[];
  currency?: string;
}

/**
 * Maps a database ledger entry to the frontend API format
 */
export const mapLedgerEntry = (entry: DatabaseLedgerEntry): MappedLedgerEntry => ({
  id: entry.id,
  amount: parseFloat(entry.amount),
  concept: entry.concept,
  bankAccount: entry.bank_account,
  internalId: entry.internal_id,
  bankMovementId: entry.bank_movement_id,
  entryType: entry.entry_type,
  date: entry.transaction_date,
  area: entry.area,
  subarea: entry.subarea,
  por_realizar: entry.por_realizar,
  userId: entry.user_id,
  username: entry.username,
  firstName: entry.first_name,
  lastName: entry.last_name,
  createdAt: entry.created_at,
  updatedAt: entry.updated_at,
  attachmentCount: parseInt(entry.attachment_count || '0') || 0
});

/**
 * Maps a database ledger entry with attachments to the frontend API format
 */
export const mapLedgerEntryWithAttachments = (
  entry: DatabaseLedgerEntry & { attachments?: any[] },
  currency?: string
): MappedLedgerEntry => {
  const mapped = mapLedgerEntry(entry);
  
  if (entry.attachments) {
    mapped.attachments = entry.attachments.map((att: any) => ({
      id: att.id,
      ledgerEntryId: att.ledger_entry_id || att.ledger_entry_mxn_id,
      fileName: att.file_name,
      fileUrl: att.file_url,
      fileSize: att.file_size,
      fileType: att.file_type,
      attachmentType: att.attachment_type,
      urlTitle: att.url_title,
      createdAt: att.created_at,
      uploadedBy: {
        username: att.uploader_username,
        firstName: att.uploader_first_name,
        lastName: att.uploader_last_name
      }
    }));
  }

  if (currency) {
    mapped.currency = currency;
  }

  return mapped;
};

/**
 * Maps an array of database ledger entries to the frontend API format
 */
export const mapLedgerEntries = (
  entries: DatabaseLedgerEntry[],
  currency?: string
): MappedLedgerEntry[] => {
  return entries.map(entry => {
    const mapped = mapLedgerEntry(entry);
    if (currency) {
      mapped.currency = currency;
    }
    return mapped;
  });
};