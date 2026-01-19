'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useInvoiceDraftStore } from '@/stores/invoice-draft-store'

export default function EditInvoicePage() {
  const router = useRouter()
  const { draft, originalTranscript, clearDraft } = useInvoiceDraftStore()

  // Redirect to new invoice page if no draft exists
  useEffect(() => {
    if (!draft) {
      // Small delay to allow hydration
      const timer = setTimeout(() => {
        if (!useInvoiceDraftStore.getState().draft) {
          router.push('/invoices/new')
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [draft, router])

  if (!draft) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/invoices/new">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Invoice</h1>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <AlertCircle className="w-12 h-12 text-muted-foreground" />
            <p className="text-muted-foreground text-center">
              No invoice draft found. Please create one first.
            </p>
            <Link href="/invoices/new">
              <Button>Create New Invoice</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/invoices/new">
          <Button variant="ghost" size="icon" onClick={() => clearDraft()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Invoice Draft</h1>
          <p className="text-muted-foreground">
            Review and edit the generated invoice
          </p>
        </div>
      </div>

      {originalTranscript && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Original Input
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{originalTranscript}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Customer</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium">{draft.customer.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email(s)</dt>
              <dd className="font-medium">
                {draft.customer.emails.length > 0
                  ? draft.customer.emails.join(', ')
                  : '(not provided)'}
              </dd>
            </div>
            {draft.customer.address && (
              <div>
                <dt className="text-muted-foreground">Address</dt>
                <dd className="font-medium">{draft.customer.address}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Invoice Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Invoice Date</dt>
              <dd className="font-medium">{draft.invoice.invoice_date}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Due Date</dt>
              <dd className="font-medium">{draft.invoice.due_date}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">GST Enabled</dt>
              <dd className="font-medium">{draft.invoice.gst_enabled ? 'Yes' : 'No'}</dd>
            </div>
            {draft.invoice.job_address && (
              <div>
                <dt className="text-muted-foreground">Job Address</dt>
                <dd className="font-medium">{draft.invoice.job_address}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          {draft.line_items.length > 0 ? (
            <div className="space-y-4">
              {draft.line_items.map((item, index) => (
                <div key={index} className="p-4 bg-muted rounded-lg">
                  <p className="font-medium">{item.description}</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>Qty: {item.quantity} {item.unit}</span>
                    <span>
                      Price: {item.unit_price !== null
                        ? `$${item.unit_price.toFixed(2)}`
                        : '(not specified)'}
                    </span>
                    {item.unit_price !== null && (
                      <span className="font-medium text-foreground">
                        Total: ${(item.quantity * item.unit_price).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No line items</p>
          )}
        </CardContent>
      </Card>

      {draft.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{draft.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Raw JSON (Debug)</CardTitle>
          <CardDescription>
            This is the raw draft data. Phase 4 will build a full editor interface.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
            {JSON.stringify(draft, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Link href="/invoices/new" className="flex-1">
          <Button variant="outline" className="w-full" onClick={() => clearDraft()}>
            Start Over
          </Button>
        </Link>
        <Button className="flex-1" disabled>
          Save Invoice (Coming in Phase 4)
        </Button>
      </div>
    </div>
  )
}
