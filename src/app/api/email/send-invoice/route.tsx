import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF, type InvoicePDFProps } from '@/lib/pdf/invoice-template'
import { sendInvoiceEmail } from '@/lib/email/resend'
import { createClient } from '@/lib/supabase/server'
import { processBusinessProfileLogo, imageUrlToBase64 } from '@/lib/pdf/image-utils'

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

    // Convert logo URL to base64 for reliable PDF rendering
    const processedProfile = await processBusinessProfileLogo(businessProfile)

    // Create PDF element
    const pdfElement = createPdfElement({ invoice, businessProfile: processedProfile, photos })

    // Generate PDF
    const pdfBuffer = await renderToBuffer(pdfElement)

    // Send email
    await sendInvoiceEmail({
      to: invoice.customer_emails,
      invoiceNumber: invoice.invoice_number,
      businessName: businessProfile.trading_name,
      customerName: invoice.customer_name,
      total: invoice.total,
      subtotal: invoice.subtotal,
      gstAmount: invoice.gst_amount,
      gstEnabled: invoice.gst_enabled ?? true,
      dueDate: invoice.due_date,
      invoiceDate: invoice.invoice_date,
      lineItems: invoice.line_items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        line_total: item.unit_price !== null ? item.quantity * item.unit_price : null,
      })),
      pdfBuffer: Buffer.from(pdfBuffer),
      paymentLink: businessProfile.payment_link,
      abn: businessProfile.abn,
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

  // Fetch photos
  const { data: photos } = await supabase
    .from('inv_photos')
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
    photos: [],
  }

  // Convert logo URL to base64 for reliable PDF rendering
  pdfData.businessProfile = await processBusinessProfileLogo(pdfData.businessProfile)

  // Process photos - get signed URLs and convert to base64
  if (photos && photos.length > 0) {
    const processedPhotos = await Promise.all(
      photos.map(async (photo) => {
        const { data: signedUrlData } = await supabase.storage
          .from('inv-photos')
          .createSignedUrl(photo.storage_path, 3600)

        if (signedUrlData?.signedUrl) {
          const base64Url = await imageUrlToBase64(signedUrlData.signedUrl)
          if (base64Url) {
            return { url: base64Url }
          }
        }
        return null
      })
    )
    pdfData.photos = processedPhotos.filter((p): p is { url: string } => p !== null)
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
    subtotal: pdfData.invoice.subtotal,
    gstAmount: pdfData.invoice.gst_amount,
    gstEnabled: pdfData.invoice.gst_enabled,
    dueDate: pdfData.invoice.due_date,
    invoiceDate: pdfData.invoice.invoice_date,
    lineItems: pdfData.invoice.line_items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      line_total: item.line_total,
    })),
    pdfBuffer: Buffer.from(pdfBuffer),
    paymentLink: pdfData.businessProfile.payment_link,
    abn: pdfData.businessProfile.abn,
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
