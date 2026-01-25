'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Eye, Loader2, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { InvoiceDraft } from '@/lib/openai/schemas'
import type { BusinessProfileWithSequence } from '@/types/database'
import type { Photo } from './PhotoUploader'

// Dynamic imports for client-side only PDF components
const PDFViewer = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    ),
  }
)

const InvoicePDFComponent = dynamic(
  () => import('@/lib/pdf/invoice-template').then((mod) => mod.InvoicePDF),
  { ssr: false }
)

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
  const [imageErrors, setImageErrors] = useState<string[]>([])

  // Transform InvoiceDraft to InvoicePDFProps format
  const pdfData = useMemo(() => {
    if (!businessProfile) return null

    const subtotal = invoice.line_items.reduce((sum, item) => {
      if (item.unit_price === null) return sum
      return sum + item.quantity * item.unit_price
    }, 0)

    const gstAmount = invoice.invoice.gst_enabled ? subtotal * 0.1 : 0
    const total = subtotal + gstAmount

    return {
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
      // For client-side preview, use the photo URLs directly
      // The signed URLs should work in the browser
      photos: photos
        .filter((p) => p.url)
        .map((p) => ({ url: p.url! })),
    }
  }, [invoice, businessProfile, photos])

  // Debug info for logo
  const logoDebugInfo = useMemo(() => {
    if (!businessProfile) return null
    return {
      hasLogoUrl: !!businessProfile.logo_url,
      logoUrl: businessProfile.logo_url,
      logoUrlLength: businessProfile.logo_url?.length || 0,
    }
  }, [businessProfile])

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
          <DialogTitle className="flex items-center justify-between">
            <span>Invoice Preview</span>
          </DialogTitle>
        </DialogHeader>

        {/* Debug info for logo */}
        {logoDebugInfo && (
          <div className="text-xs bg-muted p-2 rounded space-y-1">
            <div className="font-medium">Debug Info:</div>
            <div>
              Logo URL:{' '}
              {logoDebugInfo.hasLogoUrl ? (
                <span className="text-green-600">Present ({logoDebugInfo.logoUrlLength} chars)</span>
              ) : (
                <span className="text-red-600">Missing</span>
              )}
            </div>
            {logoDebugInfo.logoUrl && (
              <div className="truncate text-muted-foreground">
                URL: {logoDebugInfo.logoUrl.substring(0, 80)}...
              </div>
            )}
            <div>
              Photos: {photos.length} uploaded, {photos.filter(p => p.url).length} with URLs
            </div>
          </div>
        )}

        {imageErrors.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded p-2 text-sm">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="w-4 h-4" />
              <span>Some images may not load in preview due to CORS restrictions</span>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden rounded border">
          {pdfData && (
            <PDFViewer
              width="100%"
              height="100%"
              showToolbar={true}
              className="rounded"
            >
              <InvoicePDFComponent
                invoice={pdfData.invoice}
                businessProfile={pdfData.businessProfile}
                photos={pdfData.photos}
              />
            </PDFViewer>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
