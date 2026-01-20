'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/types/database'

const CLIENTS_KEY = ['clients'] as const
const CLIENT_KEY = (id: string) => ['client', id] as const

export interface ClientInsert {
  name: string
  email?: string | null
  phone?: string | null
  address_line1?: string | null
  address_line2?: string | null
  city?: string | null
  state?: string | null
  postcode?: string | null
  country?: string
  notes?: string | null
  business_id?: string | null
}

export interface ClientUpdate extends Partial<ClientInsert> {}

/**
 * Hook for managing clients with React Query.
 * Provides CRUD operations and search functionality.
 */
export function useClients() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  /**
   * Fetches all clients for the current user.
   */
  const clientsQuery = useQuery({
    queryKey: CLIENTS_KEY,
    queryFn: async (): Promise<Client[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })

      if (error) throw error
      return clients ?? []
    },
  })

  /**
   * Creates a query for a single client by ID.
   */
  const useClient = (id: string | undefined) => useQuery({
    queryKey: CLIENT_KEY(id || ''),
    queryFn: async (): Promise<Client | null> => {
      if (!id) return null

      const { data: client, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
      }

      return client
    },
    enabled: !!id,
  })

  /**
   * Searches clients by name (for voice matching).
   */
  const searchByName = async (searchName: string): Promise<Client[]> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Use ilike for case-insensitive partial matching
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .ilike('name', `%${searchName}%`)
      .order('name', { ascending: true })
      .limit(10)

    if (error) throw error
    return clients ?? []
  }

  /**
   * Finds the best matching client by name (for AI voice matching).
   */
  const findBestMatch = async (searchName: string): Promise<Client | null> => {
    const clients = await searchByName(searchName)
    if (clients.length === 0) return null

    // Exact match (case insensitive)
    const exactMatch = clients.find(
      c => c.name.toLowerCase() === searchName.toLowerCase()
    )
    if (exactMatch) return exactMatch

    // Return first partial match
    return clients[0]
  }

  /**
   * Creates a new client.
   */
  const createClientMutation = useMutation({
    mutationFn: async (data: ClientInsert): Promise<Client> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: client, error } = await supabase
        .from('clients')
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return client
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTS_KEY })
    },
  })

  /**
   * Updates an existing client.
   */
  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ClientUpdate }): Promise<Client> => {
      const { data: client, error } = await supabase
        .from('clients')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return client
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: CLIENTS_KEY })
      queryClient.invalidateQueries({ queryKey: CLIENT_KEY(id) })
    },
  })

  /**
   * Deletes a client (prevents deletion if invoices exist).
   */
  const deleteClientMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      // Check if any invoices exist for this client
      const { data: invoices, error: checkError } = await supabase
        .from('invoices')
        .select('id')
        .eq('client_id', id)
        .limit(1)

      if (checkError) throw checkError

      if (invoices && invoices.length > 0) {
        throw new Error('Cannot delete client: invoices exist for this client')
      }

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTS_KEY })
    },
  })

  /**
   * Checks if a client can be deleted (no invoices exist).
   */
  const checkCanDelete = async (id: string): Promise<boolean> => {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('id')
      .eq('client_id', id)
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
