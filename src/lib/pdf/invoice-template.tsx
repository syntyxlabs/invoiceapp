import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Link,
} from '@react-pdf/renderer'

// Brand colors
const colors = {
  primary: '#1e40af', // Blue
  primaryLight: '#3b82f6',
  secondary: '#64748b',
  accent: '#0891b2',
  background: '#f8fafc',
  border: '#e2e8f0',
  text: '#1e293b',
  textLight: '#64748b',
  success: '#16a34a',
  white: '#ffffff',
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: colors.text,
  },
  // Header with logo
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    maxWidth: '55%',
  },
  logo: {
    width: 60,
    height: 60,
    objectFit: 'contain',
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 2,
  },
  businessDetail: {
    fontSize: 9,
    color: colors.textLight,
    marginBottom: 1,
  },
  invoiceTitleContainer: {
    alignItems: 'flex-end',
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 1,
  },
  invoiceNumber: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  invoiceMeta: {
    fontSize: 10,
    color: colors.text,
    marginTop: 2,
  },
  // Two column layout for bill to / invoice details
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    gap: 40,
  },
  infoColumn: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  customerName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  customerDetail: {
    fontSize: 10,
    color: colors.textLight,
    marginBottom: 2,
  },
  abnLabel: {
    fontSize: 9,
    color: colors.textLight,
  },
  // Line items table
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: 10,
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowAlt: {
    backgroundColor: colors.background,
  },
  colDescription: { width: '40%' },
  colQty: { width: '12%', textAlign: 'center' },
  colUnit: { width: '10%', textAlign: 'center' },
  colPrice: { width: '19%', textAlign: 'right' },
  colTotal: { width: '19%', textAlign: 'right' },
  // Totals section
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  totalsBox: {
    width: 220,
    backgroundColor: colors.background,
    padding: 15,
    borderRadius: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    fontSize: 10,
  },
  totalLabel: {
    color: colors.textLight,
  },
  totalValue: {
    fontWeight: 'bold',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    paddingTop: 10,
    marginTop: 6,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  gstNote: {
    fontSize: 8,
    color: colors.textLight,
    marginTop: 8,
    textAlign: 'right',
  },
  // Payment section
  paymentSection: {
    flexDirection: 'row',
    marginTop: 30,
    padding: 20,
    backgroundColor: colors.background,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: 4,
    fontSize: 10,
  },
  paymentLabel: {
    width: 70,
    color: colors.textLight,
  },
  paymentValue: {
    flex: 1,
    fontWeight: 'bold',
  },
  paymentLink: {
    color: colors.primaryLight,
    textDecoration: 'none',
  },
  qrContainer: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 20,
  },
  qrCode: {
    width: 70,
    height: 70,
  },
  qrLabel: {
    fontSize: 7,
    color: colors.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  // Notes section
  notesSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: colors.background,
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.textLight,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: 10,
    color: colors.text,
    lineHeight: 1.4,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: 9,
    color: colors.textLight,
  },
  // Photos page
  photosPage: {
    padding: 40,
  },
  photosTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  photoContainer: {
    width: '48%',
    marginBottom: 15,
  },
  photo: {
    width: '100%',
    height: 200,
    objectFit: 'cover',
    borderRadius: 4,
  },
})

export interface InvoicePDFProps {
  invoice: {
    invoice_number: string
    invoice_date: string
    due_date: string
    customer_name: string
    customer_emails: string[]
    customer_abn?: string | null
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
    prices_include_gst?: boolean
    notes?: string | null
  }
  businessProfile: {
    trading_name: string
    business_name?: string | null
    abn?: string | null
    address?: string | null
    logo_url?: string | null
    bank_bsb?: string | null
    bank_account?: string | null
    payid?: string | null
    payment_link?: string | null
    default_footer_note?: string | null
  }
  photos?: { url: string }[]
}

