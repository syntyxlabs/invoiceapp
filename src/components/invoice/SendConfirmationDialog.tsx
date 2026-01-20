'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Mail, CheckCircle2 } from 'lucide-react'

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
  const router = useRouter()
  const [isSending, setIsSending] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(3)

  // Auto-redirect countdown after success
  useEffect(() => {
    if (!isSent) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/invoices')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isSent, router])

  const handleSend = async () => {
    setIsSending(true)
    setError(null)

    try {
      await onConfirm()
      setIsSent(true)
      setIsSending(false)
      setCountdown(3)
    } catch {
      setError('Failed to send invoice. Please try again.')
      setIsSending(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSending && !isSent) {
      onOpenChange(newOpen)
      if (!newOpen) {
        setError(null)
      }
    }
  }

  const handleGoToInvoices = () => {
    router.push('/invoices')
  }

  if (isSent) {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md [&>button]:hidden">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-green-100 p-4 mb-4 animate-in zoom-in duration-300">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              Invoice Sent!
            </h2>
            <p className="text-muted-foreground mb-1">
              Invoice <span className="font-semibold text-foreground">{invoiceNumber}</span> has been sent to:
            </p>
            <div className="text-sm text-muted-foreground mb-6">
              {customerEmails.map((email, i) => (
                <p key={i}>{email}</p>
              ))}
            </div>
            <Button onClick={handleGoToInvoices} className="w-full">
              View Invoices ({countdown}s)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Invoice</DialogTitle>
          <DialogDescription>
            Send invoice {invoiceNumber} for ${total.toFixed(2)} AUD?
          </DialogDescription>
        </DialogHeader>

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

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
