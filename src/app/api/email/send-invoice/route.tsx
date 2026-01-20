import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF, type InvoicePDFProps } from '@/lib/pdf/invoice-template'
import { sendInvoiceEmail } from '@/lib/email/resend'
import { createClient } from '@/lib/supabase/server'

// Helper function to create PDF element
function createPdfElement(props: InvoicePDFProps) {
  return <InvoicePDF {...props} />
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if sending from database or draft
    if (body.invoiceId) {
      return sendFromDatabase(supabase, user.email!, body.invoiceId)
    }

    // Send from draft data
    const { invoice, businessProfile, photos, replyTo } = body as InvoicePDFProps & { replyTo?: string }

    if (!invoice || !businessProfile) {
      return NextResponse.json(
        { error: 'Missing invoice or business profile data' },
        { status: 400 }
      )
    }

    if (!invoice.customer_emails?.length) {
      return NextResponse.json(
        { error: 'No customer email addresses' },
        { status: 400 }
      )
    }

    // Create PDF element
    const pdfElement = createPdfElement({ invoice, businessProfile, photos })

    // Generate PDF
    const pdfBuffer = await renderToBuffer(pdfElement)

    // Send email
    await sendInvoiceEmail({
      to: invoice.customer_emails,
      invoiceNumber: invoice.invoice_number,
      businessName: businessProfile.trading_name,
      customerName: invoice.customer_name,
      total: invoice.total,
      dueDate: invoice.due_date,
      pdfBuffer: Buffer.from(pdfBuffer),
      paymentLink: businessProfile.payment_link,
      replyTo: replyTo || user.email!
    })

    return NextResponse.json({
      success: true,
      message: `Invoice sent to ${invoice.customer_emails.join(', ')}`
    })

  } catch (error) {
    console.error('Send invoice error:', error)
    return NextResponse.json(
      { error: 'Failed to send invoice' },
      { status: 500 }
    )
  }
}

// Send invoice from database (future-ready)
async function sendFromDatabase(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userEmail: string,
  invoiceId: string
) {
  // Fetch invoice with all related data
  const { data: invoice, error: invoiceError } = await supabase
    .from('inv_invoices')
    .select(`
      *,
      business_profile:inv_business_profiles(*)
    `)
    .eq('id', invoiceId)
    .single()

  if (invoiceError || !invoice) {
    return NextResponse.json(
      { error: 'Invoice not found' },
      { status: 404 }
    )
  }

  // Cast invoice to include optional fields
  const invoiceData = invoice as typeof invoice & {
    customer_name?: string
    customer_emails?: string[]
    job_address?: string | null
  }

  // Validate invoice can be sent
  if (!invoiceData.customer_emails?.length) {
    return NextResponse.json(
      { error: 'No customer email addresses' },
      { status: 400 }
    )
  }

  // Fetch line items
  const { data: lineItems } = await supabase
    .from('inv_line_items')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('sort_order', { ascending: true })

  // Transform to PDF format
  const pdfData: InvoicePDFProps = {
    invoice: {
      invoice_number: invoiceData.invoice_number,
      invoice_date: invoiceData.invoice_date,
      due_date: invoiceData.due_date,
      customer_name: invoiceData.customer_name || 'Customer',
      customer_emails: invoiceData.customer_emails || [],
      job_address: invoiceData.job_address || null,
      line_items: (lineItems || []).map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit || 'ea',
        unit_price: item.unit_price,
        line_total: item.line_total,
      })),
      subtotal: invoiceData.subtotal,
      gst_amount: invoiceData.gst_amount,
      total: invoiceData.total,
      gst_enabled: invoiceData.gst_enabled ?? true,
      notes: invoiceData.notes,
    },
    businessProfile: {
      trading_name: invoiceData.business_profile?.trading_name || 'Business',
      business_name: invoiceData.business_profile?.business_name,
      abn: invoiceData.business_profile?.abn,
      address: invoiceData.business_profile?.address,
      logo_url: invoiceData.business_profile?.logo_url,
      bank_bsb: invoiceData.business_profile?.bank_bsb,
      bank_account: invoiceData.business_profile?.bank_account,
      payid: invoiceData.business_profile?.payid,
      payment_link: invoiceData.business_profile?.payment_link,
      default_footer_note: invoiceData.business_profile?.default_footer_note,
    },
    photos: [], // Photos will be added when invoice_photos table exists
  }

  // Create PDF element
  const pdfElement = createPdfElement(pdfData)

  // Generate PDF
  const pdfBuffer = await renderToBuffer(pdfElement)

  // Send email
  await sendInvoiceEmail({
    to: pdfData.invoice.customer_emails,
    invoiceNumber: pdfData.invoice.invoice_number,
    businessName: pdfData.businessProfile.trading_name,
    customerName: pdfData.invoice.customer_name,
    total: pdfData.invoice.total,
    dueDate: pdfData.invoice.due_date,
    pdfBuffer: Buffer.from(pdfBuffer),
    paymentLink: pdfData.businessProfile.payment_link,
    replyTo: userEmail
  })

  // Update invoice status
  await supabase
    .from('inv_invoices')
    .update({
      status: 'sent',
      updated_at: new Date().toISOString()
    })
    .eq('id', invoiceId)

  // Store PDF in storage (for resending)
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const pdfPath = `${user.id}/${invoiceId}/invoice.pdf`
    await supabase.storage
      .from('invoice-pdfs')
      .upload(pdfPath, new Uint8Array(pdfBuffer), {
        contentType: 'application/pdf',
        upsert: true
      })
  }

  return NextResponse.json({
    success: true,
    message: `Invoice sent to ${pdfData.invoice.customer_emails.join(', ')}`
  })
}
