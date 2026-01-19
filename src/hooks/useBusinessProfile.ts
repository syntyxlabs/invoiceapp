'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type {
  BusinessProfile,
  BusinessProfileInsert,
  BusinessProfileUpdate,
  BusinessProfileWithSequence,
  InvoiceSequence,
  InvoiceSequenceInsert,
} from '@/types/database'

const PROFILES_KEY = ['business-profiles'] as const
const PROFILE_KEY = (id: string) => ['business-profile', id] as const

interface CreateProfileData {
  profile: Omit<BusinessProfileInsert, 'user_id'>
  sequence?: {
    prefix: string
    next_number: number
  }
}

interface UpdateProfileData {
  profile: BusinessProfileUpdate
  sequence?: {
    prefix: string
    next_number: number
  }
}

/**
 * Hook for managing business profiles with React Query.
 * Provides CRUD operations and default profile management.
 */
export function useBusinessProfile() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  /**
   * Fetches all business profiles for the current user.
   */
  const profilesQuery = useQuery({
    queryKey: PROFILES_KEY,
    queryFn: async (): Promise<BusinessProfileWithSequence[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profiles, error } = await supabase
        .from('inv_business_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch sequences for all profiles
      const profileIds = profiles.map(p => p.id)
      const { data: sequences, error: seqError } = await supabase
        .from('inv_sequences')
        .select('*')
        .in('business_profile_id', profileIds)

      if (seqError) throw seqError

      // Map sequences to profiles
      const sequenceMap = new Map<string, InvoiceSequence>()
      sequences?.forEach(seq => sequenceMap.set(seq.business_profile_id, seq))

      return profiles.map(profile => ({
        ...profile,
        sequence: sequenceMap.get(profile.id) || null,
      }))
    },
  })

  /**
   * Creates a query for a single profile by ID.
   */
  const useProfile = (id: string | undefined) => useQuery({
    queryKey: PROFILE_KEY(id || ''),
    queryFn: async (): Promise<BusinessProfileWithSequence | null> => {
      if (!id) return null

      const { data: profile, error } = await supabase
        .from('inv_business_profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
      }

      // Fetch sequence for this profile
      const { data: sequence, error: seqError } = await supabase
        .from('inv_sequences')
        .select('*')
        .eq('business_profile_id', id)
        .single()

      if (seqError && seqError.code !== 'PGRST116') throw seqError

      return {
        ...profile,
        sequence: sequence || null,
      }
    },
    enabled: !!id,
  })

  /**
   * Creates a new business profile.
   */
  const createProfileMutation = useMutation({
    mutationFn: async (data: CreateProfileData): Promise<BusinessProfileWithSequence> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // If this will be the default, unset any existing default first
      if (data.profile.is_default) {
        await supabase
          .from('inv_business_profiles')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .eq('is_default', true)
      }

      // Create the profile
      const { data: profile, error } = await supabase
        .from('inv_business_profiles')
        .insert({
          ...data.profile,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error

      // Create the sequence if provided
      let sequence: InvoiceSequence | null = null
      if (data.sequence) {
        const { data: seqData, error: seqError } = await supabase
          .from('inv_sequences')
          .insert({
            business_profile_id: profile.id,
            prefix: data.sequence.prefix,
            next_number: data.sequence.next_number,
          } as InvoiceSequenceInsert)
          .select()
          .single()

        if (seqError) throw seqError
        sequence = seqData
      }

      return {
        ...profile,
        sequence,
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILES_KEY })
    },
  })

  /**
   * Updates an existing business profile.
   */
  const updateProfileMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProfileData }): Promise<BusinessProfileWithSequence> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // If setting as default, unset any existing default first
      if (data.profile.is_default) {
        await supabase
          .from('inv_business_profiles')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .eq('is_default', true)
          .neq('id', id)
      }

      // Update the profile
      const { data: profile, error } = await supabase
        .from('inv_business_profiles')
        .update(data.profile)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Update or create the sequence if provided
      let sequence: InvoiceSequence | null = null
      if (data.sequence) {
        // Try to update existing sequence first
        const { data: existingSeq } = await supabase
          .from('inv_sequences')
          .select('*')
          .eq('business_profile_id', id)
          .single()

        if (existingSeq) {
          const { data: seqData, error: seqError } = await supabase
            .from('inv_sequences')
            .update({
              prefix: data.sequence.prefix,
              next_number: data.sequence.next_number,
            })
            .eq('business_profile_id', id)
            .select()
            .single()

          if (seqError) throw seqError
          sequence = seqData
        } else {
          const { data: seqData, error: seqError } = await supabase
            .from('inv_sequences')
            .insert({
              business_profile_id: id,
              prefix: data.sequence.prefix,
              next_number: data.sequence.next_number,
            } as InvoiceSequenceInsert)
            .select()
            .single()

          if (seqError) throw seqError
          sequence = seqData
        }
      }

      return {
        ...profile,
        sequence,
      }
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: PROFILES_KEY })
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY(id) })
    },
  })

  /**
   * Sets a profile as the default.
   */
  const setDefaultMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Unset existing default
      await supabase
        .from('inv_business_profiles')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true)

      // Set new default
      const { error } = await supabase
        .from('inv_business_profiles')
        .update({ is_default: true })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILES_KEY })
    },
  })

  /**
   * Deletes a business profile (prevents deletion if invoices exist).
   */
  const deleteProfileMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      // Check if any invoices exist for this profile
      const { data: invoices, error: checkError } = await supabase
        .from('inv_invoices')
        .select('id')
        .eq('business_profile_id', id)
        .limit(1)

      if (checkError) throw checkError

      if (invoices && invoices.length > 0) {
        throw new Error('Cannot delete profile: invoices exist for this profile')
      }

      // Delete the sequence first (foreign key constraint)
      await supabase
        .from('inv_sequences')
        .delete()
        .eq('business_profile_id', id)

      // Delete the profile
      const { error } = await supabase
        .from('inv_business_profiles')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILES_KEY })
    },
  })

  /**
   * Checks if a profile can be deleted (no invoices exist).
   */
  const checkCanDelete = async (id: string): Promise<boolean> => {
    const { data: invoices, error } = await supabase
      .from('inv_invoices')
      .select('id')
      .eq('business_profile_id', id)
      .limit(1)

    if (error) throw error
    return !invoices || invoices.length === 0
  }

  return {
    // Queries
    profiles: profilesQuery.data ?? [],
    isLoading: profilesQuery.isLoading,
    isError: profilesQuery.isError,
    error: profilesQuery.error,
    useProfile,

    // Mutations
    createProfile: createProfileMutation.mutateAsync,
    updateProfile: updateProfileMutation.mutateAsync,
    setDefault: setDefaultMutation.mutateAsync,
    deleteProfile: deleteProfileMutation.mutateAsync,

    // Mutation states
    isCreating: createProfileMutation.isPending,
    isUpdating: updateProfileMutation.isPending,
    isDeleting: deleteProfileMutation.isPending,
    isSettingDefault: setDefaultMutation.isPending,

    // Helpers
    checkCanDelete,
  }
}
