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
  userId: number;
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
  fileAttachments: FileAttachment[];
}

export interface LedgerFilters {
  entryType?: 'income' | 'expense' | 'all';
  bankAccount?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}

export interface LedgerSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  periodStart: string;
  periodEnd: string;
}