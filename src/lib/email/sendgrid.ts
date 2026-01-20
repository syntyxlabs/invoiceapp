import sgMail from '@sendgrid/mail'

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

interface SendInvoiceEmailParams {
  to: string[]
  invoiceNumber: string
  businessName: string
  customerName: string
  total: number
  dueDate: string
  pdfBuffer: Buffer
  paymentLink?: string | null
  replyTo: string
}

export async function sendInvoiceEmail({
  to,
  invoiceNumber,
  businessName,
  customerName,
  total,
  dueDate,
  pdfBuffer,
  paymentLink,
  replyTo
}: SendInvoiceEmailParams) {
  const formattedDueDate = new Date(dueDate).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  const msg = {
    to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL || 'invoices@syntyxlabs.com',
      name: businessName
    },
    replyTo,
    subject: `Invoice ${invoiceNumber} from ${businessName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f9fafb; padding: 30px; border-radius: 8px;">
          <h1 style="margin: 0 0 20px; font-size: 24px; color: #1f2937;">
            Invoice ${invoiceNumber}
          </h1>

          <p style="margin: 0 0 10px;">Hi ${customerName},</p>

          <p style="margin: 0 0 20px;">
            Please find attached invoice <strong>${invoiceNumber}</strong> for
            <strong style="font-size: 18px;">$${total.toFixed(2)} AUD</strong>.
          </p>

          <p style="margin: 0 0 20px;">
            Payment is due by <strong>${formattedDueDate}</strong>.
          </p>

          ${paymentLink ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${paymentLink}"
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Pay Now
            </a>
          </div>
          ` : ''}

          <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px;">
            Thank you for your business!
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="margin: 0; color: #9ca3af; font-size: 12px;">
            Sent via Syntyx Labs Invoices
          </p>
        </div>
      </body>
      </html>
    `,
    attachments: [
      {
        content: pdfBuffer.toString('base64'),
        filename: `Invoice-${invoiceNumber}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment' as const
      }
    ]
  }

  const response = await sgMail.send(msg)
  return response
}

// Reminder email
interface SendReminderEmailParams {
  to: string[]
  invoiceNumber: string
  businessName: string
  customerName: string
  total: number
  dueDate: string
  daysOverdue?: number
  pdfBuffer: Buffer
  paymentLink?: string | null
  replyTo: string
}

export async function sendReminderEmail({
  to,
  invoiceNumber,
  businessName,
  customerName,
  total,
  daysOverdue,
  pdfBuffer,
  paymentLink,
  replyTo
}: SendReminderEmailParams) {
  const isOverdue = daysOverdue && daysOverdue > 0
  const subject = isOverdue
    ? `Reminder: Invoice ${invoiceNumber} is ${daysOverdue} days overdue`
    : `Reminder: Invoice ${invoiceNumber} from ${businessName}`

  const msg = {
    to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL || 'invoices@syntyxlabs.com',
      name: businessName
    },
    replyTo,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: ${isOverdue ? '#fef2f2' : '#f9fafb'}; padding: 30px; border-radius: 8px;">
          <h1 style="margin: 0 0 20px; font-size: 24px; color: ${isOverdue ? '#dc2626' : '#1f2937'};">
            ${isOverdue ? 'Payment Overdue' : 'Payment Reminder'}
          </h1>

          <p style="margin: 0 0 10px;">Hi ${customerName},</p>

          <p style="margin: 0 0 20px;">
            This is a friendly reminder that invoice <strong>${invoiceNumber}</strong>
            for <strong>$${total.toFixed(2)} AUD</strong>
            ${isOverdue ? `is now ${daysOverdue} days overdue.` : 'is due soon.'}
          </p>

          ${paymentLink ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${paymentLink}"
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Pay Now
            </a>
          </div>
          ` : ''}

          <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px;">
            Please let us know if you have any questions.
          </p>
        </div>
      </body>
      </html>
    `,
    attachments: [
      {
        content: pdfBuffer.toString('base64'),
        filename: `Invoice-${invoiceNumber}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment' as const
      }
    ]
  }

  return sgMail.send(msg)
}
