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
  issue_date: string
  due_date: string
  total: number
  status: 'draft' | 'sent' | 'overdue' | 'paid' | 'cancelled'
  business_profile?: {
    trading_name: string
  }
}

interface InvoiceCardProps {
  invoice: Invoice
  onStatusChange: (invoiceId: string, status: Invoice['status']) => void
}

export function InvoiceCard({ invoice, onStatusChange }: InvoiceCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

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
      .from('inv_invoices')
      .update({
        status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('id', invoice.id)

    onStatusChange(invoice.id, 'paid')
    setIsLoading(false)
  }

  const markAsCancelled = async () => {
    setIsLoading(true)

    await supabase
      .from('inv_invoices')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', invoice.id)

    onStatusChange(invoice.id, 'cancelled')
    setShowCancelDialog(false)
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
      <Card data-testid="invoice-card" className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* Invoice Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono font-medium">{invoice.invoice_number}</span>
                <StatusBadge status={invoice.status} />
              </div>

              <p className="font-medium">{invoice.business_profile?.trading_name || 'Customer'}</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(invoice.issue_date)}
                {invoice.status === 'sent' && ` - Due ${formatDate(invoice.due_date)}`}
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
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isLoading}
                  data-testid="invoice-actions"
                >
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

                {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setShowCancelDialog(true)}
                      className="text-destructive"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Invoice
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark invoice {invoice.invoice_number} as cancelled.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Invoice</AlertDialogCancel>
            <AlertDialogAction onClick={markAsCancelled} className="bg-destructive">
              Cancel Invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
