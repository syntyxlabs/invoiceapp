'use client'

import { useEffect, useState, useCallback } from 'react'
import { InvoiceCard } from './InvoiceCard'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PAGE_SIZE = 10

interface Invoice {
  id: string
  invoice_number: string
  invoice_date: string
  due_date: string
  total: number
  status: 'draft' | 'sent' | 'overdue' | 'paid' | 'void'
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
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  const fetchInvoices = useCallback(async (offset: number = 0, append: boolean = false) => {
    if (append) {
      setIsLoadingMore(true)
    } else {
      setIsLoading(true)
    }

    const supabase = createClient()

    let query = supabase
      .from('inv_invoices')
      .select(`
        id,
        invoice_number,
        invoice_date,
        due_date,
        total,
        status,
        business_profile:inv_business_profiles(trading_name)
      `)

    // Status filter
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter as 'draft' | 'sent' | 'overdue' | 'paid' | 'void')
    }

    // Search filter
    if (searchQuery) {
      query = query.or(`invoice_number.ilike.%${searchQuery}%`)
    }

    // Sort
    const sortColumn = sortBy === 'date'
      ? 'invoice_date'
      : sortBy === 'amount'
        ? 'total'
        : 'invoice_number'

    query = query
      .order(sortColumn, { ascending: sortOrder === 'asc' })
      .range(offset, offset + PAGE_SIZE - 1)

    const { data, error } = await query

    if (!error && data) {
      const newInvoices = data as Invoice[]
      setHasMore(newInvoices.length === PAGE_SIZE)

      if (append) {
        setInvoices(prev => [...prev, ...newInvoices])
      } else {
        setInvoices(newInvoices)
      }
    }

    setIsLoading(false)
    setIsLoadingMore(false)
  }, [statusFilter, searchQuery, sortBy, sortOrder])

  useEffect(() => {
    fetchInvoices(0, false)
  }, [fetchInvoices])

  const handleLoadMore = () => {
    fetchInvoices(invoices.length, true)
  }

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

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
