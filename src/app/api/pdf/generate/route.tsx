import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF, type InvoicePDFProps } from '@/lib/pdf/invoice-template'
import { createClient } from '@/lib/supabase/server'
import { processBusinessProfileLogo } from '@/lib/pdf/image-utils'

// Helper function to create PDF element
function createPdfElement(props: InvoicePDFProps) {
  return <InvoicePDF {...props} />
}

// Generate PDF from draft data (no database)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Check if this is a draft (data in body) or database invoice (ID in body)
    if (body.invoiceId) {
      // Fetch from database
      return generateFromDatabase(body.invoiceId)
    }

    // Generate from draft data
    const { invoice, businessProfile, photos } = body as InvoicePDFProps

    if (!invoice || !businessProfile) {
      return NextResponse.json(
        { error: 'Missing invoice or business profile data' },
        { status: 400 }
      )
    }

    // Convert logo URL to base64 for reliable PDF rendering
    const processedProfile = await processBusinessProfileLogo(businessProfile)

    // Create PDF element outside try/catch for error boundary compliance
    const pdfElement = createPdfElement({ invoice, businessProfile: processedProfile, photos })

    // Generate PDF
    const pdfBuffer = await renderToBuffer(pdfElement)

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(pdfBuffer)

    // Return PDF as response
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Invoice-${invoice.invoice_number}.pdf"`,
      },
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

// Generate PDF from database invoice (future-ready)
async function generateFromDatabase(invoiceId: string) {
  const supabase = await createClient()

  // Fetch invoice with business profile
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

  // Fetch line items
  const { data: lineItems } = await supabase
    .from('inv_line_items')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('sort_order', { ascending: true })

  // Cast invoice to include optional fields that may exist in the actual database
  // but aren't in the TypeScript types yet
  const invoiceData = invoice as typeof invoice & {
    customer_name?: string
    customer_emails?: string[]
    job_address?: string | null
  }

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

  // Convert logo URL to base64 for reliable PDF rendering
  pdfData.businessProfile = await processBusinessProfileLogo(pdfData.businessProfile)

  // Create PDF element
  const pdfElement = createPdfElement(pdfData)

  // Generate PDF
  const pdfBuffer = await renderToBuffer(pdfElement)

  // Convert Buffer to Uint8Array for NextResponse
  const uint8Array = new Uint8Array(pdfBuffer)

  return new NextResponse(uint8Array, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Invoice-${invoiceData.invoice_number}.pdf"`,
    },
  })
}
