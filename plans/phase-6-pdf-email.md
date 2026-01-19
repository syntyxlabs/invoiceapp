# Phase 6: PDF Generation + Email

**Timeline**: Week 6
**Goal**: Generate AU-compliant PDFs and send invoices via email

---

## Tasks

| Task | Priority | Estimate |
|------|----------|----------|
| Design PDF template (AU-compliant) | P0 | 4h |
| Implement @react-pdf/renderer template | P0 | 6h |
| Create /api/pdf/generate route | P0 | 3h |
| Set up SendGrid account + domain auth | P0 | 2h |
| Create /api/email/send-invoice route | P0 | 4h |
| Build send confirmation UI | P0 | 2h |
| Add PDF preview before send | P1 | 3h |
| Include photos in PDF | P1 | 3h |

---

## Deliverable

Users can generate PDFs and email invoices

---

## Technical Details

### 1. Install Dependencies

```bash
npm install @react-pdf/renderer
npm install @sendgrid/mail
```

### 2. PDF Template

```typescript
// src/lib/pdf/invoice-template.tsx
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font
} from '@react-pdf/renderer'

// Register fonts (optional - for better typography)
Font.register({
  family: 'Inter',
  fonts: [
    { src: '/fonts/Inter-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/Inter-Bold.ttf', fontWeight: 'bold' },
  ]
})

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  businessInfo: {
    maxWidth: '50%',
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  invoiceDetails: {
    alignItems: 'flex-end',
  },
  invoiceNumber: {
    fontSize: 12,
    marginTop: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  billTo: {
    marginBottom: 20,
  },
  customerName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  colDescription: { width: '40%' },
  colQty: { width: '15%', textAlign: 'center' },
  colUnit: { width: '10%', textAlign: 'center' },
  colPrice: { width: '17.5%', textAlign: 'right' },
  colTotal: { width: '17.5%', textAlign: 'right' },
  totalsSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  totalLabel: {
    width: 100,
    textAlign: 'right',
    marginRight: 20,
  },
  totalValue: {
    width: 80,
    textAlign: 'right',
  },
  grandTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    borderTopWidth: 2,
    borderTopColor: '#1f2937',
    paddingTop: 8,
    marginTop: 8,
  },
  paymentSection: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  paymentTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  paymentLabel: {
    width: 80,
    color: '#6b7280',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 9,
  },
  photosPage: {
    padding: 40,
  },
  photosTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photo: {
    width: '48%',
    height: 200,
    objectFit: 'cover',
    marginBottom: 10,
  },
})

interface InvoicePDFProps {
  invoice: {
    invoice_number: string
    invoice_date: string
    due_date: string
    customer_name: string
    customer_emails: string[]
    job_address?: string | null
    line_items: {
      description: string
      quantity: number
      unit: string
      unit_price: number
      line_total: number
    }[]
    subtotal: number
    gst_amount: number
    total: number
    gst_enabled: boolean
    notes?: string | null
  }
  businessProfile: {
    trading_name: string
    business_name?: string | null
    abn?: string | null
    address?: string | null
    bank_bsb?: string | null
    bank_account?: string | null
    payid?: string | null
    payment_link?: string | null
    default_footer_note?: string | null
  }
  photos?: { url: string }[]
}

export function InvoicePDF({ invoice, businessProfile, photos }: InvoicePDFProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.businessInfo}>
            <Text style={styles.businessName}>{businessProfile.trading_name}</Text>
            {businessProfile.business_name && (
              <Text>{businessProfile.business_name}</Text>
            )}
            {businessProfile.abn && (
              <Text>ABN: {businessProfile.abn}</Text>
            )}
            {businessProfile.address && (
              <Text>{businessProfile.address}</Text>
            )}
          </View>
          <View style={styles.invoiceDetails}>
            <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
            <Text style={styles.invoiceNumber}>#{invoice.invoice_number}</Text>
            <Text>Date: {formatDate(invoice.invoice_date)}</Text>
            <Text>Due: {formatDate(invoice.due_date)}</Text>
          </View>
        </View>

        {/* Bill To */}
        <View style={styles.billTo}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <Text style={styles.customerName}>{invoice.customer_name}</Text>
          {invoice.customer_emails.map((email, i) => (
            <Text key={i}>{email}</Text>
          ))}
          {invoice.job_address && (
            <>
              <Text style={{ marginTop: 8, color: '#6b7280' }}>Job Location:</Text>
              <Text>{invoice.job_address}</Text>
            </>
          )}
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDescription}>Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colUnit}>Unit</Text>
            <Text style={styles.colPrice}>Price</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {invoice.line_items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUnit}>{item.unit}</Text>
              <Text style={styles.colPrice}>{formatCurrency(item.unit_price)}</Text>
              <Text style={styles.colTotal}>{formatCurrency(item.line_total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          {invoice.gst_enabled && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>GST (10%):</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.gst_amount)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.total)} AUD</Text>
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.paymentSection}>
          <Text style={styles.paymentTitle}>Payment Details</Text>
          {businessProfile.bank_bsb && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>BSB:</Text>
              <Text>{businessProfile.bank_bsb}</Text>
            </View>
          )}
          {businessProfile.bank_account && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Account:</Text>
              <Text>{businessProfile.bank_account}</Text>
            </View>
          )}
          {businessProfile.payid && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>PayID:</Text>
              <Text>{businessProfile.payid}</Text>
            </View>
          )}
          {businessProfile.payment_link && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Pay Online:</Text>
              <Text style={{ color: '#2563eb' }}>{businessProfile.payment_link}</Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={[styles.section, { marginTop: 20 }]}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          {businessProfile.default_footer_note || 'Thank you for your business!'}
        </Text>
      </Page>

      {/* Photos Page (if any) */}
      {photos && photos.length > 0 && (
        <Page size="A4" style={styles.photosPage}>
          <Text style={styles.photosTitle}>Work Photos</Text>
          <View style={styles.photosGrid}>
            {photos.map((photo, i) => (
              <Image key={i} src={photo.url} style={styles.photo} />
            ))}
          </View>
        </Page>
      )}
    </Document>
  )
}
```

