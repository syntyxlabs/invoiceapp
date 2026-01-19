# Phase 8: Payment Reminders (v1.5)

**Timeline**: Week 8
**Goal**: Manual and automatic payment reminders

---

## Tasks

| Task | Priority | Estimate |
|------|----------|----------|
| Build ReminderSettings component | P0 | 3h |
| Create reminder_settings table and UI | P0 | 3h |
| Implement "Send Manual Reminder" button | P0 | 3h |
| Create Supabase Edge Function for processing | P0 | 4h |
| Set up pg_cron schedule | P0 | 2h |
| Create reminder email template | P0 | 2h |
| Add reminder history view | P1 | 3h |
| Stop reminders when paid | P0 | 2h |

---

## Deliverable

Complete reminder system (manual + automatic)

---

## Technical Details

### 1. Reminder Settings Component

```typescript
// src/components/profile/ReminderSettings.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

interface ReminderSettingsProps {
  businessProfileId: string
}

interface Settings {
  auto_remind_before_days: number | null
  auto_remind_on_due: boolean
  auto_remind_after_days: number[]
}

export function ReminderSettings({ businessProfileId }: ReminderSettingsProps) {
  const [settings, setSettings] = useState<Settings>({
    auto_remind_before_days: null,
    auto_remind_on_due: false,
    auto_remind_after_days: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('reminder_settings')
        .select('*')
        .eq('business_profile_id', businessProfileId)
        .single()

      if (data) {
        setSettings({
          auto_remind_before_days: data.auto_remind_before_days,
          auto_remind_on_due: data.auto_remind_on_due,
          auto_remind_after_days: data.auto_remind_after_days || []
        })
      }

      setIsLoading(false)
    }

    fetchSettings()
  }, [businessProfileId, supabase])

  const saveSettings = async () => {
    setIsSaving(true)

    const { error } = await supabase
      .from('reminder_settings')
      .upsert({
        business_profile_id: businessProfileId,
        ...settings,
        updated_at: new Date().toISOString()
      })

    setIsSaving(false)
  }

  const toggleAfterDays = (days: number) => {
    setSettings(prev => ({
      ...prev,
      auto_remind_after_days: prev.auto_remind_after_days.includes(days)
        ? prev.auto_remind_after_days.filter(d => d !== days)
        : [...prev.auto_remind_after_days, days].sort((a, b) => a - b)
    }))
  }

  if (isLoading) {
    return <Loader2 className="h-6 w-6 animate-spin" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Automatic Reminders</CardTitle>
        <CardDescription>
          Set up automatic payment reminders for overdue invoices.
          Reminders stop when an invoice is marked as paid.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Before Due Date */}
        <div className="flex items-center justify-between">
          <div>
            <Label>Remind before due date</Label>
            <p className="text-sm text-muted-foreground">
              Send a reminder X days before the invoice is due
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              max="30"
              className="w-20"
              value={settings.auto_remind_before_days || ''}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                auto_remind_before_days: e.target.value ? parseInt(e.target.value) : null
              }))}
              placeholder="Days"
            />
            <span className="text-sm text-muted-foreground">days before</span>
          </div>
        </div>

        {/* On Due Date */}
        <div className="flex items-center justify-between">
          <div>
            <Label>Remind on due date</Label>
            <p className="text-sm text-muted-foreground">
              Send a reminder on the day the invoice is due
            </p>
          </div>
          <Switch
            checked={settings.auto_remind_on_due}
            onCheckedChange={(checked) => setSettings(prev => ({
              ...prev,
              auto_remind_on_due: checked
            }))}
          />
        </div>

        {/* After Due Date */}
        <div>
          <Label>Remind after due date</Label>
          <p className="text-sm text-muted-foreground mb-3">
            Send reminders X days after the invoice is overdue
          </p>
          <div className="flex flex-wrap gap-2">
            {[3, 7, 14, 21, 30].map((days) => (
              <Button
                key={days}
                variant={settings.auto_remind_after_days.includes(days) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleAfterDays(days)}
              >
                {days} days
              </Button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <Button onClick={saveSettings} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
```

### 2. Manual Reminder Button

```typescript
// src/components/invoice/SendReminderButton.tsx
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

  const sendReminder = async () => {
    setIsSending(true)

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
      }
    } catch (error) {
      console.error('Failed to send reminder:', error)
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
```

### 3. Send Reminder API Route

