'use client'

import { useState, useCallback, useEffect } from 'react'
import { Eye, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { InvoiceDraft } from '@/lib/openai/schemas'
import type { BusinessProfileWithSequence } from '@/types/database'
import type { Photo } from './PhotoUploader'

interface PDFPreviewDialogProps {
  invoice: InvoiceDraft
  businessProfile: BusinessProfileWithSequence | null
  photos: Photo[]
  disabled?: boolean
}

export function PDFPreviewDialog({
  invoice,
  businessProfile,
  photos,
  disabled,
}: PDFPreviewDialogProps) {
  const [open, setOpen] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generate PDF via server-side API
  const generatePreview = useCallback(async () => {
    if (!businessProfile) return

    setLoading(true)
    setError(null)

    try {
      const subtotal = invoice.line_items.reduce((sum, item) => {
        if (item.unit_price === null) return sum
        return sum + item.quantity * item.unit_price
      }, 0)

      const gstAmount = invoice.invoice.gst_enabled ? subtotal * 0.1 : 0
      const total = subtotal + gstAmount

      const response = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice: {
            invoice_number:
              invoice.invoice.invoice_number ||
              `${businessProfile.sequence?.prefix || 'INV'}-PREVIEW`,
            invoice_date: invoice.invoice.invoice_date,
            due_date: invoice.invoice.due_date,
            customer_name: invoice.customer.name,
            customer_emails: invoice.customer.emails || [],
            customer_abn: invoice.customer.abn,
            job_address: invoice.invoice.job_address,
            line_items: invoice.line_items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unit: item.unit || 'ea',
              unit_price: item.unit_price || 0,
              line_total: item.quantity * (item.unit_price || 0),
            })),
            subtotal,
            gst_amount: gstAmount,
            total,
            gst_enabled: invoice.invoice.gst_enabled,
            prices_include_gst: invoice.invoice.prices_include_gst,
            notes: invoice.notes,
          },
          businessProfile: {
            trading_name: businessProfile.trading_name,
            business_name: businessProfile.business_name,
            abn: businessProfile.abn,
            address: businessProfile.address,
            logo_url: businessProfile.logo_url,
            bank_bsb: businessProfile.bank_bsb,
            bank_account: businessProfile.bank_account,
            payid: businessProfile.payid,
            payment_link: businessProfile.payment_link,
            default_footer_note: businessProfile.default_footer_note,
          },
          photos: photos
            .filter((p) => p.url)
            .map((p) => ({ url: p.url! })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || `Server error: ${response.status}`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      // Clean up previous URL
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }

      setPdfUrl(url)
    } catch (err) {
      console.error('PDF preview error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate preview')
    } finally {
      setLoading(false)
    }
  }, [invoice, businessProfile, photos, pdfUrl])

  // Generate preview when dialog opens
  useEffect(() => {
    if (open) {
      generatePreview()
    }
    return () => {
      // Clean up blob URL when dialog closes
      if (!open && pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
        setPdfUrl(null)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!businessProfile) {
    return (
      <Button variant="outline" disabled>
        <Eye className="w-4 h-4 mr-2" />
        Preview PDF
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <Eye className="w-4 h-4 mr-2" />
          Preview PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Invoice Preview</DialogTitle>
          <DialogDescription>
            This is exactly how the PDF will look when sent to the customer.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-sm">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden rounded border relative">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Generating PDF preview...</p>
            </div>
          )}

          {pdfUrl && (
            <iframe
              src={pdfUrl}
              width="100%"
              height="100%"
              className="rounded"
              title="Invoice PDF Preview"
            />
          )}

          {!loading && !pdfUrl && !error && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Click to generate preview
            </div>
          )}
        </div>

        {/* Refresh button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={generatePreview}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Preview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