### 3. PDF Generation API Route

```typescript
// src/app/api/pdf/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF } from '@/lib/pdf/invoice-template'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { invoiceId } = await request.json()

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch invoice with business profile
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        business_profile:business_profiles(*),
        line_items:invoice_line_items(*),
        photos:invoice_photos(*)
      `)
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Get signed URLs for photos
    const photosWithUrls = await Promise.all(
      invoice.photos.map(async (photo: any) => {
        const { data } = await supabase.storage
          .from('invoice-photos')
          .createSignedUrl(photo.storage_path, 3600)
        return { url: data?.signedUrl }
      })
    )

    // Calculate line totals if not present
    const lineItems = invoice.line_items.map((item: any) => ({
      ...item,
      line_total: item.line_total || (item.quantity * item.unit_price)
    }))

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      <InvoicePDF
        invoice={{
          ...invoice,
          line_items: lineItems,
        }}
        businessProfile={invoice.business_profile}
        photos={photosWithUrls.filter((p: any) => p.url)}
      />
    )

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
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
```

### 4. SendGrid Configuration

```typescript
// src/lib/email/sendgrid.ts
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

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
      email: process.env.SENDGRID_FROM_EMAIL!,
      name: 'Syntyx Invoices'
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
            This invoice was sent via <a href="https://invoices.syntyxlabs.com" style="color: #6b7280;">Syntyx Invoices</a>
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
        disposition: 'attachment'
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
  dueDate,
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
      email: process.env.SENDGRID_FROM_EMAIL!,
      name: 'Syntyx Invoices'
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
        disposition: 'attachment'
      }
    ]
  }

  return sgMail.send(msg)
}
```

### 5. Send Invoice API Route

```typescript
// src/app/api/email/send-invoice/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF } from '@/lib/pdf/invoice-template'
import { sendInvoiceEmail } from '@/lib/email/sendgrid'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { invoiceId } = await request.json()

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch invoice with all related data
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        business_profile:business_profiles(*),
        line_items:invoice_line_items(*),
        photos:invoice_photos(*),
        user:users(email)
      `)
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Validate invoice can be sent
    if (!invoice.customer_emails?.length) {
      return NextResponse.json(
        { error: 'No customer email addresses' },
        { status: 400 }
      )
    }

    // Get signed URLs for photos
    const photosWithUrls = await Promise.all(
      invoice.photos.map(async (photo: any) => {
        const { data } = await supabase.storage
          .from('invoice-photos')
          .createSignedUrl(photo.storage_path, 3600)
        return { url: data?.signedUrl }
      })
    )

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      <InvoicePDF
        invoice={{
          ...invoice,
          line_items: invoice.line_items.map((item: any) => ({
            ...item,
            line_total: item.line_total || (item.quantity * item.unit_price)
          })),
        }}
        businessProfile={invoice.business_profile}
        photos={photosWithUrls.filter((p: any) => p.url)}
      />
    )

    // Send email
    await sendInvoiceEmail({
      to: invoice.customer_emails,
      invoiceNumber: invoice.invoice_number,
      businessName: invoice.business_profile.trading_name,
      customerName: invoice.customer_name,
      total: invoice.total,
      dueDate: invoice.due_date,
      pdfBuffer: Buffer.from(pdfBuffer),
      paymentLink: invoice.business_profile.payment_link,
      replyTo: invoice.user.email
    })

    // Update invoice status
    await supabase
      .from('invoices')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)

    // Store PDF in storage (optional, for resending)
    const pdfPath = `${user.id}/${invoiceId}/invoice.pdf`
    await supabase.storage
      .from('invoice-pdfs')
      .upload(pdfPath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
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
```

