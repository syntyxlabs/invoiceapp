# Phase 7: Invoice Dashboard

**Timeline**: Week 7
**Goal**: Invoice list and status management

---

## Tasks

| Task | Priority | Estimate |
|------|----------|----------|
| Build InvoiceList component | P0 | 4h |
| Create InvoiceCard with status badge | P0 | 3h |
| Implement status filters (Draft/Sent/Overdue/Paid/Void) | P0 | 3h |
| Add "Mark as Paid" action | P0 | 2h |
| Add "Void" action | P0 | 2h |
| Add "Resend" action | P0 | 2h |
| Implement auto-overdue status update | P0 | 3h |
| Add search functionality | P1 | 3h |
| Add sort options | P2 | 2h |

---

## Deliverable

Complete invoice management dashboard

---

## Technical Details

### 1. Dashboard Page

```typescript
// src/app/(dashboard)/page.tsx
'use client'

import { useState } from 'react'
import { InvoiceList } from '@/components/dashboard/InvoiceList'
import { InvoiceFilters } from '@/components/dashboard/InvoiceFilters'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

type StatusFilter = 'all' | 'draft' | 'sent' | 'overdue' | 'paid' | 'void'

export default function DashboardPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'customer'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Invoices</h1>
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
```

### 2. Dashboard Stats Component

```typescript
// src/components/dashboard/DashboardStats.tsx
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { FileText, Clock, AlertCircle, CheckCircle } from 'lucide-react'

interface Stats {
  draft: number
  sent: number
  overdue: number
  paid: number
  totalOutstanding: number
  totalPaid: number
}

export function DashboardStats() {
  const [stats, setStats] = useState<Stats>({
    draft: 0,
    sent: 0,
    overdue: 0,
    paid: 0,
    totalOutstanding: 0,
    totalPaid: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('status, total')

      if (invoices) {
        const draft = invoices.filter(i => i.status === 'draft').length
        const sent = invoices.filter(i => i.status === 'sent').length
        const overdue = invoices.filter(i => i.status === 'overdue').length
        const paid = invoices.filter(i => i.status === 'paid').length

        const totalOutstanding = invoices
          .filter(i => ['sent', 'overdue'].includes(i.status))
          .reduce((sum, i) => sum + Number(i.total), 0)

        const totalPaid = invoices
          .filter(i => i.status === 'paid')
          .reduce((sum, i) => sum + Number(i.total), 0)

        setStats({ draft, sent, overdue, paid, totalOutstanding, totalPaid })
      }

      setIsLoading(false)
    }

    fetchStats()
  }, [supabase])

  const statCards = [
    {
      label: 'Draft',
      value: stats.draft,
      icon: FileText,
      color: 'text-gray-500'
    },
    {
      label: 'Sent',
      value: stats.sent,
      icon: Clock,
      color: 'text-blue-500'
    },
    {
      label: 'Overdue',
      value: stats.overdue,
      icon: AlertCircle,
      color: 'text-red-500'
    },
    {
      label: 'Paid',
      value: stats.paid,
      icon: CheckCircle,
      color: 'text-green-500'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Outstanding Amount */}
      <Card className="col-span-2">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Outstanding</p>
          <p className="text-2xl font-bold text-amber-600">
            ${stats.totalOutstanding.toFixed(2)}
          </p>
        </CardContent>
      </Card>

      {/* Paid Amount */}
      <Card className="col-span-2">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Paid (all time)</p>
          <p className="text-2xl font-bold text-green-600">
            ${stats.totalPaid.toFixed(2)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 3. Invoice Filters Component

```typescript
// src/components/dashboard/InvoiceFilters.tsx
'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, ArrowUpDown } from 'lucide-react'

type StatusFilter = 'all' | 'draft' | 'sent' | 'overdue' | 'paid' | 'void'

interface InvoiceFiltersProps {
  statusFilter: StatusFilter
  onStatusChange: (status: StatusFilter) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  sortBy: 'date' | 'amount' | 'customer'
  onSortByChange: (sort: 'date' | 'amount' | 'customer') => void
  sortOrder: 'asc' | 'desc'
  onSortOrderChange: (order: 'asc' | 'desc') => void
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All Invoices' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'paid', label: 'Paid' },
  { value: 'void', label: 'Void' },
]

