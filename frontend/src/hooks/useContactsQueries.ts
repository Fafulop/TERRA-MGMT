import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsService } from '../services/contacts';
import { Contact, ContactFormData, ContactFilters, ContactsResponse, ContactsSummary } from '../types';

// Query keys
const CONTACTS_QUERY_KEY = 'contacts';
const CONTACTS_SUMMARY_QUERY_KEY = 'contacts-summary';

// Get all contacts with optional filters
export const useContacts = (filters?: ContactFilters & { limit?: number; offset?: number }) => {
  return useQuery<ContactsResponse, Error>({
    queryKey: [CONTACTS_QUERY_KEY, filters],
    queryFn: () => contactsService.getContacts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

// Get a single contact by ID
export const useContact = (id: number) => {
  return useQuery<Contact, Error>({
    queryKey: [CONTACTS_QUERY_KEY, id],
    queryFn: () => contactsService.getContact(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Get contacts summary
export const useContactsSummary = () => {
  return useQuery<ContactsSummary, Error>({
    queryKey: [CONTACTS_SUMMARY_QUERY_KEY],
    queryFn: () => contactsService.getSummary(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Create contact mutation
export const useCreateContact = () => {
  const queryClient = useQueryClient();

  return useMutation<Contact, Error, ContactFormData>({
    mutationFn: contactsService.createContact,
    onSuccess: () => {
      // Invalidate and refetch contacts list and summary
      queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTACTS_SUMMARY_QUERY_KEY] });
    },
    onError: (error) => {
      console.error('Error creating contact:', error);
    },
  });
};

// Update contact mutation
export const useUpdateContact = () => {
  const queryClient = useQueryClient();

  return useMutation<Contact, Error, { id: number; data: Partial<ContactFormData> }>({
    mutationFn: ({ id, data }) => contactsService.updateContact(id, data),
    onSuccess: (updatedContact) => {
      // Update the specific contact in cache
      queryClient.setQueryData([CONTACTS_QUERY_KEY, updatedContact.id], updatedContact);
      
      // Invalidate contacts list to ensure consistency
      queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTACTS_SUMMARY_QUERY_KEY] });
    },
    onError: (error) => {
      console.error('Error updating contact:', error);
    },
  });
};

// Delete contact mutation
export const useDeleteContact = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: contactsService.deleteContact,
    onSuccess: () => {
      // Invalidate and refetch contacts list and summary
      queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTACTS_SUMMARY_QUERY_KEY] });
    },
    onError: (error) => {
      console.error('Error deleting contact:', error);
    },
  });
};

// Prefetch contact details
export const usePrefetchContact = () => {
  const queryClient = useQueryClient();

  return (id: number) => {
    queryClient.prefetchQuery({
      queryKey: [CONTACTS_QUERY_KEY, id],
      queryFn: () => contactsService.getContact(id),
      staleTime: 5 * 60 * 1000,
    });
  };
};