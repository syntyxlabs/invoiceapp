import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF, type InvoicePDFProps } from '@/lib/pdf/invoice-template'
import { sendReminderEmail, fetchLogoAsBuffer } from '@/lib/email/resend'
import { createClient } from '@/lib/supabase/server'
import { processBusinessProfileLogo } from '@/lib/pdf/image-utils'

// Get the base URL for the app
function getBaseUrl(headersList: Headers): string {
  const forwardedHost = headersList.get('x-forwarded-host')
  const forwardedProto = headersList.get('x-forwarded-proto') || 'https'

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }

  const host = headersList.get('host')
  if (host) {
    const proto = host.includes('localhost') ? 'http' : 'https'
    return `${proto}://${host}`
  }

  return process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'
}

// Helper function to create PDF element
function createPdfElement(props: InvoicePDFProps) {
  return <InvoicePDF {...props} />
}

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
    const headersList = await headers()
    const baseUrl = getBaseUrl(headersList)

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

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

    // Cast invoice to include optional fields
    const invoiceData = invoice as typeof invoice & {
      customer_name?: string
      customer_emails?: string[]
      job_address?: string | null
    }

    // Don't send reminders for paid or cancelled invoices
    if (['paid', 'cancelled'].includes(invoiceData.status)) {
      return NextResponse.json(
        { error: 'Cannot send reminder for paid or cancelled invoice' },
        { status: 400 }
      )
    }

    // Validate customer emails
    if (!invoiceData.customer_emails?.length) {
      return NextResponse.json(
        { error: 'No customer email addresses' },
        { status: 400 }
      )
    }

    // Calculate days overdue
    const dueDate = new Date(invoiceData.due_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    dueDate.setHours(0, 0, 0, 0)
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

    // Fetch line items
    const { data: lineItems } = await supabase
      .from('inv_line_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('sort_order', { ascending: true })

    // Generate payment page URL
    const paymentPageUrl = `${baseUrl}/pay/${invoiceId}`

    // Transform to PDF format
    const pdfData: InvoicePDFProps = {
      invoice: {
        id: invoiceId,
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
      paymentPageUrl,
    }

    // Convert logo URL to base64 for reliable PDF rendering
    pdfData.businessProfile = await processBusinessProfileLogo(pdfData.businessProfile)

    // Create PDF element
    const pdfElement = createPdfElement(pdfData)

    // Generate PDF
    const pdfBuffer = await renderToBuffer(pdfElement)

    // Fetch logo for email CID attachment (use original URL, not base64)
    const logoData = await fetchLogoAsBuffer(invoiceData.business_profile?.logo_url)

    // Send reminder email
    await sendReminderEmail({
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
      daysOverdue: daysOverdue > 0 ? daysOverdue : undefined,
      pdfBuffer: Buffer.from(pdfBuffer),
      paymentLink: pdfData.businessProfile.payment_link,
      abn: pdfData.businessProfile.abn,
      logoBase64: logoData?.base64,
      logoContentType: logoData?.contentType,
      replyTo: user.email!
    })

    // Record reminder in database (if table exists)
    try {
      // Table may not exist yet - use type assertion
      await (supabase as Awaited<ReturnType<typeof createClient>>)
        .from('payment_reminders' as 'inv_invoices')
        .insert({
          invoice_id: invoiceId,
          reminder_type: reminderType,
          days_offset: daysOverdue,
          sent_at: new Date().toISOString(),
          status: 'sent'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
    } catch {
      // Table may not exist yet, continue silently
      console.log('payment_reminders table may not exist yet')
    }

    // Update invoice status to overdue if past due date
    if (daysOverdue > 0 && invoiceData.status === 'sent') {
      await supabase
        .from('inv_invoices')
        .update({
          status: 'overdue',
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
    }

    return NextResponse.json({
      success: true,
      message: `Reminder sent to ${pdfData.invoice.customer_emails.join(', ')}`
    })

  } catch (error) {
    console.error('Send reminder error:', error)
    return NextResponse.json(
      { error: 'Failed to send reminder' },
      { status: 500 }
    )
  }
}
