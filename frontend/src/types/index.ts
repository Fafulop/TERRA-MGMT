export interface User {
  id: number;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  startDate?: string;
  endDate?: string;
  area: string;
  subarea: string;
  userId: number;
  // User information (available when viewing all tasks)
  username?: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  area: string;
  subarea: string;
}

export interface Comment {
  id: number;
  taskId: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  author: {
    username: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface CommentFormData {
  comment: string;
}

export interface Attachment {
  id: number;
  taskId?: number;
  commentId?: number;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
  attachmentType: 'file' | 'url';
  urlTitle?: string;
  createdAt: string;
  uploadedBy: {
    username: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface AttachmentFormData {
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
  attachmentType: 'file' | 'url';
  urlTitle?: string;
}

// Enhanced file upload types
export interface UploadedFile {
  id: string;
  name: string;
  url: string;
  fileUrl: string;
  size: number;
  type: string;
  uploadedBy?: number;
}

export interface FileAttachment {
  file: UploadedFile;
  title: string;
}

export interface UrlAttachment {
  url: string;
  title: string;
}

export interface AttachmentData {
  fileAttachments: FileAttachment[];
  urlAttachments: UrlAttachment[];
}

// API Error types
export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, string>;
  timestamp?: string;
}

// Mutation context types for optimistic updates
export interface TaskMutationContext {
  previousTasks?: Task[];
}

export interface CommentMutationContext {
  previousComments?: Comment[];
}

// Accounting Ledger Types
export interface LedgerEntry {
  id: number;
  amount: number; // Positive for money in, negative for money out
  concept: string;
  bankAccount: string;
  internalId: string;
  bankMovementId?: string;
  entryType: 'income' | 'expense';
  date: string;
  area: string;
  subarea: string;
  por_realizar?: boolean; // Future transaction not yet realized
  userId: number;
  // User information (available when viewing all entries)
  username?: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  updatedAt: string;
  attachments?: LedgerAttachment[];
  attachmentCount?: number; // For list view optimization
}

export interface LedgerAttachment {
  id: number;
  ledgerEntryId: number;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
  attachmentType: 'file' | 'url';
  urlTitle?: string;
  createdAt: string;
  uploadedBy: {
    username: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface LedgerEntryFormData {
  amount: number;
  concept: string;
  bankAccount: string;
  bankMovementId?: string;
  entryType: 'income' | 'expense';
  date: string;
  area: string;
  subarea: string;
  por_realizar?: boolean; // Future transaction not yet realized
  fileAttachments: FileAttachment[];
}

export interface LedgerFilters {
  entryType?: 'income' | 'expense' | 'all';
  bankAccount?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
  area?: string;
  subarea?: string;
  por_realizar?: 'realized' | 'por_realizar' | 'all';
}

export interface LedgerSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  periodStart: string;
  periodEnd: string;
}

// Contacts Types
export interface Contact {
  id: number;
  user_id: number;
  internal_id: string;
  
  // Basic contact information
  name: string;
  company?: string;
  position?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  
  // Address information
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  
  // Business information
  contact_type: 'business' | 'client' | 'supplier' | 'partner' | 'prospect' | 'vendor';
  status: 'active' | 'inactive' | 'archived';
  area: string;
  subarea: string;
  industry?: string;
  website?: string;
  
  // Additional information
  notes?: string;
  tags?: string[];
  
  // User information (available when viewing all contacts)
  username?: string;
  first_name?: string;
  last_name?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  attachment_count?: number;
  attachments?: ContactAttachment[];
}

export interface ContactAttachment {
  id: number;
  contact_id: number;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
  attachmentType: 'file' | 'url';
  urlTitle?: string;
  createdAt: string;
  uploadedBy: {
    username: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface ContactFormData {
  name: string;
  company?: string;
  position?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  contact_type: 'business' | 'client' | 'supplier' | 'partner' | 'prospect' | 'vendor';
  status: 'active' | 'inactive' | 'archived';
  area: string;
  subarea: string;
  industry?: string;
  website?: string;
  notes?: string;
  tags?: string[];
  fileAttachments: FileAttachment[];
}

export interface ContactFilters {
  contact_type?: string;
  status?: string;
  company?: string;
  area?: string;
  subarea?: string;
  search?: string;
}

export interface ContactsResponse {
  contacts: Contact[];
  summary: ContactsSummary;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface ContactsSummary {
  total_contacts: number;
  active_contacts: number;
  inactive_contacts: number;
  clients: number;
  suppliers: number;
  partners: number;
  prospects: number;
}

// Documents Types
export interface Document {
  id: number;
  user_id: number;
  internal_id: string;
  
  // Required document information
  document_name: string;
  area: string;
  subarea: string;
  
  // Optional document information
  description?: string;
  document_type?: string;
  version: string;
  status: 'active' | 'archived' | 'draft';
  tags?: string[];
  
  // User information (available when viewing all documents)
  username?: string;
  first_name?: string;
  last_name?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  attachment_count?: number;
  attachments?: DocumentAttachment[];
}

export interface DocumentAttachment {
  id: number;
  document_id: number;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
  attachmentType: 'file' | 'url';
  urlTitle?: string;
  createdAt: string;
  uploadedBy: {
    username: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface DocumentFormData {
  document_name: string;
  area: string;
  subarea: string;
  description?: string;
  document_type?: string;
  version?: string;
  status: 'active' | 'archived' | 'draft';
  tags?: string[];
  fileAttachments: FileAttachment[];
}

export interface DocumentFilters {
  status?: string;
  area?: string;
  subarea?: string;
  document_type?: string;
  search?: string;
}

export interface DocumentsResponse {
  documents: Document[];
  summary: DocumentsSummary;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface DocumentsSummary {
  total_documents: number;
  active_documents: number;
  draft_documents: number;
  archived_documents: number;
  total_areas: number;
  total_subareas: number;
}