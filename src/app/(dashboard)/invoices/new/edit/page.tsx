'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InvoiceEditor } from '@/components/invoice/InvoiceEditor'
import { useInvoiceDraftStore } from '@/stores/invoice-draft-store'
import type { InvoiceDraft } from '@/lib/openai/schemas'

export default function EditInvoicePage() {
  const router = useRouter()
  const { draft, draftId, photos, originalTranscript, clearDraft, setPhotos } = useInvoiceDraftStore()

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

  const handleSave = (invoice: InvoiceDraft) => {
    // TODO: Save to database in Phase 7
    console.log('Saving draft:', invoice)
    alert('Draft saved! (Database integration coming in Phase 7)')
  }

  const handleSend = (invoice: InvoiceDraft) => {
    // TODO: Generate PDF and send email in Phase 6
    console.log('Sending invoice:', invoice)
    alert('Send functionality coming in Phase 6!')
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
    </div>
  )
}
