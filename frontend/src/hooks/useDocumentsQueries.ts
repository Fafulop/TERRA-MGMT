import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsService } from '../services/documents';
import { Document, DocumentFormData, DocumentFilters, DocumentsResponse, DocumentsSummary } from '../types';

// Query keys
const DOCUMENTS_QUERY_KEY = 'documents';
const DOCUMENTS_SUMMARY_QUERY_KEY = 'documents-summary';

// Get all documents with optional filters
export const useDocuments = (filters?: DocumentFilters & { limit?: number; offset?: number }) => {
  return useQuery<DocumentsResponse, Error>({
    queryKey: [DOCUMENTS_QUERY_KEY, filters],
    queryFn: () => documentsService.getDocuments(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

// Get a single document by ID
export const useDocument = (id: number) => {
  return useQuery<Document, Error>({
    queryKey: [DOCUMENTS_QUERY_KEY, id],
    queryFn: () => documentsService.getDocument(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Get documents summary
export const useDocumentsSummary = () => {
  return useQuery<DocumentsSummary, Error>({
    queryKey: [DOCUMENTS_SUMMARY_QUERY_KEY],
    queryFn: () => documentsService.getSummary(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Create document mutation
export const useCreateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation<Document, Error, DocumentFormData>({
    mutationFn: documentsService.createDocument,
    onSuccess: () => {
      // Invalidate and refetch documents list and summary
      queryClient.invalidateQueries({ queryKey: [DOCUMENTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [DOCUMENTS_SUMMARY_QUERY_KEY] });
    },
    onError: (error) => {
      console.error('Error creating document:', error);
    },
  });
};

// Update document mutation
export const useUpdateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation<Document, Error, { id: number; data: Partial<DocumentFormData> }>({
    mutationFn: ({ id, data }) => documentsService.updateDocument(id, data),
    onSuccess: (updatedDocument) => {
      // Update the specific document in cache
      queryClient.setQueryData([DOCUMENTS_QUERY_KEY, updatedDocument.id], updatedDocument);
      
      // Invalidate documents list to ensure consistency
      queryClient.invalidateQueries({ queryKey: [DOCUMENTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [DOCUMENTS_SUMMARY_QUERY_KEY] });
    },
    onError: (error) => {
      console.error('Error updating document:', error);
    },
  });
};

// Delete document mutation
export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: documentsService.deleteDocument,
    onSuccess: () => {
      // Invalidate and refetch documents list and summary
      queryClient.invalidateQueries({ queryKey: [DOCUMENTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [DOCUMENTS_SUMMARY_QUERY_KEY] });
    },
    onError: (error) => {
      console.error('Error deleting document:', error);
    },
  });
};

// Prefetch document details
export const usePrefetchDocument = () => {
  const queryClient = useQueryClient();

  return (id: number) => {
    queryClient.prefetchQuery({
      queryKey: [DOCUMENTS_QUERY_KEY, id],
      queryFn: () => documentsService.getDocument(id),
      staleTime: 5 * 60 * 1000,
    });
  };
};