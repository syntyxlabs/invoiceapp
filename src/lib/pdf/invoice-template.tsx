import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Link,
} from '@react-pdf/renderer'

// Clean, professional color palette
const colors = {
  primary: '#2563eb',
  text: '#111827',
  textMuted: '#6b7280',
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  white: '#ffffff',
}

// Accent line color
const accentBlue = '#005fE6'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: colors.text,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 20,
  },
  logoWrap: {
    width: 43,
    height: 43,
    flexShrink: 0,
    marginRight: 12,
  },
  logo: {
    width: 43,
    height: 43,
    objectFit: 'contain',
  },
  businessInfo: {
    flex: 1,
  },
  tradingName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  businessDetail: {
    fontSize: 9,
    color: colors.textMuted,
    marginBottom: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
    width: 180,
  },
  headerInvoiceLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
  },
  headerDateLabel: {
    fontSize: 8,
    color: colors.textMuted,
    marginTop: 6,
  },
  headerDateValue: {
    fontSize: 10,
    color: colors.text,
    marginTop: 1,
  },
  // Accent line
  accentLine: {
    marginHorizontal: -40,
    marginTop: 20,
    marginBottom: 25,
    height: 2,
    backgroundColor: accentBlue,
  },
  // Thin accent line for photos page
  thinAccentLine: {
    marginHorizontal: -40,
    marginBottom: 20,
    height: 1.5,
    backgroundColor: accentBlue,
  },
  // Title section
  titleSection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  taglineText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  // Three-column info section
  infoRow: {
    flexDirection: 'row',
    marginBottom: 25,
    gap: 20,
  },
  infoColumn: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  infoName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 3,
  },
  infoDetail: {
    fontSize: 9,
    color: colors.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    color: colors.text,
    marginBottom: 2,
  },
  // Items table
  itemsSectionLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tableCell: {
    fontSize: 9,
    color: colors.text,
  },
  colItems: { width: '45%' },
  colQty: { width: '15%', textAlign: 'center' },
  colPrice: { width: '20%', textAlign: 'right' },
  colAmount: { width: '20%', textAlign: 'right' },
  // Totals
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  totalsBox: {
    width: 200,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 9,
    color: colors.textMuted,
  },
  totalValue: {
    fontSize: 9,
    color: colors.text,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
  },
  grandTotalValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
  },
  gstNote: {
    fontSize: 8,
    color: colors.textMuted,
    marginTop: 10,
  },
  // Payment section
  paymentSection: {
    marginTop: 30,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 20,
    flexDirection: 'row',
  },
  qrContainer: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  qrCode: {
    width: 70,
    height: 70,
  },
  qrLabel: {
    fontSize: 7,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  paymentDetails: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: 4,
    fontSize: 10,
  },
  paymentLabel: {
    width: 80,
    color: colors.textMuted,
    fontSize: 9,
  },
  paymentValue: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 9,
  },
  paymentLink: {
    color: colors.primary,
    textDecoration: 'none',
    fontSize: 9,
  },
  // Notes
  notesSection: {
    marginTop: 20,
  },
  notesTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 9,
    color: colors.text,
    lineHeight: 1.4,
  },
  // Page number
  pageNumber: {
    position: 'absolute',
    bottom: 25,
    right: 40,
    fontSize: 8,
    color: colors.textMuted,
  },
  // Photos page
  photosPage: {
    padding: 40,
    fontFamily: 'Helvetica',
    color: colors.text,
  },
  photosTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
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
      item_type?: 'labour' | 'material'
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

  // Split items by type
  const labourItems = invoice.line_items.filter(item => (item.item_type || 'labour') === 'labour')
  const materialItems = invoice.line_items.filter(item => item.item_type === 'material')
  const hasBothTypes = labourItems.length > 0 && materialItems.length > 0

  const labourSubtotal = labourItems.reduce((sum, item) => sum + item.line_total, 0)
  const materialSubtotal = materialItems.reduce((sum, item) => sum + item.line_total, 0)

  const qrCodeUrl = getPaymentQrUrl(businessProfile.payid, businessProfile.payment_link)
  const hasPaymentInfo = businessProfile.bank_bsb || businessProfile.bank_account || businessProfile.payid || businessProfile.payment_link

  const showBusinessName =
    businessProfile.business_name &&
    businessProfile.business_name !== businessProfile.trading_name

  const paymentTitle =
    businessProfile.payment_link || businessProfile.payid
      ? 'Pay online'
      : 'Payment Details'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Page number */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {businessProfile.logo_url && (
              <View style={styles.logoWrap}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image src={businessProfile.logo_url} style={styles.logo} />
              </View>
            )}
            <View style={styles.businessInfo}>
              <Text style={styles.tradingName}>{businessProfile.trading_name}</Text>
              {showBusinessName && (
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
          <View style={styles.headerRight}>
            <Text style={styles.headerInvoiceLabel}>Tax Invoice #{invoice.invoice_number}</Text>
            <Text style={styles.headerDateLabel}>Issue date</Text>
            <Text style={styles.headerDateValue}>{formatDate(invoice.invoice_date)}</Text>
          </View>
        </View>

        {/* Accent Line */}
        <View style={styles.accentLine} />

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.titleText}>Tax Invoice #{invoice.invoice_number}</Text>
          <Text style={styles.taglineText}>
            {businessProfile.default_footer_note || 'Thank you for your business.'}
          </Text>
        </View>

        {/* Three-Column Info Section */}
        <View style={styles.infoRow}>
          {/* Customer */}
          <View style={styles.infoColumn}>
            <Text style={styles.sectionLabel}>Customer</Text>
            <Text style={styles.infoName}>{invoice.customer_name}</Text>
            {invoice.customer_emails.map((email, i) => (
              <Text key={i} style={styles.infoDetail}>{email}</Text>
            ))}
            {invoice.customer_abn && (
              <Text style={styles.infoDetail}>ABN: {formatABN(invoice.customer_abn)}</Text>
            )}
          </View>

          {/* Invoice Details */}
          <View style={styles.infoColumn}>
            <Text style={styles.sectionLabel}>Invoice Details</Text>
            <Text style={styles.infoDetail}>{formatDate(invoice.invoice_date)}</Text>
            {invoice.job_address && (
              <Text style={styles.infoDetail}>{invoice.job_address}</Text>
            )}
            <Text style={styles.infoDetail}>{formatCurrency(displayTotal)}</Text>
          </View>

          {/* Payment */}
          <View style={styles.infoColumn}>
            <Text style={styles.sectionLabel}>Payment</Text>
            <Text style={styles.infoDetail}>Due {formatDate(invoice.due_date)}</Text>
            <Text style={styles.infoDetail}>{formatCurrency(displayTotal)}</Text>
          </View>
        </View>

        {/* Items Table */}
        {hasBothTypes ? (
          <>
            {/* Labour Section */}
            <Text style={styles.itemsSectionLabel}>Labour</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colItems]}>Items</Text>
              <Text style={[styles.tableHeaderText, styles.colQty]}>Quantity</Text>
              <Text style={[styles.tableHeaderText, styles.colPrice]}>Rate</Text>
              <Text style={[styles.tableHeaderText, styles.colAmount]}>Amount</Text>
            </View>
            {labourItems.map((item, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colItems]}>
                  {item.description}{invoice.gst_enabled ? ' *' : ''}
                </Text>
                <Text style={[styles.tableCell, styles.colQty]}>
                  {item.quantity} {item.unit}
                </Text>
                <Text style={[styles.tableCell, styles.colPrice]}>
                  {formatCurrency(item.unit_price)}
                </Text>
                <Text style={[styles.tableCell, styles.colAmount]}>
                  {formatCurrency(item.line_total)}
                </Text>
              </View>
            ))}
            <View style={styles.totalsContainer}>
              <View style={styles.totalsBox}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Labour Subtotal</Text>
                  <Text style={styles.totalValue}>{formatCurrency(labourSubtotal)}</Text>
                </View>
              </View>
            </View>

            {/* Materials Section */}
            <Text style={[styles.itemsSectionLabel, { marginTop: 20 }]}>Materials</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colItems]}>Items</Text>
              <Text style={[styles.tableHeaderText, styles.colQty]}>Quantity</Text>
              <Text style={[styles.tableHeaderText, styles.colPrice]}>Unit Price</Text>
              <Text style={[styles.tableHeaderText, styles.colAmount]}>Amount</Text>
            </View>
            {materialItems.map((item, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colItems]}>
                  {item.description}{invoice.gst_enabled ? ' *' : ''}
                </Text>
                <Text style={[styles.tableCell, styles.colQty]}>
                  {item.quantity} {item.unit}
                </Text>
                <Text style={[styles.tableCell, styles.colPrice]}>
                  {formatCurrency(item.unit_price)}
                </Text>
                <Text style={[styles.tableCell, styles.colAmount]}>
                  {formatCurrency(item.line_total)}
                </Text>
              </View>
            ))}
            <View style={styles.totalsContainer}>
              <View style={styles.totalsBox}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Materials Subtotal</Text>
                  <Text style={styles.totalValue}>{formatCurrency(materialSubtotal)}</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.itemsSectionLabel}>Items</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colItems]}>Items</Text>
              <Text style={[styles.tableHeaderText, styles.colQty]}>Quantity</Text>
              <Text style={[styles.tableHeaderText, styles.colPrice]}>Price</Text>
              <Text style={[styles.tableHeaderText, styles.colAmount]}>Amount</Text>
            </View>
            {invoice.line_items.map((item, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colItems]}>
                  {item.description}{invoice.gst_enabled ? ' *' : ''}
                </Text>
                <Text style={[styles.tableCell, styles.colQty]}>
                  {item.quantity} {item.unit}
                </Text>
                <Text style={[styles.tableCell, styles.colPrice]}>
                  {formatCurrency(item.unit_price)}
                </Text>
                <Text style={[styles.tableCell, styles.colAmount]}>
                  {formatCurrency(item.line_total)}
                </Text>
              </View>
            ))}
          </>
        )}

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
              <Text style={styles.grandTotalLabel}>Total Due</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(displayTotal)}</Text>
            </View>
          </View>
        </View>

        {/* GST Note */}
        {invoice.gst_enabled && (
          <Text style={styles.gstNote}>(*) Taxable item</Text>
        )}

        {/* Payment Details */}
        {hasPaymentInfo && (
          <View style={styles.paymentSection}>
            {qrCodeUrl && (
              <View style={styles.qrContainer}>
                <View style={{ width: 70, height: 70 }}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image src={qrCodeUrl} style={styles.qrCode} />
                </View>
                <Text style={styles.qrLabel}>Scan to pay</Text>
              </View>
            )}
            <View style={styles.paymentDetails}>
              <Text style={styles.paymentTitle}>{paymentTitle}</Text>
              {businessProfile.payment_link && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Link:</Text>
                  <Link src={businessProfile.payment_link} style={styles.paymentLink}>
                    <Text>{businessProfile.payment_link}</Text>
                  </Link>
                </View>
              )}
              {businessProfile.payid && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>PayID:</Text>
                  <Text style={styles.paymentValue}>{businessProfile.payid}</Text>
                </View>
              )}
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
            </View>
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}
      </Page>

      {/* Photos Page (if any) */}
      {photos && photos.length > 0 && (
        <Page size="A4" style={styles.photosPage}>
          {/* Page number */}
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
            fixed
          />
          {/* Thin accent line */}
          <View style={styles.thinAccentLine} />

          <Text style={styles.photosTitle}>Work Photos</Text>
          <View style={styles.photosGrid}>
            {photos.map((photo, i) => (
              <View key={i} style={styles.photoContainer}>
                <View style={{ width: '100%', height: 200 }}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image src={photo.url} style={styles.photo} />
                </View>
              </View>
            ))}
          </View>
        </Page>
      )}
    </Document>
  )
}