// Generate QR code URL for payment
function getPaymentQrUrl(payid?: string | null, paymentLink?: string | null): string | null {
  const content = payid || paymentLink
  if (!content) return null

  // Use QR code API to generate QR code
  const encoded = encodeURIComponent(content)
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encoded}&bgcolor=f8fafc`
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

  const formatABN = (abn: string) => {
    // Format as XX XXX XXX XXX
    const digits = abn.replace(/\D/g, '')
    if (digits.length !== 11) return abn
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`
  }

  // Calculate display values based on GST settings
  const pricesIncludeGst = invoice.prices_include_gst ?? false
  let displaySubtotal = invoice.subtotal
  let displayGst = invoice.gst_amount
  let displayTotal = invoice.total

  if (pricesIncludeGst && invoice.gst_enabled) {
    // Prices include GST, so subtotal is actually the GST-inclusive total
    displayTotal = invoice.subtotal
    displaySubtotal = invoice.subtotal / 1.1
    displayGst = displayTotal - displaySubtotal
  }

  const qrCodeUrl = getPaymentQrUrl(businessProfile.payid, businessProfile.payment_link)
  const hasPaymentInfo = businessProfile.bank_bsb || businessProfile.bank_account || businessProfile.payid || businessProfile.payment_link

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            {businessProfile.logo_url && (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={businessProfile.logo_url} style={styles.logo} />
            )}
            <View style={styles.businessInfo}>
              <Text style={styles.businessName}>{businessProfile.trading_name}</Text>
              {businessProfile.business_name && (
                <Text style={styles.businessDetail}>{businessProfile.business_name}</Text>
              )}
              {businessProfile.abn && (
                <Text style={styles.businessDetail}>ABN: {formatABN(businessProfile.abn)}</Text>
              )}
              {businessProfile.address && (
                <Text style={styles.businessDetail}>{businessProfile.address}</Text>
              )}
            </View>
          </View>
          <View style={styles.invoiceTitleContainer}>
            <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
            <Text style={styles.invoiceNumber}>#{invoice.invoice_number}</Text>
            <Text style={styles.invoiceMeta}>Date: {formatDate(invoice.invoice_date)}</Text>
            <Text style={styles.invoiceMeta}>Due: {formatDate(invoice.due_date)}</Text>
          </View>
        </View>

        {/* Bill To / Invoice Info Row */}
        <View style={styles.infoRow}>
          <View style={styles.infoColumn}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={styles.customerName}>{invoice.customer_name}</Text>
            {invoice.customer_emails.map((email, i) => (
              <Text key={i} style={styles.customerDetail}>{email}</Text>
            ))}
            {invoice.customer_abn && (
              <Text style={styles.abnLabel}>ABN: {formatABN(invoice.customer_abn)}</Text>
            )}
          </View>
          {invoice.job_address && (
            <View style={styles.infoColumn}>
              <Text style={styles.sectionTitle}>Job Location</Text>
              <Text style={styles.customerDetail}>{invoice.job_address}</Text>
            </View>
          )}
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDescription}>Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colUnit}>Unit</Text>
            <Text style={styles.colPrice}>
              Price {invoice.gst_enabled && pricesIncludeGst ? '(inc)' : ''}
            </Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {invoice.line_items.map((item, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUnit}>{item.unit}</Text>
              <Text style={styles.colPrice}>{formatCurrency(item.unit_price)}</Text>
              <Text style={styles.colTotal}>{formatCurrency(item.line_total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Subtotal {invoice.gst_enabled && pricesIncludeGst ? '(ex GST)' : ''}
              </Text>
              <Text style={styles.totalValue}>{formatCurrency(displaySubtotal)}</Text>
            </View>
            {invoice.gst_enabled && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>GST (10%)</Text>
                <Text style={styles.totalValue}>{formatCurrency(displayGst)}</Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>
                Total {invoice.gst_enabled ? '(inc GST)' : ''}
              </Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(displayTotal)} AUD</Text>
            </View>
            {invoice.gst_enabled && (
              <Text style={styles.gstNote}>
                {pricesIncludeGst
                  ? 'All prices shown include GST'
                  : 'All prices shown exclude GST'}
              </Text>
            )}
          </View>
        </View>

        {/* Payment Details */}
        {hasPaymentInfo && (
          <View style={styles.paymentSection}>
            <View style={styles.paymentDetails}>
              <Text style={styles.paymentTitle}>Payment Details</Text>
              {businessProfile.bank_bsb && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>BSB:</Text>
                  <Text style={styles.paymentValue}>{businessProfile.bank_bsb}</Text>
                </View>
              )}
              {businessProfile.bank_account && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Account:</Text>
                  <Text style={styles.paymentValue}>{businessProfile.bank_account}</Text>
                </View>
              )}
              {businessProfile.payid && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>PayID:</Text>
                  <Text style={styles.paymentValue}>{businessProfile.payid}</Text>
                </View>
              )}
              {businessProfile.payment_link && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Pay Online:</Text>
                  <Link src={businessProfile.payment_link} style={styles.paymentLink}>
                    <Text>{businessProfile.payment_link}</Text>
                  </Link>
                </View>
              )}
            </View>
            {qrCodeUrl && (
              <View style={styles.qrContainer}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image src={qrCodeUrl} style={styles.qrCode} />
                <Text style={styles.qrLabel}>Scan to pay</Text>
              </View>
            )}
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {businessProfile.default_footer_note || 'Thank you for your business!'}
          </Text>
        </View>
      </Page>

      {/* Photos Page (if any) */}
      {photos && photos.length > 0 && (
        <Page size="A4" style={styles.photosPage}>
          <Text style={styles.photosTitle}>Work Photos</Text>
          <View style={styles.photosGrid}>
            {photos.map((photo, i) => (
              <View key={i} style={styles.photoContainer}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image src={photo.url} style={styles.photo} />
              </View>
            ))}
          </View>
        </Page>
      )}
    </Document>
  )
}