export function InvoiceFilters({
  statusFilter,
  onStatusChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange
}: InvoiceFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search invoices..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Status Filter */}
      <Select value={statusFilter} onValueChange={(v) => onStatusChange(v as StatusFilter)}>
        <SelectTrigger className="w-full md:w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort */}
      <Select value={sortBy} onValueChange={(v) => onSortByChange(v as any)}>
        <SelectTrigger className="w-full md:w-32">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="date">Date</SelectItem>
          <SelectItem value="amount">Amount</SelectItem>
          <SelectItem value="customer">Customer</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort Order Toggle */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
      >
        <ArrowUpDown className={`h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
      </Button>
    </div>
  )
}
```

### 4. Invoice List Component

```typescript
// src/components/dashboard/InvoiceList.tsx
'use client'

import { useEffect, useState } from 'react'
import { InvoiceCard } from './InvoiceCard'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

interface Invoice {
  id: string
  invoice_number: string
  customer_name: string
  customer_emails: string[]
  invoice_date: string
  due_date: string
  total: number
  status: 'draft' | 'sent' | 'overdue' | 'paid' | 'void'
  sent_at: string | null
  business_profile: {
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

  const supabase = createClient()

  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true)

      let query = supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          customer_name,
          customer_emails,
          invoice_date,
          due_date,
          total,
          status,
          sent_at,
          business_profile:business_profiles(trading_name)
        `)

      // Status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      // Search filter
      if (searchQuery) {
        query = query.or(`customer_name.ilike.%${searchQuery}%,invoice_number.ilike.%${searchQuery}%`)
      }

      // Sort
      const sortColumn = sortBy === 'date'
        ? 'invoice_date'
        : sortBy === 'amount'
          ? 'total'
          : 'customer_name'

      query = query.order(sortColumn, { ascending: sortOrder === 'asc' })

      const { data, error } = await query

      if (!error && data) {
        setInvoices(data as Invoice[])
      }

      setIsLoading(false)
    }

    fetchInvoices()
  }, [statusFilter, searchQuery, sortBy, sortOrder, supabase])

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
```

### 5. Invoice Card Component

```typescript
// src/components/dashboard/InvoiceCard.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from './StatusBadge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MoreHorizontal, Eye, Edit, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Invoice {
  id: string
  invoice_number: string
  customer_name: string
  customer_emails: string[]
  invoice_date: string
  due_date: string
  total: number
  status: 'draft' | 'sent' | 'overdue' | 'paid' | 'void'
  sent_at: string | null
}

interface InvoiceCardProps {
  invoice: Invoice
  onStatusChange: (invoiceId: string, status: Invoice['status']) => void
}

