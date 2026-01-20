'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Mail, Check } from 'lucide-react'

interface SendConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoiceNumber: string
  customerEmails: string[]
  total: number
  onConfirm: () => Promise<void>
}

export function SendConfirmationDialog({
  open,
  onOpenChange,
  invoiceNumber,
  customerEmails,
  total,
  onConfirm
}: SendConfirmationDialogProps) {
  const [isSending, setIsSending] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    setIsSending(true)
    setError(null)

    try {
      await onConfirm()
      setIsSent(true)

      // Auto close after success
      setTimeout(() => {
        onOpenChange(false)
        setIsSent(false)
      }, 2000)

    } catch {
      setError('Failed to send invoice. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSending) {
      onOpenChange(newOpen)
      if (!newOpen) {
        setError(null)
        setIsSent(false)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isSent ? 'Invoice Sent!' : 'Send Invoice'}
          </DialogTitle>
          <DialogDescription>
            {isSent
              ? `Invoice ${invoiceNumber} has been sent successfully.`
              : `Send invoice ${invoiceNumber} for $${total.toFixed(2)} AUD?`
            }
          </DialogDescription>
        </DialogHeader>

        {!isSent && (
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-2">
              This invoice will be sent to:
            </p>
            <ul className="text-sm">
              {customerEmails.map((email, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {email}
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <DialogFooter>
          {isSent ? (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              <span>Sent successfully</span>
            </div>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button onClick={handleSend} disabled={isSending}>
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invoice
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
