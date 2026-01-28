import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { invoiceSchema } from '@/lib/openai/schemas'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const { currentInvoice, correctionText } = await request.json()

    if (!currentInvoice || !correctionText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You update existing invoice JSON based on user correction requests.

RULES:
1. Return ONLY valid JSON matching the schema
2. PRESERVE all fields unless explicitly requested to change
3. NEVER change unit_price unless user explicitly states a new price
4. NEVER change quantities unless user explicitly requests it
5. NEVER add new line items unless user explicitly requests it
6. NEVER remove line items unless user explicitly requests it
7. Populate changes_summary with human-readable descriptions of changes made
8. PRESERVE item_type ("labour" or "material") unless explicitly asked to change
9. Support type change commands like "make X a material", "that's not labour, it's materials", "change cement to material"
10. New items added via correction should follow the same classification rules: hr=labour, bags/sheets/parts/supplies=material, default to labour

Example changes_summary entries:
- "Changed labour hours from 2 to 2.5"
- "Removed callout fee line item"
- "Updated customer name to John Smith"
- "Split labour into two items: install and testing"
- "Changed customer email to new@example.com"
- "Changed cement from labour to material"`
        },
        {
          role: 'user',
          content: `Current invoice:
${JSON.stringify(currentInvoice, null, 2)}

Change request:
"${correctionText}"`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'invoice_updated',
          strict: true,
          schema: invoiceSchema
        }
      }
    })

    const updated = JSON.parse(response.choices[0].message.content || '{}')
    return NextResponse.json(updated)

  } catch (error) {
    console.error('Correction error:', error)
    return NextResponse.json(
      { error: 'Failed to apply corrections' },
      { status: 500 }
    )
  }
}
