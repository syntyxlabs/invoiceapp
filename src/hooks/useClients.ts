'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const CLIENTS_KEY = ['clients'] as const
const CLIENT_KEY = (id: string) => ['client', id] as const

// Match the inv_customers table schema
export interface Customer {
  id: string
  user_id: string
  name: string
  emails: string[] | null
  phone: string | null
  address: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CustomerInsert {
  name: string
  emails?: string[] | null
  phone?: string | null
  address?: string | null
  notes?: string | null
}

export interface CustomerUpdate extends Partial<CustomerInsert> {}

/**
 * Hook for managing customers with React Query.
 * Provides CRUD operations and search functionality.
 */
export function useClients() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  /**
   * Fetches all customers for the current user.
   */
  const clientsQuery = useQuery({
    queryKey: CLIENTS_KEY,
    queryFn: async (): Promise<Customer[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: customers, error } = await supabase
        .from('inv_customers')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })

      if (error) throw error
      return customers ?? []
    },
  })

  /**
   * Creates a query for a single customer by ID.
   */
  const useClient = (id: string | undefined) => useQuery({
    queryKey: CLIENT_KEY(id || ''),
    queryFn: async (): Promise<Customer | null> => {
      if (!id) return null

      const { data: customer, error } = await supabase
        .from('inv_customers')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
      }

      return customer
    },
    enabled: !!id,
  })

  /**
   * Searches customers by name (for voice matching).
   */
  const searchByName = async (searchName: string): Promise<Customer[]> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Use ilike for case-insensitive partial matching
    const { data: customers, error } = await supabase
      .from('inv_customers')
      .select('*')
      .eq('user_id', user.id)
      .ilike('name', `%${searchName}%`)
      .order('name', { ascending: true })
      .limit(10)

    if (error) throw error
    return customers ?? []
  }

  /**
   * Finds the best matching customer by name (for AI voice matching).
   */
  const findBestMatch = async (searchName: string): Promise<Customer | null> => {
    const customers = await searchByName(searchName)
    if (customers.length === 0) return null

    // Exact match (case insensitive)
    const exactMatch = customers.find(
      c => c.name.toLowerCase() === searchName.toLowerCase()
    )
    if (exactMatch) return exactMatch

    // Return first partial match
    return customers[0]
  }

  /**
   * Creates a new customer.
   */
  const createClientMutation = useMutation({
    mutationFn: async (data: CustomerInsert): Promise<Customer> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: customer, error } = await supabase
        .from('inv_customers')
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return customer
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTS_KEY })
    },
  })

  /**
   * Updates an existing customer.
   */
  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CustomerUpdate }): Promise<Customer> => {
      const { data: customer, error } = await supabase
        .from('inv_customers')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return customer
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: CLIENTS_KEY })
      queryClient.invalidateQueries({ queryKey: CLIENT_KEY(id) })
    },
  })

  /**
   * Deletes a customer (prevents deletion if invoices exist).
   */
  const deleteClientMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      // Check if any invoices exist for this customer
      const { data: invoices, error: checkError } = await supabase
        .from('inv_invoices')
        .select('id')
        .eq('customer_id', id)
        .limit(1)

      if (checkError) throw checkError

      if (invoices && invoices.length > 0) {
        throw new Error('Cannot delete customer: invoices exist for this customer')
      }

      const { error } = await supabase
        .from('inv_customers')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTS_KEY })
    },
  })

  /**
   * Checks if a customer can be deleted (no invoices exist).
   */
  const checkCanDelete = async (id: string): Promise<boolean> => {
    const { data: invoices, error } = await supabase
      .from('inv_invoices')
      .select('id')
      .eq('customer_id', id)
      .limit(1)

    if (error) throw error
    return !invoices || invoices.length === 0
  }

  return {
    // Queries
    clients: clientsQuery.data ?? [],
    isLoading: clientsQuery.isLoading,
    isError: clientsQuery.isError,
    error: clientsQuery.error,
    useClient,

    // Search
    searchByName,
    findBestMatch,

    // Mutations
    createClient: createClientMutation.mutateAsync,
    updateClient: updateClientMutation.mutateAsync,
    deleteClient: deleteClientMutation.mutateAsync,

    // Mutation states
    isCreating: createClientMutation.isPending,
    isUpdating: updateClientMutation.isPending,
    isDeleting: deleteClientMutation.isPending,

    // Helpers
    checkCanDelete,
  }
}
