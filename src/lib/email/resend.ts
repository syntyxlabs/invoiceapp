import { Resend } from 'resend'

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set')
  }
  return new Resend(apiKey)
}

const fromEmail = process.env.RESEND_FROM_EMAIL || 'invoices@syntyxlabs.com'

// Fetch logo image and return as base64 string for CID attachment
export async function fetchLogoAsBuffer(url: string | null | undefined): Promise<{
  base64: string
  contentType: string
} | null> {
  if (!url) {
    console.log('[fetchLogoAsBuffer] No URL provided')
    return null
  }

  // Skip base64 data URLs - they can't be fetched
  if (url.startsWith('data:')) {
    console.log('[fetchLogoAsBuffer] Skipping base64 data URL')
    return null
  }

  console.log('[fetchLogoAsBuffer] Fetching logo from:', url.substring(0, 100))

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'Accept': 'image/*',
      }
    })

    if (!response.ok) {
      console.error('[fetchLogoAsBuffer] Failed to fetch:', response.status, response.statusText)
      return null
    }

    const contentType = response.headers.get('content-type') || 'image/png'
    const arrayBuffer = await response.arrayBuffer()

    console.log('[fetchLogoAsBuffer] Success - size:', arrayBuffer.byteLength, 'type:', contentType)

    if (arrayBuffer.byteLength === 0) {
      console.error('[fetchLogoAsBuffer] Empty response')
      return null
    }

    // Convert to base64 string for Resend attachment
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    return {
      base64,
      contentType
    }
  } catch (error) {
    console.error('[fetchLogoAsBuffer] Error:', error)
    return null
  }
}

interface LineItemSummary {
  description: string
  quantity: number
  unit: string
  unit_price: number | null
  line_total: number | null
}

interface SendInvoiceEmailParams {
  to: string[]
  invoiceNumber: string
  businessName: string
  customerName: string
  total: number
  subtotal: number
  gstAmount: number | null
  gstEnabled: boolean
  dueDate: string
  invoiceDate: string
  lineItems: LineItemSummary[]
  pdfBuffer: Buffer
  paymentLink?: string | null
  abn?: string | null
  logoBase64?: string | null
  logoContentType?: string | null
  replyTo: string
}

