import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { invoiceSchema } from '@/lib/openai/schemas'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/**
 * Look up a customer by name and return their stored details
 */
async function findCustomerByName(userId: string, customerName: string) {
  if (!customerName || customerName === 'Customer') return null

  const supabase = await createClient()

  // Try exact match first (case insensitive)
  const { data: exactMatch } = await supabase
    .from('inv_customers')
    .select('*')
    .eq('user_id', userId)
    .ilike('name', customerName)
    .limit(1)
    .single()

  if (exactMatch) return exactMatch

  // Try partial match (name contains the search term)
  const { data: partialMatches } = await supabase
    .from('inv_customers')
    .select('*')
    .eq('user_id', userId)
    .ilike('name', `%${customerName}%`)
    .order('name', { ascending: true })
    .limit(5)

  if (partialMatches && partialMatches.length > 0) {
    // Return the best match (shortest name that contains the search term)
    return partialMatches.sort((a, b) => a.name.length - b.name.length)[0]
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const { transcript, businessProfile } = await request.json()

    if (!transcript) {
      return NextResponse.json({ error: 'No transcript provided' }, { status: 400 })
    }

    // Get current user for customer lookup
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const today = new Date().toISOString().split('T')[0]
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an invoice drafting assistant for Australian tradies.

RULES:
1. Return ONLY valid JSON matching the schema
2. Currency is always AUD
3. NEVER invent prices - set unit_price to null if not explicitly stated
4. Default invoice_date to "${today}"
5. Default due_date to "${dueDate}" (14 days)
6. Default gst_enabled to true
7. Common units: hr (hours), ea (each), m (metres)
8. Parse quantities carefully - "2 hours" = quantity: 2, unit: "hr"
9. If customer name not stated, use "Customer"
10. If email not stated, use empty array []

ITEM TYPE CLASSIFICATION:
Each line item must have item_type: "labour" or "material".
- unit "hr" = ALWAYS "labour"
- Material indicators: bags, sheets, rolls, fittings, fixtures, parts, supplies, cement, timber, pipe, cable, wire, plaster, paint, tiles, screws, bolts, nails, brackets
- Labour indicators: hours, installation, labour, repair, service, callout, consultation, inspection
- When in doubt, default to "labour"

${businessProfile?.default_hourly_rate ? `Business default hourly rate: $${businessProfile.default_hourly_rate}/hr` : ''}

changes_summary should be empty array for initial drafts.`
        },
        {
          role: 'user',
          content: `Create an invoice from this voice input:\n\n"${transcript}"`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'invoice_draft',
          strict: true,
          schema: invoiceSchema
        }
      }
    })

    const draft = JSON.parse(response.choices[0].message.content || '{}')

    // Auto-populate customer emails from stored customers
    if (user && draft.customer?.name) {
      const storedCustomer = await findCustomerByName(user.id, draft.customer.name)

      if (storedCustomer) {
        // Update draft with stored customer info
        draft.customer.emails = storedCustomer.emails || []

        // Optionally use stored address if no job address specified
        if (!draft.invoice?.job_address && storedCustomer.address) {
          draft.invoice.job_address = storedCustomer.address
        }

        // Add flag to indicate customer was matched
        draft._customerMatched = {
          id: storedCustomer.id,
          name: storedCustomer.name,
          emailCount: storedCustomer.emails?.length || 0
        }
      }
    }

    return NextResponse.json(draft)
  } catch (error: unknown) {
    console.error('Draft generation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to generate invoice draft', details: errorMessage }, { status: 500 })
  }
}
