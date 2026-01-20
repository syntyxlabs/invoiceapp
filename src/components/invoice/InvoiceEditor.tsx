'use client'

import { useState, useMemo } from 'react'
import { CustomerHeader } from './CustomerHeader'
import { LineItemTable } from './LineItemTable'
import { InvoiceTotals } from './InvoiceTotals'
import { CorrectionInput } from './CorrectionInput'
import { PhotoUploader, type Photo } from './PhotoUploader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { InvoiceDraft } from '@/lib/openai/schemas'

interface InvoiceEditorProps {
  initialDraft: InvoiceDraft
  draftId: string
  photos: Photo[]
  onPhotosChange: (photos: Photo[]) => void
  onSave: (invoice: InvoiceDraft) => void
  onSend: (invoice: InvoiceDraft) => void
}

export function InvoiceEditor({ initialDraft, draftId, photos, onPhotosChange, onSave, onSend }: InvoiceEditorProps) {
  const [invoice, setInvoice] = useState<InvoiceDraft>(initialDraft)
  const [changeSummary, setChangeSummary] = useState<string[]>([])
  const [isDirty, setIsDirty] = useState(false)

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = invoice.line_items.reduce((sum, item) => {
      if (item.unit_price === null) return sum
      return sum + (item.quantity * item.unit_price)
    }, 0)

    const gstAmount = invoice.invoice.gst_enabled ? subtotal * 0.10 : 0
    const total = subtotal + gstAmount

    return { subtotal, gstAmount, total }
  }, [invoice.line_items, invoice.invoice.gst_enabled])

  // Check for missing prices
  const hasMissingPrices = invoice.line_items.some(item => item.unit_price === null)

  const updateCustomer = (customer: InvoiceDraft['customer']) => {
    setInvoice(prev => ({ ...prev, customer }))
    setIsDirty(true)
  }

  const updateInvoiceDetails = (details: Partial<InvoiceDraft['invoice']>) => {
    setInvoice(prev => ({
      ...prev,
      invoice: { ...prev.invoice, ...details }
    }))
    setIsDirty(true)
  }

  const updateLineItems = (lineItems: InvoiceDraft['line_items']) => {
    setInvoice(prev => ({ ...prev, line_items: lineItems }))
    setIsDirty(true)
  }

  const handleCorrectionApplied = (updated: InvoiceDraft, summary: string[]) => {
    setInvoice(updated)
    setChangeSummary(summary)
    setIsDirty(true)

    // Clear summary after 5 seconds
    setTimeout(() => setChangeSummary([]), 5000)
  }

  const handleSave = () => {
    onSave(invoice)
    setIsDirty(false)
  }

  const handleSend = () => {
    if (hasMissingPrices) {
      alert('Please fill in all prices before sending.')
      return
    }
    onSend(invoice)
  }

  return (
    <div className="space-y-6">
      {/* Change Summary Toast */}
      {changeSummary.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm font-medium text-green-800">Changes applied:</p>
          <ul className="text-sm text-green-700 mt-1">
            {changeSummary.map((change, i) => (
              <li key={i}>• {change}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Customer Header */}
      <Card>
        <CardContent className="pt-6">
          <CustomerHeader
            customer={invoice.customer}
            invoiceDetails={invoice.invoice}
            onChange={updateCustomer}
            onDetailsChange={updateInvoiceDetails}
          />
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardContent className="pt-6">
          <LineItemTable
            items={invoice.line_items}
            onChange={updateLineItems}
          />
        </CardContent>
      </Card>

      {/* GST Toggle & Totals */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4 mb-4">
            <div className="flex items-center gap-2">
              <Switch
                id="gst"
                data-testid="gst-toggle"
                checked={invoice.invoice.gst_enabled}
                onCheckedChange={(checked) =>
                  updateInvoiceDetails({ gst_enabled: checked })
                }
              />
              <Label htmlFor="gst">Include GST (10%)</Label>
            </div>

            {invoice.invoice.gst_enabled && (
              <div className="flex items-center gap-4 ml-6 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gst-pricing"
                    checked={!invoice.invoice.prices_include_gst}
                    onChange={() => updateInvoiceDetails({ prices_include_gst: false })}
                    className="accent-primary"
                  />
                  <span>Prices exclude GST</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gst-pricing"
                    checked={invoice.invoice.prices_include_gst === true}
                    onChange={() => updateInvoiceDetails({ prices_include_gst: true })}
                    className="accent-primary"
                  />
                  <span>Prices include GST</span>
                </label>
              </div>
            )}
          </div>

          <InvoiceTotals
            subtotal={totals.subtotal}
            gstAmount={totals.gstAmount}
            total={totals.total}
            gstEnabled={invoice.invoice.gst_enabled}
            pricesIncludeGst={invoice.invoice.prices_include_gst}
          />
        </CardContent>
      </Card>

      {/* AI Correction Input */}
      <Card>
        <CardContent className="pt-6">
          <CorrectionInput
            currentInvoice={invoice}
            onCorrectionApplied={handleCorrectionApplied}
          />
        </CardContent>
      </Card>

      {/* Photo Attachments */}
      <Card>
        <CardContent className="pt-6">
          <PhotoUploader
            draftId={draftId}
            photos={photos}
            onChange={onPhotosChange}
          />
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardContent className="pt-6">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            className="mt-2"
            rows={3}
            value={invoice.notes || ''}
            onChange={(e) => {
              setInvoice(prev => ({
                ...prev,
                notes: e.target.value || null
              }))
              setIsDirty(true)
            }}
            placeholder="Payment terms, thank you message, etc."
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={handleSave}
          disabled={!isDirty}
          className="flex-1"
        >
          Save Draft
        </Button>
        <Button
          onClick={handleSend}
          disabled={hasMissingPrices}
          className="flex-1"
        >
          Send Invoice
        </Button>
      </div>

      {hasMissingPrices && (
        <p className="text-sm text-amber-600 text-center">
          Some line items are missing prices. Please fill them in before sending.
        </p>
      )}
    </div>
  )
}
