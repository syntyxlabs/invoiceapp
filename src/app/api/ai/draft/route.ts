import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { invoiceSchema } from '@/lib/openai/schemas'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const { transcript, businessProfile } = await request.json()

    if (!transcript) {
      return NextResponse.json({ error: 'No transcript provided' }, { status: 400 })
    }

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
    return NextResponse.json(draft)
  } catch (error: unknown) {
    console.error('Draft generation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to generate invoice draft', details: errorMessage }, { status: 500 })
  }
}
