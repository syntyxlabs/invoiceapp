'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, Check, Clock, X } from 'lucide-react'

interface Reminder {
  id: string
  reminder_type: 'manual' | 'before_due' | 'on_due' | 'after_due'
  days_offset: number | null
  sent_at: string | null
  status: 'pending' | 'sent' | 'cancelled'
  created_at: string
}

interface ReminderHistoryProps {
  invoiceId: string
}

const REMINDER_LABELS: Record<string, string> = {
  manual: 'Manual reminder',
  before_due: 'Before due date',
  on_due: 'On due date',
  after_due: 'After due date'
}

export function ReminderHistory({ invoiceId }: ReminderHistoryProps) {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchReminders = async () => {
      const supabase = createClient()
      try {
        // Table may not exist yet - use type assertion
        const { data, error: fetchError } = await (supabase as ReturnType<typeof createClient>)
          .from('payment_reminders' as 'inv_invoices')
          .select('*')
          .eq('invoice_id' as 'id', invoiceId)
          .order('created_at', { ascending: false }) as { data: Reminder[] | null; error: Error | null }

        if (fetchError) {
          // Table may not exist yet
          setError(true)
        } else if (data) {
          setReminders(data)
        }
      } catch {
        setError(true)
      }
      setIsLoading(false)
    }

    fetchReminders()
  }, [invoiceId])

  if (isLoading) return null
  if (error) return null // Silently fail if table doesn't exist

  if (reminders.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No reminders sent yet.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Reminder History</h4>
      <ul className="space-y-2">
        {reminders.map((reminder) => (
          <li
            key={reminder.id}
            className="flex items-center gap-2 text-sm"
            data-testid="reminder-item"
          >
            {reminder.status === 'sent' ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : reminder.status === 'pending' ? (
              <Clock className="h-4 w-4 text-amber-500" />
            ) : reminder.status === 'cancelled' ? (
              <X className="h-4 w-4 text-gray-400" />
            ) : (
              <Bell className="h-4 w-4 text-gray-400" />
            )}

            <span>{REMINDER_LABELS[reminder.reminder_type] || reminder.reminder_type}</span>

            {reminder.days_offset !== null && reminder.days_offset > 0 && (
              <span className="text-muted-foreground">
                ({reminder.days_offset} days overdue)
              </span>
            )}

            {reminder.sent_at && (
              <span className="text-muted-foreground">
                • {new Date(reminder.sent_at).toLocaleDateString('en-AU', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            )}

            {reminder.status === 'cancelled' && (
              <span className="text-muted-foreground">(cancelled)</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
