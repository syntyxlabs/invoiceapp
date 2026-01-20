'use client'

import { useEffect, useState } from 'react'
import { InvoiceCard } from './InvoiceCard'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

interface Invoice {
  id: string
  invoice_number: string
  issue_date: string
  due_date: string
  total: number
  status: 'draft' | 'sent' | 'overdue' | 'paid' | 'cancelled'
  business_profile?: {
    trading_name: string
  }
}

interface InvoiceListProps {
  statusFilter: string
  searchQuery: string
  sortBy: 'date' | 'amount' | 'customer'
  sortOrder: 'asc' | 'desc'
}

export function InvoiceList({
  statusFilter,
  searchQuery,
  sortBy,
  sortOrder
}: InvoiceListProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const fetchInvoices = async () => {
      setIsLoading(true)

      let query = supabase
        .from('inv_invoices')
        .select(`
          id,
          invoice_number,
          issue_date,
          due_date,
          total,
          status,
          business_profile:inv_business_profiles(trading_name)
        `)

      // Status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'draft' | 'sent' | 'overdue' | 'paid' | 'cancelled')
      }

      // Search filter
      if (searchQuery) {
        query = query.or(`invoice_number.ilike.%${searchQuery}%`)
      }

      // Sort
      const sortColumn = sortBy === 'date'
        ? 'issue_date'
        : sortBy === 'amount'
          ? 'total'
          : 'invoice_number'

      query = query.order(sortColumn, { ascending: sortOrder === 'asc' })

      const { data, error } = await query

      if (!error && data) {
        setInvoices(data as Invoice[])
      }

      setIsLoading(false)
    }

    fetchInvoices()
  }, [statusFilter, searchQuery, sortBy, sortOrder])

  const handleStatusChange = (invoiceId: string, newStatus: Invoice['status']) => {
    setInvoices(prev =>
      prev.map(inv =>
        inv.id === invoiceId ? { ...inv, status: newStatus } : inv
      )
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {searchQuery || statusFilter !== 'all'
            ? 'No invoices match your filters.'
            : 'No invoices yet. Create your first invoice!'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {invoices.map((invoice) => (
        <InvoiceCard
          key={invoice.id}
          invoice={invoice}
          onStatusChange={handleStatusChange}
        />
      ))}
    </div>
  )
}
