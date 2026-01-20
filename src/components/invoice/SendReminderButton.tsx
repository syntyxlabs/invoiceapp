'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Bell, Loader2 } from 'lucide-react'

interface SendReminderButtonProps {
  invoiceId: string
  invoiceNumber: string
  customerEmails: string[]
  disabled?: boolean
}

export function SendReminderButton({
  invoiceId,
  invoiceNumber,
  customerEmails,
  disabled
}: SendReminderButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendReminder = async () => {
    setIsSending(true)
    setError(null)

    try {
      const response = await fetch('/api/email/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          reminderType: 'manual'
        })
      })

      if (response.ok) {
        setIsSent(true)
        setTimeout(() => {
          setIsOpen(false)
          setIsSent(false)
        }, 2000)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to send reminder')
      }
    } catch (err) {
      console.error('Failed to send reminder:', err)
      setError('Failed to send reminder')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Bell className="h-4 w-4 mr-2" />
          Send Reminder
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Payment Reminder</DialogTitle>
          <DialogDescription>
            Send a payment reminder for invoice {invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-2">
            A reminder will be sent to:
          </p>
          <ul className="text-sm">
            {customerEmails.map((email, i) => (
              <li key={i}>• {email}</li>
            ))}
          </ul>
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <DialogFooter>
          {isSent ? (
            <p className="text-green-600">Reminder sent!</p>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={sendReminder} disabled={isSending}>
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reminder'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
