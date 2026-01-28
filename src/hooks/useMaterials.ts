'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const MATERIALS_KEY = ['materials'] as const
const MATERIAL_KEY = (id: string) => ['material', id] as const

export interface Material {
  id: string
  user_id: string
  name: string
  description: string | null
  default_unit: 'ea' | 'm' | 'm2' | 'm3' | 'kg' | 'l'
  default_unit_price: number | null
  category: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MaterialInsert {
  name: string
  description?: string | null
  default_unit?: 'ea' | 'm' | 'm2' | 'm3' | 'kg' | 'l'
  default_unit_price?: number | null
  category?: string | null
}

export interface MaterialUpdate extends Partial<MaterialInsert> {
  is_active?: boolean
}

/**
 * Hook for managing materials catalog with React Query.
 * Provides CRUD operations, search, and soft-delete.
 */
export function useMaterials() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  /**
   * Fetches all active materials for the current user.
   */
  const materialsQuery = useQuery({
    queryKey: MATERIALS_KEY,
    queryFn: async (): Promise<Material[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: materials, error } = await supabase
        .from('inv_materials')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error
      return materials ?? []
    },
  })

  /**
   * Creates a query for a single material by ID.
   */
  const useMaterial = (id: string | undefined) => useQuery({
    queryKey: MATERIAL_KEY(id || ''),
    queryFn: async (): Promise<Material | null> => {
      if (!id) return null

      const { data: material, error } = await supabase
        .from('inv_materials')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }

      return material
    },
    enabled: !!id,
  })

  /**
   * Searches materials by name.
   */
  const searchByName = async (searchName: string): Promise<Material[]> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: materials, error } = await supabase
      .from('inv_materials')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .ilike('name', `%${searchName}%`)
      .order('name', { ascending: true })
      .limit(20)

    if (error) throw error
    return materials ?? []
  }

  /**
   * Creates a new material.
   */
  const createMaterialMutation = useMutation({
    mutationFn: async (data: MaterialInsert): Promise<Material> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: material, error } = await supabase
        .from('inv_materials')
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return material
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MATERIALS_KEY })
    },
  })

  /**
   * Updates an existing material.
   */
  const updateMaterialMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: MaterialUpdate }): Promise<Material> => {
      const { data: material, error } = await supabase
        .from('inv_materials')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return material
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: MATERIALS_KEY })
      queryClient.invalidateQueries({ queryKey: MATERIAL_KEY(id) })
    },
  })

  /**
   * Soft-deletes a material (sets is_active = false).
   */
  const deleteMaterialMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('inv_materials')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MATERIALS_KEY })
    },
  })

  return {
    // Queries
    materials: materialsQuery.data ?? [],
    isLoading: materialsQuery.isLoading,
    isError: materialsQuery.isError,
    error: materialsQuery.error,
    useMaterial,

    // Search
    searchByName,

    // Mutations
    createMaterial: createMaterialMutation.mutateAsync,
    updateMaterial: updateMaterialMutation.mutateAsync,
    deleteMaterial: deleteMaterialMutation.mutateAsync,

    // Mutation states
    isCreating: createMaterialMutation.isPending,
    isUpdating: updateMaterialMutation.isPending,
    isDeleting: deleteMaterialMutation.isPending,
  }
}
