export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      inv_business_profiles: {
        Row: {
          id: string
          user_id: string
          trading_name: string
          business_name: string | null
          abn: string | null
          address: string | null
          gst_registered: boolean
          default_hourly_rate: number | null
          bank_bsb: string | null
          bank_account: string | null
          payid: string | null
          payment_link: string | null
          default_footer_note: string | null
          is_default: boolean
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          trading_name: string
          business_name?: string | null
          abn?: string | null
          address?: string | null
          gst_registered?: boolean
          default_hourly_rate?: number | null
          bank_bsb?: string | null
          bank_account?: string | null
          payid?: string | null
          payment_link?: string | null
          default_footer_note?: string | null
          is_default?: boolean
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          trading_name?: string
          business_name?: string | null
          abn?: string | null
          address?: string | null
          gst_registered?: boolean
          default_hourly_rate?: number | null
          bank_bsb?: string | null
          bank_account?: string | null
          payid?: string | null
          payment_link?: string | null
          default_footer_note?: string | null
          is_default?: boolean
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'inv_business_profiles_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      inv_sequences: {
        Row: {
          id: string
          business_profile_id: string
          prefix: string
          next_number: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_profile_id: string
          prefix?: string
          next_number?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_profile_id?: string
          prefix?: string
          next_number?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'inv_sequences_business_profile_id_fkey'
            columns: ['business_profile_id']
            isOneToOne: true
            referencedRelation: 'inv_business_profiles'
            referencedColumns: ['id']
          }
        ]
      }
      inv_invoices: {
        Row: {
          id: string
          user_id: string
          business_profile_id: string | null
          customer_id: string | null
          invoice_number: string
          status: 'draft' | 'sent' | 'paid' | 'overdue' | 'void'
          invoice_date: string
          due_date: string
          subtotal: number
          gst_amount: number
          total: number
          gst_enabled: boolean
          notes: string | null
          job_address: string | null
          customer_name: string
          customer_emails: string[]
          original_voice_transcript: string | null
          ai_draft_json: Record<string, unknown> | null
          sent_at: string | null
          paid_at: string | null
          voided_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_profile_id?: string | null
          customer_id?: string | null
          invoice_number: string
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'void'
          invoice_date?: string
          due_date: string
          subtotal?: number
          gst_amount?: number
          total?: number
          gst_enabled?: boolean
          notes?: string | null
          job_address?: string | null
          customer_name: string
          customer_emails: string[]
          original_voice_transcript?: string | null
          ai_draft_json?: Record<string, unknown> | null
          sent_at?: string | null
          paid_at?: string | null
          voided_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_profile_id?: string | null
          customer_id?: string | null
          invoice_number?: string
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'void'
          invoice_date?: string
          due_date?: string
          subtotal?: number
          gst_amount?: number
          total?: number
          gst_enabled?: boolean
          notes?: string | null
          job_address?: string | null
          customer_name?: string
          customer_emails?: string[]
          original_voice_transcript?: string | null
          ai_draft_json?: Record<string, unknown> | null
          sent_at?: string | null
          paid_at?: string | null
          voided_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'inv_invoices_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'inv_invoices_business_profile_id_fkey'
            columns: ['business_profile_id']
            isOneToOne: false
            referencedRelation: 'inv_business_profiles'
            referencedColumns: ['id']
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      businesses: {
        Row: {
          id: string
          user_id: string
          business_name: string
          abn: string | null
          phone: string | null
          email: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          state: string | null
          postcode: string | null
          country: string
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_name: string
          abn?: string | null
          phone?: string | null
          email?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          postcode?: string | null
          country?: string
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_name?: string
          abn?: string | null
          phone?: string | null
          email?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          postcode?: string | null
          country?: string
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'businesses_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      clients: {
        Row: {
          id: string
          user_id: string
          business_id: string | null
          name: string
          email: string | null
          phone: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          state: string | null
          postcode: string | null
          country: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_id?: string | null
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
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_id?: string | null
          name?: string
          email?: string | null
          phone?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          postcode?: string | null
          country?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'clients_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'clients_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          }
        ]
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          business_id: string | null
          client_id: string | null
          invoice_number: string
          status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          issue_date: string
          due_date: string
          subtotal: number
          tax_rate: number
          tax_amount: number
          total: number
          notes: string | null
          terms: string | null
          voice_transcript: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_id?: string | null
          client_id?: string | null
          invoice_number: string
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          issue_date?: string
          due_date: string
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          total?: number
          notes?: string | null
          terms?: string | null
          voice_transcript?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_id?: string | null
          client_id?: string | null
          invoice_number?: string
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          issue_date?: string
          due_date?: string
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          total?: number
          notes?: string | null
          terms?: string | null
          voice_transcript?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'invoices_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'invoices_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'invoices_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          }
        ]
      }
      inv_line_items: {
        Row: {
          id: string
          invoice_id: string
          description: string
          quantity: number
          unit: string | null
          unit_price: number
          line_total: number
          sort_order: number
          item_type: 'labour' | 'material'
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          description: string
          quantity?: number
          unit?: string | null
          unit_price: number
          line_total: number
          sort_order?: number
          item_type?: 'labour' | 'material'
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          description?: string
          quantity?: number
          unit?: string | null
          unit_price?: number
          line_total?: number
          sort_order?: number
          item_type?: 'labour' | 'material'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'inv_line_items_invoice_id_fkey'
            columns: ['invoice_id']
            isOneToOne: false
            referencedRelation: 'inv_invoices'
            referencedColumns: ['id']
          }
        ]
      }
      inv_customers: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          name: string
          emails?: string[] | null
          phone?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          emails?: string[] | null
          phone?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'inv_customers_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'inv_users'
            referencedColumns: ['id']
          }
        ]
      }
      inv_materials: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          default_unit?: 'ea' | 'm' | 'm2' | 'm3' | 'kg' | 'l'
          default_unit_price?: number | null
          category?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          default_unit?: 'ea' | 'm' | 'm2' | 'm3' | 'kg' | 'l'
          default_unit_price?: number | null
          category?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'inv_materials_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'inv_users'
            referencedColumns: ['id']
          }
        ]
      }
      inv_photos: {
        Row: {
          id: string
          invoice_id: string
          storage_path: string
          filename: string | null
          mime_type: string | null
          size_bytes: number | null
          sort_order: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          invoice_id: string
          storage_path: string
          filename?: string | null
          mime_type?: string | null
          size_bytes?: number | null
          sort_order?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          invoice_id?: string
          storage_path?: string
          filename?: string | null
          mime_type?: string | null
          size_bytes?: number | null
          sort_order?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'inv_photos_invoice_id_fkey'
            columns: ['invoice_id']
            isOneToOne: false
            referencedRelation: 'inv_invoices'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      invoice_status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier use
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific table types for convenience
export type Profile = Tables<'profiles'>
export type Business = Tables<'businesses'>
export type Client = Tables<'clients'>
export type Invoice = Tables<'invoices'>
export type InvoiceItem = Tables<'inv_line_items'>

// Business profile types (inv_ prefixed tables)
export type BusinessProfile = Tables<'inv_business_profiles'>
export type BusinessProfileInsert = InsertTables<'inv_business_profiles'>
export type BusinessProfileUpdate = UpdateTables<'inv_business_profiles'>
export type InvoiceSequence = Tables<'inv_sequences'>
export type InvoiceSequenceInsert = InsertTables<'inv_sequences'>
export type InvoiceSequenceUpdate = UpdateTables<'inv_sequences'>

// Composite type for profile with sequence
export interface BusinessProfileWithSequence extends BusinessProfile {
  sequence?: InvoiceSequence | null
}

export type InvoiceStatus = Database['public']['Enums']['invoice_status']

// Photo types
export type InvoicePhoto = Tables<'inv_photos'>
export type InvoicePhotoInsert = InsertTables<'inv_photos'>
export type InvoicePhotoUpdate = UpdateTables<'inv_photos'>

// Material types
export type Material = Tables<'inv_materials'>
export type MaterialInsert = InsertTables<'inv_materials'>
export type MaterialUpdate = UpdateTables<'inv_materials'>