function formatCurrency(amount: number | null): string {
  if (amount === null) return '-'
  return `$${amount.toFixed(2)}`
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

function getUnitLabel(unit: string): string {
  const labels: Record<string, string> = {
    hr: 'hr',
    ea: 'ea',
    m: 'm',
    m2: 'm²',
    m3: 'm³',
    kg: 'kg',
    l: 'L',
  }
  return labels[unit] || unit
}

export async function sendInvoiceEmail({
  to,
  invoiceNumber,
  businessName,
  customerName,
  total,
  subtotal,
  gstAmount,
  gstEnabled,
  dueDate,
  invoiceDate,
  lineItems,
  pdfBuffer,
  paymentLink,
  abn,
  logoBase64,
  logoContentType,
  replyTo
}: SendInvoiceEmailParams) {
  const formattedDueDate = formatDate(dueDate)
  const formattedInvoiceDate = formatDate(invoiceDate)

  // Build line items HTML
  const lineItemsHtml = lineItems.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
        ${item.description}
        <span style="color: #6b7280; font-size: 13px;">
          (${item.quantity} ${getUnitLabel(item.unit)} × ${formatCurrency(item.unit_price)})
        </span>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right; white-space: nowrap;">
        ${formatCurrency(item.line_total)}
      </td>
    </tr>
  `).join('')

  const response = await getResendClient().emails.send({
    from: `${businessName} <${fromEmail}>`,
    to,
    replyTo,
    subject: `Invoice ${invoiceNumber} from ${businessName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">

          <!-- Header Banner -->
          <div style="background: #2563eb; padding: 30px 40px; text-align: center;">
            ${logoBase64 ? `
            <img src="cid:business-logo" alt="${businessName}" style="max-height: 60px; max-width: 200px; margin-bottom: 12px; border-radius: 4px;" />
            ` : ''}
            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
              ${businessName}
            </h1>
            <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">
              Tax Invoice
            </p>
          </div>

          <!-- Amount Section -->
          <div style="padding: 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">Amount Due</p>
            <p style="margin: 0; font-size: 42px; font-weight: 700; color: #111827;">
              $${total.toFixed(2)}
            </p>
            <p style="margin: 12px 0 0; color: #dc2626; font-size: 14px; font-weight: 600;">
              Due by ${formattedDueDate}
            </p>
          </div>

          <!-- Pay Button -->
          ${paymentLink ? `
          <div style="padding: 30px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
            <a href="${paymentLink}"
               style="display: inline-block; background: #2563eb; color: #ffffff; padding: 16px 48px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Pay Invoice
            </a>
          </div>
          ` : ''}

          <!-- Invoice Details -->
          <div style="padding: 30px 40px; border-bottom: 1px solid #e5e7eb;">
            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="padding: 4px 0; color: #6b7280;">Invoice Number</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 500;">${invoiceNumber}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #6b7280;">Invoice Date</td>
                <td style="padding: 4px 0; text-align: right;">${formattedInvoiceDate}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #6b7280;">Customer</td>
                <td style="padding: 4px 0; text-align: right;">${customerName}</td>
              </tr>
            </table>
          </div>

          <!-- Invoice Summary -->
          <div style="padding: 30px 40px;">
            <h2 style="margin: 0 0 20px; font-size: 16px; font-weight: 600; color: #111827;">
              Invoice Summary
            </h2>

            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              ${lineItemsHtml}

              <!-- Subtotal -->
              <tr>
                <td style="padding: 12px 0; color: #6b7280;">Subtotal</td>
                <td style="padding: 12px 0; text-align: right;">${formatCurrency(subtotal)}</td>
              </tr>

              <!-- GST -->
              ${gstEnabled ? `
              <tr>
                <td style="padding: 4px 0; color: #6b7280;">GST (10%)</td>
                <td style="padding: 4px 0; text-align: right;">${formatCurrency(gstAmount)}</td>
              </tr>
              ` : ''}

              <!-- Total -->
              <tr>
                <td style="padding: 16px 0 0; font-size: 16px; font-weight: 600;">Total Due</td>
                <td style="padding: 16px 0 0; text-align: right; font-size: 18px; font-weight: 700; color: #111827;">
                  $${total.toFixed(2)}
                </td>
              </tr>
            </table>
          </div>

          <!-- Message -->
          <div style="padding: 0 40px 30px;">
            <p style="margin: 0; padding: 20px; background: #f9fafb; border-radius: 8px; color: #6b7280; font-size: 14px;">
              Thank you for your business! Please find the full invoice attached as a PDF.
            </p>
          </div>

          <!-- Footer -->
          <div style="padding: 30px 40px; background: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-weight: 600; color: #374151;">${businessName}</p>
            ${abn ? `<p style="margin: 4px 0 0; color: #6b7280; font-size: 13px;">ABN ${abn}</p>` : ''}
            <p style="margin: 16px 0 0; color: #9ca3af; font-size: 12px;">
              Sent via Syntyx Labs Invoices
            </p>
          </div>

        </div>
      </body>
      </html>
    `,
    attachments: [
      ...(logoBase64 ? [{
        content: logoBase64,
        filename: 'logo.png',
        contentType: logoContentType || 'image/png',
        contentId: 'business-logo'
      }] : []),
      {
        content: pdfBuffer,
        filename: `Invoice-${invoiceNumber}.pdf`,
        contentType: 'application/pdf'
      }
    ]
  })

  return response
}

// Reminder email
interface SendReminderEmailParams {
  to: string[]
  invoiceNumber: string
  businessName: string
  customerName: string
  total: number
  subtotal: number
  gstAmount: number | null
  gstEnabled: boolean
  dueDate: string
  invoiceDate: string
  lineItems: LineItemSummary[]
  daysOverdue?: number
  pdfBuffer: Buffer
  paymentLink?: string | null
  abn?: string | null
  logoBase64?: string | null
  logoContentType?: string | null
  replyTo: string
}

export async function sendReminderEmail({
  to,
  invoiceNumber,
  businessName,
  customerName,
  total,
  subtotal,
  gstAmount,
  gstEnabled,
  dueDate,
  invoiceDate,
  lineItems,
  daysOverdue,
  pdfBuffer,
  paymentLink,
  abn,
  logoBase64,
  logoContentType,
  replyTo
}: SendReminderEmailParams) {
  const isOverdue = daysOverdue && daysOverdue > 0
  const formattedDueDate = formatDate(dueDate)
  const formattedInvoiceDate = formatDate(invoiceDate)

  const subject = isOverdue
    ? `Reminder: Invoice ${invoiceNumber} is ${daysOverdue} days overdue`
    : `Reminder: Invoice ${invoiceNumber} from ${businessName}`

  const headerColor = isOverdue ? '#dc2626' : '#2563eb'
  const statusText = isOverdue
    ? `Overdue by ${daysOverdue} days`
    : `Due ${formattedDueDate}`

  // Build line items HTML
  const lineItemsHtml = lineItems.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
        ${item.description}
        <span style="color: #6b7280; font-size: 13px;">
          (${item.quantity} ${getUnitLabel(item.unit)} × ${formatCurrency(item.unit_price)})
        </span>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right; white-space: nowrap;">
        ${formatCurrency(item.line_total)}
      </td>
    </tr>
  `).join('')

  const response = await getResendClient().emails.send({
    from: `${businessName} <${fromEmail}>`,
    to,
    replyTo,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">

          <!-- Header Banner -->
          <div style="background: ${headerColor}; padding: 30px 40px; text-align: center;">
            ${logoBase64 ? `
            <img src="cid:business-logo" alt="${businessName}" style="max-height: 60px; max-width: 200px; margin-bottom: 12px; border-radius: 4px;" />
            ` : ''}
            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
              ${businessName}
            </h1>
            <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">
              ${isOverdue ? 'Payment Overdue' : 'Payment Reminder'}
            </p>
          </div>

          <!-- Amount Section -->
          <div style="padding: 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">Amount Due</p>
            <p style="margin: 0; font-size: 42px; font-weight: 700; color: #111827;">
              $${total.toFixed(2)}
            </p>
            <p style="margin: 12px 0 0; color: ${isOverdue ? '#dc2626' : '#6b7280'}; font-size: 14px; font-weight: ${isOverdue ? '600' : '400'};">
              ${statusText}
            </p>
          </div>

          <!-- Pay Button -->
          ${paymentLink ? `
          <div style="padding: 30px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
            <a href="${paymentLink}"
               style="display: inline-block; background: ${headerColor}; color: #ffffff; padding: 16px 48px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Pay Invoice
            </a>
          </div>
          ` : ''}

          <!-- Invoice Details -->
          <div style="padding: 30px 40px; border-bottom: 1px solid #e5e7eb;">
            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="padding: 4px 0; color: #6b7280;">Invoice Number</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 500;">${invoiceNumber}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #6b7280;">Invoice Date</td>
                <td style="padding: 4px 0; text-align: right;">${formattedInvoiceDate}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #6b7280;">Customer</td>
                <td style="padding: 4px 0; text-align: right;">${customerName}</td>
              </tr>
            </table>
          </div>

          <!-- Invoice Summary -->
          <div style="padding: 30px 40px;">
            <h2 style="margin: 0 0 20px; font-size: 16px; font-weight: 600; color: #111827;">
              Invoice Summary
            </h2>

            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              ${lineItemsHtml}

              <!-- Subtotal -->
              <tr>
                <td style="padding: 12px 0; color: #6b7280;">Subtotal</td>
                <td style="padding: 12px 0; text-align: right;">${formatCurrency(subtotal)}</td>
              </tr>

              <!-- GST -->
              ${gstEnabled ? `
              <tr>
                <td style="padding: 4px 0; color: #6b7280;">GST (10%)</td>
                <td style="padding: 4px 0; text-align: right;">${formatCurrency(gstAmount)}</td>
              </tr>
              ` : ''}

              <!-- Total -->
              <tr>
                <td style="padding: 16px 0 0; font-size: 16px; font-weight: 600;">Total Due</td>
                <td style="padding: 16px 0 0; text-align: right; font-size: 18px; font-weight: 700; color: #111827;">
                  $${total.toFixed(2)}
                </td>
              </tr>
            </table>
          </div>

          <!-- Message -->
          <div style="padding: 0 40px 30px;">
            <p style="margin: 0; padding: 20px; background: ${isOverdue ? '#fef2f2' : '#f9fafb'}; border-radius: 8px; color: ${isOverdue ? '#991b1b' : '#6b7280'}; font-size: 14px;">
              ${isOverdue
                ? 'This invoice is now overdue. Please arrange payment at your earliest convenience or contact us if you have any questions.'
                : 'This is a friendly reminder that payment is due soon. Please find the invoice attached.'}
            </p>
          </div>

          <!-- Footer -->
          <div style="padding: 30px 40px; background: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-weight: 600; color: #374151;">${businessName}</p>
            ${abn ? `<p style="margin: 4px 0 0; color: #6b7280; font-size: 13px;">ABN ${abn}</p>` : ''}
            <p style="margin: 16px 0 0; color: #9ca3af; font-size: 12px;">
              Sent via Syntyx Labs Invoices
            </p>
          </div>

        </div>
      </body>
      </html>
    `,
    attachments: [
      ...(logoBase64 ? [{
        content: logoBase64,
        filename: 'logo.png',
        contentType: logoContentType || 'image/png',
        contentId: 'business-logo'
      }] : []),
      {
        content: pdfBuffer,
        filename: `Invoice-${invoiceNumber}.pdf`,
        contentType: 'application/pdf'
      }
    ]
  })

  return response
}