### 6. Send Confirmation UI

```typescript
// src/components/invoice/SendConfirmationDialog.tsx
'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Mail, Check } from 'lucide-react'

interface SendConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoiceNumber: string
  customerEmails: string[]
  total: number
  onConfirm: () => Promise<void>
}

export function SendConfirmationDialog({
  open,
  onOpenChange,
  invoiceNumber,
  customerEmails,
  total,
  onConfirm
}: SendConfirmationDialogProps) {
  const [isSending, setIsSending] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    setIsSending(true)
    setError(null)

    try {
      await onConfirm()
      setIsSent(true)

      // Auto close after success
      setTimeout(() => {
        onOpenChange(false)
        setIsSent(false)
      }, 2000)

    } catch (err) {
      setError('Failed to send invoice. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isSent ? 'Invoice Sent!' : 'Send Invoice'}
          </DialogTitle>
          <DialogDescription>
            {isSent
              ? `Invoice ${invoiceNumber} has been sent successfully.`
              : `Send invoice ${invoiceNumber} for $${total.toFixed(2)} AUD?`
            }
          </DialogDescription>
        </DialogHeader>

        {!isSent && (
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-2">
              This invoice will be sent to:
            </p>
            <ul className="text-sm">
              {customerEmails.map((email, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {email}
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <DialogFooter>
          {isSent ? (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              <span>Sent successfully</span>
            </div>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button onClick={handleSend} disabled={isSending}>
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invoice
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

## SendGrid Domain Authentication

1. Create SendGrid account at https://sendgrid.com
2. Go to Settings → Sender Authentication
3. Add domain: `syntyxlabs.com`
4. Add DNS records (CNAME) provided by SendGrid
5. Verify domain
6. Create API key with Mail Send permission
7. Add to environment: `SENDGRID_API_KEY=SG.xxx`

---

## File Structure

```
src/
├── app/
│   └── api/
│       ├── pdf/
│       │   └── generate/
│       │       └── route.ts
│       └── email/
│           └── send-invoice/
│               └── route.ts
├── components/
│   └── invoice/
│       └── SendConfirmationDialog.tsx
└── lib/
    ├── pdf/
    │   └── invoice-template.tsx
    └── email/
        └── sendgrid.ts
```

---

## Test Specifications

### Unit Tests

```typescript
// src/lib/pdf/__tests__/invoice-template.test.tsx
describe('InvoicePDF Template', () => {
  it('renders business header with trading name')
  it('renders ABN when provided')
  it('renders customer bill-to section')
  it('renders line items table correctly')
  it('renders GST row when enabled')
  it('hides GST row when disabled')
  it('renders payment details section')
  it('renders photos page when photos provided')
  it('formats dates in Australian format (DD Month YYYY)')
  it('formats currency with 2 decimal places')
  it('renders footer note')
})