export function InvoiceCard({ invoice, onStatusChange }: InvoiceCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showVoidDialog, setShowVoidDialog] = useState(false)

  const supabase = createClient()

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const markAsPaid = async () => {
    setIsLoading(true)

    await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', invoice.id)

    onStatusChange(invoice.id, 'paid')
    setIsLoading(false)
  }

  const markAsVoid = async () => {
    setIsLoading(true)

    await supabase
      .from('invoices')
      .update({
        status: 'void',
        voided_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', invoice.id)

    // Cancel any pending reminders
    await supabase
      .from('payment_reminders')
      .update({ status: 'cancelled' })
      .eq('invoice_id', invoice.id)
      .eq('status', 'pending')

    onStatusChange(invoice.id, 'void')
    setShowVoidDialog(false)
    setIsLoading(false)
  }

  const resendInvoice = async () => {
    setIsLoading(true)

    await fetch('/api/email/send-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId: invoice.id })
    })

    setIsLoading(false)
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* Invoice Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono font-medium">{invoice.invoice_number}</span>
                <StatusBadge status={invoice.status} />
              </div>

              <p className="font-medium">{invoice.customer_name}</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(invoice.invoice_date)}
                {invoice.status === 'sent' && ` • Due ${formatDate(invoice.due_date)}`}
              </p>
            </div>

            {/* Amount */}
            <div className="text-right mr-4">
              <p className="text-xl font-bold">${Number(invoice.total).toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">AUD</p>
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoreHorizontal className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/invoices/${invoice.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Link>
                </DropdownMenuItem>

                {invoice.status === 'draft' && (
                  <DropdownMenuItem asChild>
                    <Link href={`/invoices/${invoice.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                )}

                {['sent', 'overdue'].includes(invoice.status) && (
                  <>
                    <DropdownMenuItem onClick={resendInvoice}>
                      <Send className="h-4 w-4 mr-2" />
                      Resend
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={markAsPaid}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Paid
                    </DropdownMenuItem>
                  </>
                )}

                {invoice.status !== 'void' && invoice.status !== 'paid' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setShowVoidDialog(true)}
                      className="text-destructive"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Void Invoice
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Void Confirmation Dialog */}
      <AlertDialog open={showVoidDialog} onOpenChange={setShowVoidDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark invoice {invoice.invoice_number} as void.
              Any pending reminders will be cancelled.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={markAsVoid} className="bg-destructive">
              Void Invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
```

### 6. Status Badge Component

```typescript
// src/components/dashboard/StatusBadge.tsx
import { cn } from '@/lib/utils'

type Status = 'draft' | 'sent' | 'overdue' | 'paid' | 'void'

interface StatusBadgeProps {
  status: Status
  className?: string
}

const STATUS_STYLES: Record<Status, { bg: string; text: string; label: string }> = {
  draft: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    label: 'Draft'
  },
  sent: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    label: 'Sent'
  },
  overdue: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    label: 'Overdue'
  },
  paid: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    label: 'Paid'
  },
  void: {
    bg: 'bg-gray-100',
    text: 'text-gray-500',
    label: 'Void'
  }
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles = STATUS_STYLES[status]

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        styles.bg,
        styles.text,
        className
      )}
    >
      {styles.label}
    </span>
  )
}
```

### 7. Auto-Overdue Status Update

```sql
-- Supabase Edge Function or pg_cron job

-- Option 1: pg_cron (run daily at midnight)
SELECT cron.schedule(
  'update-overdue-invoices',
  '0 0 * * *',  -- Every day at midnight
  $$
    UPDATE public.invoices
    SET
      status = 'overdue',
      updated_at = NOW()
    WHERE status = 'sent'
    AND due_date < CURRENT_DATE;
  $$
);

-- Option 2: Call on dashboard load via API
```

```typescript
// src/app/api/invoices/update-overdue/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()

  const { error } = await supabase.rpc('update_overdue_invoices')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

---

## File Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── page.tsx
│   └── api/
│       └── invoices/
│           └── update-overdue/
│               └── route.ts
└── components/
    └── dashboard/
        ├── DashboardStats.tsx
        ├── InvoiceFilters.tsx
        ├── InvoiceList.tsx
        ├── InvoiceCard.tsx
        └── StatusBadge.tsx
```

---

## Test Specifications

### Integration Tests

```typescript
// src/components/dashboard/__tests__/DashboardStats.test.tsx
describe('DashboardStats', () => {
  it('fetches and displays invoice counts by status')
  it('displays total outstanding amount')
  it('displays total paid amount')
  it('shows loading state during fetch')
  it('handles empty invoice list')
  it('formats currency correctly')
})

// src/components/dashboard/__tests__/InvoiceFilters.test.tsx
describe('InvoiceFilters', () => {
  it('renders search input')
  it('calls onSearchChange when typing')
  it('debounces search input')
  it('renders status dropdown with all options')
  it('calls onStatusChange when selecting status')
  it('toggles sort order on button click')
  it('shows current sort direction indicator')
})

// src/components/dashboard/__tests__/InvoiceList.test.tsx
describe('InvoiceList', () => {
  it('fetches invoices with filters applied')
  it('displays invoice cards')
  it('shows empty state when no invoices')
  it('shows filtered empty state with clear message')
  it('shows loading skeleton during fetch')
  it('updates list when invoice status changes')
  it('refetches when filters change')
})

// src/components/dashboard/__tests__/InvoiceCard.test.tsx
describe('InvoiceCard', () => {
  it('displays invoice number and status badge')
  it('displays customer name and amount')
  it('displays due date for sent invoices')
  it('shows actions dropdown menu')
  it('shows View option for all statuses')
  it('shows Edit option only for draft')
  it('marks invoice as paid and calls callback')
  it('shows void confirmation dialog')
  it('voids invoice and cancels reminders')
  it('triggers resend API call')
  it('shows loading state during actions')
})

// src/components/dashboard/__tests__/StatusBadge.test.tsx
describe('StatusBadge', () => {
  it.each(['draft', 'sent', 'overdue', 'paid', 'void'])(
    'renders correct style for %s status',
    (status) => {
      // Test each status has correct colors
    }
  )
})
```

### E2E Tests

```typescript
// e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Invoice Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to dashboard
    await page.goto('/login')
    // Login steps...
    await page.goto('/dashboard')
  })

  test('dashboard shows stats cards', async ({ page }) => {
    await expect(page.locator('text=Draft')).toBeVisible()
    await expect(page.locator('text=Sent')).toBeVisible()
    await expect(page.locator('text=Overdue')).toBeVisible()
    await expect(page.locator('text=Paid')).toBeVisible()
    await expect(page.locator('text=Outstanding')).toBeVisible()
  })

  test('filtering by status works', async ({ page }) => {
    await page.selectOption('[data-testid="status-filter"]', 'sent')
    const cards = page.locator('[data-testid="invoice-card"]')
    // All visible cards should have "Sent" status
    for (const card of await cards.all()) {
      await expect(card.locator('[data-testid="status-badge"]')).toHaveText('Sent')
    }
  })

  test('search filters by customer name', async ({ page }) => {
    await page.fill('[placeholder="Search invoices..."]', 'Smith')
    await page.waitForTimeout(500) // Debounce
    const cards = page.locator('[data-testid="invoice-card"]')
    for (const card of await cards.all()) {
      await expect(card).toContainText('Smith')
    }
  })

  test('user can mark invoice as paid', async ({ page }) => {
    await page.click('[data-testid="invoice-actions"]:first-child')
    await page.click('text=Mark as Paid')
    await expect(page.locator('[data-testid="status-badge"]:first-child')).toHaveText('Paid')
  })

  test('user can void invoice with confirmation', async ({ page }) => {
    await page.click('[data-testid="invoice-actions"]:first-child')
    await page.click('text=Void Invoice')
    await expect(page.locator('[role="alertdialog"]')).toBeVisible()
    await page.click('button:has-text("Void Invoice")')
    await expect(page.locator('[data-testid="status-badge"]:first-child')).toHaveText('Void')
  })
})
```

---

## Acceptance Criteria

### Functional Requirements
- [ ] Dashboard shows stats: Draft, Sent, Overdue, Paid counts
- [ ] Dashboard shows total outstanding and paid amounts
- [ ] Invoice list displays all invoices
- [ ] Status filter works correctly
- [ ] Search filters by customer name and invoice number
- [ ] Sort by date, amount, customer works
- [ ] Sort order toggle works
- [ ] Status badges display correct colors
- [ ] "Mark as Paid" updates status and records timestamp
- [ ] "Void" updates status and cancels pending reminders
- [ ] "Resend" sends email again
- [ ] "View" navigates to invoice detail page
- [ ] "Edit" navigates to edit page (draft only)
- [ ] Overdue invoices auto-update daily
- [ ] Empty states display appropriate messages
- [ ] Loading states show during data fetch

### Testing Requirements
- [ ] DashboardStats component tests pass
- [ ] InvoiceFilters component tests pass
- [ ] InvoiceList component tests pass
- [ ] InvoiceCard action tests pass
- [ ] StatusBadge style tests pass
- [ ] E2E dashboard flow passes
