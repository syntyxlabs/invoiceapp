'use client'

import { useState } from 'react'
import { DashboardStats, InvoiceList, InvoiceFilters } from '@/components/dashboard'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

type StatusFilter = 'all' | 'draft' | 'sent' | 'overdue' | 'paid' | 'cancelled'

export default function DashboardPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'customer'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Manage and track your invoices
          </p>
        </div>
        <Button asChild>
          <Link href="/invoices/new">
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <DashboardStats />

      {/* Filters */}
      <InvoiceFilters
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
      />

      {/* Invoice List */}
      <InvoiceList
        statusFilter={statusFilter}
        searchQuery={searchQuery}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </div>
  )
}
