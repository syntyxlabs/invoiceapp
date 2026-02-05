'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Check, Copy, CreditCard, Building2, Smartphone, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PaymentDetailsProps {
  invoice: {
    id: string
    invoice_number: string
    total: number
    due_date: string
    customer_name: string
    status: string
  }
  businessProfile: {
    trading_name: string
    bank_bsb: string | null
    bank_account: string | null
    payid: string | null
    payment_link: string | null
    logo_url: string | null
  } | null
}

function formatBsbDisplay(bsb: string): string {
  const digits = bsb.replace(/\D/g, '')
  if (digits.length === 6) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`
  }
  return bsb
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = value
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-8 w-8 p-0"
      title={`Copy ${label}`}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4 text-muted-foreground" />
      )}
    </Button>
  )
}

function PaymentRow({
  label,
  value,
  copyValue,
}: {
  label: string
  value: string
  copyValue?: string
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono font-medium">{value}</span>
        {copyValue && <CopyButton value={copyValue} label={label} />}
      </div>
    </div>
  )
}

export function PaymentDetails({ invoice, businessProfile }: PaymentDetailsProps) {
  if (!businessProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Payment information is not available.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const hasBankTransfer = businessProfile.bank_bsb || businessProfile.bank_account
  const hasPayId = !!businessProfile.payid
  const hasPaymentLink = !!businessProfile.payment_link
  const isPaid = invoice.status === 'paid'

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          {businessProfile.logo_url && (
            <div className="flex justify-center mb-4">
              <Image
                src={businessProfile.logo_url}
                alt={businessProfile.trading_name}
                width={64}
                height={64}
                className="rounded-lg object-contain"
              />
            </div>
          )}
          <h1 className="text-2xl font-bold">{businessProfile.trading_name}</h1>
          <p className="text-muted-foreground">Payment Details</p>
        </div>

        {/* Invoice Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Invoice Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <PaymentRow label="Invoice" value={invoice.invoice_number} />
            <PaymentRow label="Customer" value={invoice.customer_name} />
            <PaymentRow label="Due Date" value={formatDate(invoice.due_date)} />
            <div className="flex items-center justify-between py-3 border-t border-border mt-2">
              <span className="font-semibold">Amount Due</span>
              <span className="text-xl font-bold">
                {isPaid ? (
                  <span className="text-green-600">PAID</span>
                ) : (
                  formatCurrency(invoice.total)
                )}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Bank Transfer */}
        {hasBankTransfer && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Bank Transfer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {businessProfile.bank_bsb && (
                <PaymentRow
                  label="BSB"
                  value={formatBsbDisplay(businessProfile.bank_bsb)}
                  copyValue={businessProfile.bank_bsb.replace(/\D/g, '')}
                />
              )}
              {businessProfile.bank_account && (
                <PaymentRow
                  label="Account"
                  value={businessProfile.bank_account}
                  copyValue={businessProfile.bank_account}
                />
              )}
              <PaymentRow
                label="Reference"
                value={invoice.invoice_number}
                copyValue={invoice.invoice_number}
              />
              <p className="text-xs text-muted-foreground pt-2">
                Please include the reference when making your payment.
              </p>
            </CardContent>
          </Card>
        )}

        {/* PayID */}
        {hasPayId && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                PayID
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <PaymentRow
                label="PayID"
                value={businessProfile.payid!}
                copyValue={businessProfile.payid!}
              />
              <p className="text-xs text-muted-foreground pt-2">
                Use your banking app to pay via PayID.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Payment Link */}
        {hasPaymentLink && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Pay Online
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <a
                  href={businessProfile.payment_link!}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Pay Now
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Invoice from {businessProfile.trading_name}
        </p>
      </div>
    </div>
  )
}