```typescript
// src/app/api/email/send-reminder/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF } from '@/lib/pdf/invoice-template'
import { sendReminderEmail } from '@/lib/email/sendgrid'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { invoiceId, reminderType = 'manual' } = await request.json()

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        business_profile:business_profiles(*),
        line_items:invoice_line_items(*),
        photos:invoice_photos(*),
        user:users(email)
      `)
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Don't send reminders for paid or void invoices
    if (['paid', 'void'].includes(invoice.status)) {
      return NextResponse.json(
        { error: 'Cannot send reminder for paid or void invoice' },
        { status: 400 }
      )
    }

    // Calculate days overdue
    const dueDate = new Date(invoice.due_date)
    const today = new Date()
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

    // Get signed URLs for photos
    const photosWithUrls = await Promise.all(
      invoice.photos.map(async (photo: any) => {
        const { data } = await supabase.storage
          .from('invoice-photos')
          .createSignedUrl(photo.storage_path, 3600)
        return { url: data?.signedUrl }
      })
    )

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      <InvoicePDF
        invoice={{
          ...invoice,
          line_items: invoice.line_items.map((item: any) => ({
            ...item,
            line_total: item.line_total || (item.quantity * item.unit_price)
          })),
        }}
        businessProfile={invoice.business_profile}
        photos={photosWithUrls.filter((p: any) => p.url)}
      />
    )

    // Send reminder email
    await sendReminderEmail({
      to: invoice.customer_emails,
      invoiceNumber: invoice.invoice_number,
      businessName: invoice.business_profile.trading_name,
      customerName: invoice.customer_name,
      total: invoice.total,
      dueDate: invoice.due_date,
      daysOverdue: daysOverdue > 0 ? daysOverdue : undefined,
      pdfBuffer: Buffer.from(pdfBuffer),
      paymentLink: invoice.business_profile.payment_link,
      replyTo: invoice.user.email
    })

    // Record reminder
    await supabase
      .from('payment_reminders')
      .insert({
        invoice_id: invoiceId,
        reminder_type: reminderType,
        sent_at: new Date().toISOString(),
        status: 'sent'
      })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Send reminder error:', error)
    return NextResponse.json(
      { error: 'Failed to send reminder' },
      { status: 500 }
    )
  }
}
```

### 4. Supabase Edge Function for Auto-Reminders

```typescript
// supabase/functions/process-reminders/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const today = new Date().toISOString().split('T')[0]
    const processed: string[] = []

    // Get all active invoices with reminder settings
    const { data: invoices } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        due_date,
        status,
        business_profile_id,
        reminder_settings:reminder_settings!inner(
          auto_remind_before_days,
          auto_remind_on_due,
          auto_remind_after_days
        )
      `)
      .in('status', ['sent', 'overdue'])

    for (const invoice of invoices || []) {
      const settings = invoice.reminder_settings[0]
      if (!settings) continue

      const dueDate = new Date(invoice.due_date)
      const todayDate = new Date(today)
      const daysDiff = Math.floor((todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

      let shouldRemind = false
      let reminderType = ''

      // Check before due date
      if (settings.auto_remind_before_days && daysDiff === -settings.auto_remind_before_days) {
        shouldRemind = true
        reminderType = 'before_due'
      }

      // Check on due date
      if (settings.auto_remind_on_due && daysDiff === 0) {
        shouldRemind = true
        reminderType = 'on_due'
      }

      // Check after due date
      if (settings.auto_remind_after_days?.includes(daysDiff)) {
        shouldRemind = true
        reminderType = 'after_due'
      }

      if (shouldRemind) {
        // Check if reminder already sent today
        const { data: existingReminder } = await supabase
          .from('payment_reminders')
          .select('id')
          .eq('invoice_id', invoice.id)
          .eq('reminder_type', reminderType)
          .gte('sent_at', today)
          .single()

        if (!existingReminder) {
          // Create pending reminder record
          const { data: reminder } = await supabase
            .from('payment_reminders')
            .insert({
              invoice_id: invoice.id,
              reminder_type: reminderType,
              days_offset: daysDiff,
              scheduled_at: new Date().toISOString(),
              status: 'pending'
            })
            .select()
            .single()

          // Call send-reminder API
          const response = await fetch(
            `${Deno.env.get('APP_URL')}/api/email/send-reminder`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('API_SECRET')}`
              },
              body: JSON.stringify({
                invoiceId: invoice.id,
                reminderType
              })
            }
          )

          if (response.ok) {
            // Update reminder status
            await supabase
              .from('payment_reminders')
              .update({
                status: 'sent',
                sent_at: new Date().toISOString()
              })
              .eq('id', reminder.id)

            processed.push(invoice.invoice_number)
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: processed.length,
        invoices: processed
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error processing reminders:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
```

### 5. pg_cron Schedule

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule reminder processing every 15 minutes
SELECT cron.schedule(
  'process-payment-reminders',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/process-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Alternative: Use Supabase Vault for secrets
SELECT cron.schedule(
  'process-payment-reminders',
  '0 9 * * *',  -- Daily at 9 AM
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url')
           || '/functions/v1/process-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

### 6. Reminder History Component

```typescript
// src/components/invoice/ReminderHistory.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, Check, Clock } from 'lucide-react'

interface Reminder {
  id: string
  reminder_type: 'manual' | 'before_due' | 'on_due' | 'after_due'
  days_offset: number | null
  sent_at: string | null
  status: 'pending' | 'sent' | 'cancelled'
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

  const supabase = createClient()

  useEffect(() => {
    const fetchReminders = async () => {
      const { data } = await supabase
        .from('payment_reminders')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: false })

      if (data) {
        setReminders(data)
      }
      setIsLoading(false)
    }

    fetchReminders()
  }, [invoiceId, supabase])

  if (isLoading) return null

  if (reminders.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No reminders sent yet.
      </p>
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
          >
            {reminder.status === 'sent' ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : reminder.status === 'pending' ? (
              <Clock className="h-4 w-4 text-amber-500" />
            ) : (
              <Bell className="h-4 w-4 text-gray-400" />
            )}

            <span>{REMINDER_LABELS[reminder.reminder_type]}</span>

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
```

---

## File Structure

```
src/
├── app/
│   └── api/
│       └── email/
│           └── send-reminder/
│               └── route.ts
├── components/
│   ├── profile/
│   │   └── ReminderSettings.tsx
│   └── invoice/
│       ├── SendReminderButton.tsx
│       └── ReminderHistory.tsx
└── supabase/
    └── functions/
        └── process-reminders/
            └── index.ts
```

---

## Test Specifications

### Integration Tests

```typescript
// src/components/profile/__tests__/ReminderSettings.test.tsx
describe('ReminderSettings', () => {
  it('loads existing settings for business profile')
  it('shows loading state while fetching')
  it('allows setting before-due-date reminder days')
  it('validates before-due-date is between 1-30')
  it('toggles on-due-date reminder')
  it('allows selecting after-due-date intervals')
  it('allows multi-select of after-due intervals')
  it('saves settings on button click')
  it('shows loading state while saving')
  it('shows success message after save')
})

// src/components/invoice/__tests__/SendReminderButton.test.tsx
describe('SendReminderButton', () => {
  it('opens dialog on click')
  it('displays recipient emails')
  it('calls API to send reminder')
  it('shows loading state during send')
  it('shows success message after send')
  it('closes dialog after success')
  it('displays error message on failure')
  it('is disabled for paid/void invoices')
})

// src/components/invoice/__tests__/ReminderHistory.test.tsx
describe('ReminderHistory', () => {
  it('fetches reminders for invoice')
  it('displays empty state when no reminders')
  it('shows sent reminders with timestamps')
  it('shows cancelled reminders differently')
  it('displays reminder type labels')
  it('orders reminders by date descending')
})

// src/app/api/email/__tests__/send-reminder.test.ts
describe('POST /api/email/send-reminder', () => {
  it('returns 401 if not authenticated')
  it('returns 404 if invoice not found')
  it('returns 400 for paid invoice')
  it('returns 400 for void invoice')
  it('calculates days overdue correctly')
  it('sends reminder with overdue styling when overdue')
  it('sends reminder with neutral styling when not overdue')
  it('records reminder in database')
  it('returns 500 on SendGrid failure')
})
```

### E2E Tests

```typescript
// e2e/reminders.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Payment Reminders', () => {
  test('user can configure automatic reminders', async ({ page }) => {
    await page.goto('/profiles/[id]/settings')

    // Set before-due reminder
    await page.fill('[name="before_days"]', '3')

    // Toggle on-due reminder
    await page.click('[data-testid="on-due-toggle"]')

    // Select after-due intervals
    await page.click('button:has-text("7 days")')
    await page.click('button:has-text("14 days")')

    await page.click('button:has-text("Save Settings")')
    await expect(page.locator('text=Saved')).toBeVisible()
  })

  test('user can send manual reminder', async ({ page }) => {
    await page.goto('/invoices/[id]') // Sent invoice
    await page.click('button:has-text("Send Reminder")')

    await expect(page.locator('[role="dialog"]')).toBeVisible()
    await page.click('button:has-text("Send Reminder"):visible')

    await expect(page.locator('text=Reminder sent')).toBeVisible()
  })

  test('reminder history shows on invoice detail', async ({ page }) => {
    await page.goto('/invoices/[id]')
    await expect(page.locator('text=Reminder History')).toBeVisible()
    await expect(page.locator('[data-testid="reminder-item"]')).toBeVisible()
  })
})
```

---

## Acceptance Criteria

### Functional Requirements
- [ ] User can configure reminder settings per business profile
- [ ] Before-due-date reminder option works
- [ ] On-due-date reminder option works
- [ ] After-due-date reminder options work (3, 7, 14, 21, 30 days)
- [ ] Manual "Send Reminder" button works
- [ ] Reminder emails use correct template
- [ ] Reminder emails include PDF attachment
- [ ] Reminder emails show overdue status if applicable
- [ ] Reminders are recorded in payment_reminders table
- [ ] Reminder history displays on invoice detail page
- [ ] Reminders stop when invoice marked as paid
- [ ] Reminders cancelled when invoice voided
- [ ] Edge Function processes reminders on schedule
- [ ] pg_cron triggers Edge Function correctly
- [ ] No duplicate reminders sent on same day

### Testing Requirements
- [ ] ReminderSettings component tests pass
- [ ] SendReminderButton component tests pass
- [ ] ReminderHistory component tests pass
- [ ] Send reminder API tests pass
- [ ] E2E reminder flow passes
