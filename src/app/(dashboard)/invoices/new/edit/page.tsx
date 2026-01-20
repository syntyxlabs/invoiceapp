'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InvoiceEditor } from '@/components/invoice/InvoiceEditor'
import { SendConfirmationDialog } from '@/components/invoice/SendConfirmationDialog'
import { useInvoiceDraftStore } from '@/stores/invoice-draft-store'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import type { InvoiceDraft } from '@/lib/openai/schemas'

export default function EditInvoicePage() {
  const router = useRouter()
  const { draft, draftId, photos, originalTranscript, clearDraft, setPhotos } = useInvoiceDraftStore()
  const { profiles } = useBusinessProfile()

  const [showSendDialog, setShowSendDialog] = useState(false)
  const [invoiceToSend, setInvoiceToSend] = useState<InvoiceDraft | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Get the default business profile
  const defaultProfile = profiles.find(p => p.is_default) || profiles[0]

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

  // Calculate totals for send dialog
  const totals = useMemo(() => {
    if (!invoiceToSend) return { subtotal: 0, gstAmount: 0, total: 0 }

    const subtotal = invoiceToSend.line_items.reduce((sum, item) => {
      if (item.unit_price === null) return sum
      return sum + (item.quantity * item.unit_price)
    }, 0)

    const gstAmount = invoiceToSend.invoice.gst_enabled ? subtotal * 0.10 : 0
    const total = subtotal + gstAmount

    return { subtotal, gstAmount, total }
  }, [invoiceToSend])

  const handleSave = async (invoice: InvoiceDraft) => {
    if (!defaultProfile) {
      alert('Please create a business profile before saving invoices.')
      router.push('/profiles/new')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          draft: invoice,
          draftId: draftId,
          photos: photos.map(p => ({
            id: p.id,
            storage_path: p.storage_path,
            filename: p.filename,
          })),
          businessProfileId: defaultProfile.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save invoice')
      }

      const result = await response.json()
      alert(`Draft saved! Invoice number: ${result.invoiceNumber}`)

      // Clear draft and redirect to invoices list
      clearDraft()
      router.push('/invoices')
    } catch (error) {
      console.error('Save error:', error)
      alert(error instanceof Error ? error.message : 'Failed to save invoice')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSend = (invoice: InvoiceDraft) => {
    // Validate we have customer emails
    if (!invoice.customer.emails?.length) {
      alert('Please add at least one customer email address before sending.')
      return
    }

    // Validate we have a business profile
    if (!defaultProfile) {
      alert('Please create a business profile before sending invoices.')
      router.push('/profiles/new')
      return
    }

    setInvoiceToSend(invoice)
    setShowSendDialog(true)
  }

  const handleConfirmSend = async () => {
    if (!invoiceToSend || !defaultProfile) return

    try {
      // Step 1: Save invoice to database first
      const saveResponse = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          draft: invoiceToSend,
          draftId: draftId,
          photos: photos.map(p => ({
            id: p.id,
            storage_path: p.storage_path,
            filename: p.filename,
          })),
          businessProfileId: defaultProfile.id,
        }),
      })

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json()
        throw new Error(errorData.error || 'Failed to save invoice')
      }

      const saveResult = await saveResponse.json()
      const invoiceId = saveResult.invoiceId

      // Step 2: Send email using the saved invoice ID
      const sendResponse = await fetch('/api/email/send-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId: invoiceId,
        }),
      })

      if (!sendResponse.ok) {
        const errorData = await sendResponse.json()
        throw new Error(errorData.error || 'Failed to send invoice')
      }

      // Clear draft after successful send
      clearDraft()

      // Redirect to invoices list after dialog closes
      setTimeout(() => {
        router.push('/invoices')
      }, 2500)
    } catch (error) {
      console.error('Send error:', error)
      throw error
    }
  }

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

      <InvoiceEditor
        initialDraft={draft}
        draftId={draftId!}
        photos={photos}
        onPhotosChange={setPhotos}
        onSave={handleSave}
        onSend={handleSend}
      />

      {/* Send Confirmation Dialog */}
      {invoiceToSend && (
        <SendConfirmationDialog
          open={showSendDialog}
          onOpenChange={setShowSendDialog}
          invoiceNumber={invoiceToSend.invoice.invoice_number || `${defaultProfile?.sequence?.prefix || 'INV'}-${Date.now().toString().slice(-6)}`}
          customerEmails={invoiceToSend.customer.emails || []}
          total={totals.total}
          onConfirm={handleConfirmSend}
        />
      )}
    </div>
  )
}
