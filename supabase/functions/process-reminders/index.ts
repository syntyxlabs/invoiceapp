import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReminderSettings {
  auto_remind_before_days: number | null
  auto_remind_on_due: boolean
  auto_remind_after_days: number[]
}

interface InvoiceWithSettings {
  id: string
  invoice_number: string
  due_date: string
  status: string
  business_profile_id: string
  reminder_settings: ReminderSettings[]
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const appUrl = Deno.env.get('APP_URL')
    const apiSecret = Deno.env.get('API_SECRET')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]
    const processed: string[] = []
    const errors: string[] = []

    // Get all active invoices with reminder settings
    const { data: invoices, error: fetchError } = await supabase
      .from('inv_invoices')
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

    if (fetchError) {
      throw fetchError
    }

    for (const invoice of (invoices as InvoiceWithSettings[]) || []) {
      const settings = invoice.reminder_settings[0]
      if (!settings) continue

      const dueDate = new Date(invoice.due_date)
      dueDate.setHours(0, 0, 0, 0)
      const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

      let shouldRemind = false
      let reminderType = ''

      // Check before due date (daysDiff will be negative)
      if (settings.auto_remind_before_days && daysDiff === -settings.auto_remind_before_days) {
        shouldRemind = true
        reminderType = 'before_due'
      }

      // Check on due date (daysDiff will be 0)
      if (settings.auto_remind_on_due && daysDiff === 0) {
        shouldRemind = true
        reminderType = 'on_due'
      }

      // Check after due date (daysDiff will be positive)
      if (settings.auto_remind_after_days?.includes(daysDiff)) {
        shouldRemind = true
        reminderType = 'after_due'
      }

      if (shouldRemind) {
        // Check if reminder already sent today for this type
        const { data: existingReminder } = await supabase
          .from('payment_reminders')
          .select('id')
          .eq('invoice_id', invoice.id)
          .eq('reminder_type', reminderType)
          .gte('sent_at', todayStr)
          .single()

        if (!existingReminder) {
          // Create pending reminder record
          const { data: reminder, error: insertError } = await supabase
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

          if (insertError) {
            errors.push(`Failed to create reminder for ${invoice.invoice_number}: ${insertError.message}`)
            continue
          }

          // Call send-reminder API
          if (appUrl) {
            try {
              const response = await fetch(
                `${appUrl}/api/email/send-reminder`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(apiSecret ? { 'Authorization': `Bearer ${apiSecret}` } : {})
                  },
                  body: JSON.stringify({
                    invoiceId: invoice.id,
                    reminderType
                  })
                }
              )

              if (response.ok) {
                // Update reminder status to sent
                await supabase
                  .from('payment_reminders')
                  .update({
                    status: 'sent',
                    sent_at: new Date().toISOString()
                  })
                  .eq('id', reminder.id)

                processed.push(invoice.invoice_number)
              } else {
                const errorData = await response.json()
                errors.push(`Failed to send ${invoice.invoice_number}: ${errorData.error || 'Unknown error'}`)

                // Update reminder status to failed
                await supabase
                  .from('payment_reminders')
                  .update({
                    status: 'cancelled'
                  })
                  .eq('id', reminder.id)
              }
            } catch (fetchError) {
              errors.push(`Network error for ${invoice.invoice_number}: ${(fetchError as Error).message}`)
            }
          } else {
            errors.push(`APP_URL not configured, skipping ${invoice.invoice_number}`)
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: processed.length,
        invoices: processed,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error processing reminders:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
