import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { InvoiceDraft } from '@/lib/openai/schemas'

interface SaveInvoiceRequest {
  draft: InvoiceDraft
  draftId: string
  photos: { id: string; storage_path: string; filename: string }[]
  businessProfileId: string
}

// Create/Save invoice
export async function POST(request: NextRequest) {
  try {
    const body: SaveInvoiceRequest = await request.json()
    const { draft, draftId, businessProfileId } = body

    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get next invoice number from sequence
    const { data: sequence } = await supabase
      .from('inv_sequences')
      .select('*')
      .eq('business_profile_id', businessProfileId)
      .single()

    const invoiceNumber = sequence
      ? `${sequence.prefix}${String(sequence.next_number).padStart(4, '0')}`
      : `INV-${Date.now()}`

    // Calculate totals
    const subtotal = draft.line_items.reduce((sum, item) => {
      if (item.unit_price === null) return sum
      return sum + (item.quantity * item.unit_price)
    }, 0)
    const taxRate = draft.invoice.gst_enabled ? 0.10 : 0
    const taxAmount = subtotal * taxRate
    const total = subtotal + taxAmount

    // Create invoice record
    const { data: invoice, error: invoiceError } = await supabase
      .from('inv_invoices')
      .insert({
        id: draftId,
        user_id: user.id,
        business_profile_id: businessProfileId,
        invoice_number: invoiceNumber,
        status: 'draft',
        invoice_date: draft.invoice.invoice_date,
        due_date: draft.invoice.due_date,
        customer_name: draft.customer.name,
        customer_emails: draft.customer.emails || [],
        job_address: draft.invoice.job_address,
        subtotal,
        gst_amount: taxAmount,
        gst_enabled: draft.invoice.gst_enabled,
        total,
        notes: draft.notes,
        original_voice_transcript: null,
        ai_draft_json: draft,
      })
      .select()
      .single()

    if (invoiceError) {
      console.error('Invoice creation error:', invoiceError)
      return NextResponse.json(
        { error: 'Failed to create invoice', details: invoiceError.message, code: invoiceError.code },
        { status: 500 }
      )
    }

    // Create line items
    const lineItemsToInsert = draft.line_items.map((item, index) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit || 'ea',
      unit_price: item.unit_price || 0,
      line_total: (item.quantity * (item.unit_price || 0)),
      sort_order: index,
    }))

    if (lineItemsToInsert.length > 0) {
      const { error: lineItemsError } = await supabase
        .from('inv_line_items')
        .insert(lineItemsToInsert)

      if (lineItemsError) {
        console.error('Line items creation error:', lineItemsError)
      }
    }

    // Save photos to inv_photos table
    if (body.photos && body.photos.length > 0) {
      const photosToInsert = body.photos.map((photo, index) => ({
        invoice_id: invoice.id,
        storage_path: photo.storage_path,
        filename: photo.filename,
        sort_order: index,
      }))

      const { error: photosError } = await supabase
        .from('inv_photos')
        .insert(photosToInsert)

      if (photosError) {
        console.error('Photos creation error:', photosError)
      }
    }

    // Update sequence number
    if (sequence) {
      await supabase
        .from('inv_sequences')
        .update({ next_number: sequence.next_number + 1 })
        .eq('id', sequence.id)
    }

    return NextResponse.json({
      success: true,
      invoiceId: invoice.id,
      invoiceNumber
    })

  } catch (error) {
    console.error('Save invoice error:', error)
    return NextResponse.json(
      { error: 'Failed to save invoice' },
      { status: 500 }
    )
  }
}

// Get all invoices for current user
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: invoices, error } = await supabase
      .from('inv_invoices')
      .select(`
        *,
        business_profile:inv_business_profiles(trading_name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch invoices error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch invoices' },
        { status: 500 }
      )
    }

    return NextResponse.json(invoices)

  } catch (error) {
    console.error('Get invoices error:', error)
    return NextResponse.json(
      { error: 'Failed to get invoices' },
      { status: 500 }
    )
  }
}