// src/lib/email/__tests__/sendgrid.test.ts
describe('SendGrid Email Functions', () => {
  describe('sendInvoiceEmail', () => {
    it('constructs email with correct recipient')
    it('includes invoice number in subject')
    it('attaches PDF as base64')
    it('includes Pay Now button when payment link provided')
    it('excludes Pay Now button when no payment link')
    it('sets reply-to to user email')
    it('formats due date correctly')
  })

  describe('sendReminderEmail', () => {
    it('includes overdue days in subject when applicable')
    it('uses red styling for overdue invoices')
    it('uses neutral styling for non-overdue')
    it('attaches updated PDF')
  })
})
```

### Integration Tests

```typescript
// src/app/api/pdf/__tests__/generate.test.ts
describe('POST /api/pdf/generate', () => {
  it('returns 400 if no invoice ID')
  it('returns 404 if invoice not found')
  it('generates PDF buffer')
  it('includes line items with totals')
  it('includes photos with signed URLs')
  it('returns PDF content-type header')
  it('sets correct filename in content-disposition')
})

// src/app/api/email/__tests__/send-invoice.test.ts
describe('POST /api/email/send-invoice', () => {
  it('returns 401 if not authenticated')
  it('returns 404 if invoice not found')
  it('returns 400 if no customer emails')
  it('generates PDF and sends via SendGrid')
  it('updates invoice status to sent')
  it('records sent_at timestamp')
  it('stores PDF in Supabase Storage')
  it('returns success message with recipient emails')
  it('returns 500 on SendGrid failure')
})

// src/components/invoice/__tests__/SendConfirmationDialog.test.tsx
describe('SendConfirmationDialog', () => {
  it('displays invoice number in title')
  it('displays total amount')
  it('lists all recipient emails')
  it('shows loading state during send')
  it('shows success message after send')
  it('auto-closes after success')
  it('displays error message on failure')
  it('allows cancellation')
})
```

### E2E Tests

```typescript
// e2e/send-invoice.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Send Invoice Flow', () => {
  test('user sees confirmation dialog before sending', async ({ page }) => {
    await page.goto('/invoices/[id]/edit') // With complete invoice
    await page.click('button:has-text("Send Invoice")')
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    await expect(page.locator('text=Send Invoice')).toBeVisible()
  })

  test('user sees recipient emails in dialog', async ({ page }) => {
    await page.goto('/invoices/[id]/edit')
    await page.click('button:has-text("Send Invoice")')
    await expect(page.locator('text=customer@example.com')).toBeVisible()
  })

  test('invoice marked as sent after email delivered', async ({ page }) => {
    await page.goto('/invoices/[id]/edit')
    await page.click('button:has-text("Send Invoice")')
    await page.click('button:has-text("Send Invoice"):visible')
    await expect(page.locator('text=Sent successfully')).toBeVisible()

    // Navigate to dashboard and verify status
    await page.goto('/dashboard')
    await expect(page.locator('[data-testid="status-badge"]:has-text("Sent")')).toBeVisible()
  })

  test('user can download PDF preview', async ({ page }) => {
    await page.goto('/invoices/[id]')
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Download PDF")'),
    ])
    expect(download.suggestedFilename()).toContain('Invoice')
  })
})
```

---

## Acceptance Criteria

### Functional Requirements
- [ ] PDF generates with correct AU invoice format
- [ ] PDF includes all line items with totals
- [ ] PDF includes business details (ABN, address, bank)
- [ ] PDF includes payment details section
- [ ] PDF includes photos on separate page (if any)
- [ ] SendGrid account configured with domain auth
- [ ] Emails send from invoices@syntyxlabs.com
- [ ] Reply-To set to user's email
- [ ] PDF attached to email correctly
- [ ] Pay Now button appears if payment link set
- [ ] Invoice status updates to "sent" after sending
- [ ] sent_at timestamp recorded
- [ ] Send confirmation dialog shows recipients
- [ ] Success/error feedback displayed
- [ ] PDF stored in Supabase Storage for resending

### Testing Requirements
- [ ] PDF template rendering tests pass
- [ ] SendGrid email function tests pass
- [ ] API route tests pass with mocked services
- [ ] E2E send flow passes
- [ ] PDF download works correctly
