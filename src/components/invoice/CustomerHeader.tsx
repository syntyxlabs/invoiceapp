'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { validateABN, formatABN } from '@/lib/validation/abn'
import type { InvoiceDraft } from '@/lib/openai/schemas'

interface CustomerHeaderProps {
  customer: InvoiceDraft['customer']
  invoiceDetails: InvoiceDraft['invoice']
  onChange: (customer: InvoiceDraft['customer']) => void
  onDetailsChange: (details: Partial<InvoiceDraft['invoice']>) => void
}

export function CustomerHeader({
  customer,
  invoiceDetails,
  onChange,
  onDetailsChange
}: CustomerHeaderProps) {
  const handleAbnChange = (value: string) => {
    // Allow only digits and spaces
    const cleaned = value.replace(/[^\d\s]/g, '')
    onChange({ ...customer, abn: cleaned || null })
  }

  const handleAbnBlur = (value: string) => {
    const digits = value.replace(/\s/g, '')
    if (digits && validateABN(digits)) {
      onChange({ ...customer, abn: formatABN(digits) })
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Customer Info */}
      <div className="space-y-4">
        <h3 className="font-medium">Customer</h3>

        <div>
          <Label htmlFor="customerName">Name</Label>
          <Input
            id="customerName"
            value={customer.name}
            onChange={(e) => onChange({ ...customer, name: e.target.value })}
            placeholder="Customer name"
          />
        </div>

        <div>
          <Label htmlFor="customerEmail">Email(s)</Label>
          <Input
            id="customerEmail"
            value={customer.emails.join(', ')}
            onChange={(e) => onChange({
              ...customer,
              emails: e.target.value.split(/[,;]/).map(s => s.trim()).filter(Boolean)
            })}
            placeholder="email@example.com"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Separate multiple emails with commas
          </p>
        </div>

        <div>
          <Label htmlFor="customerAbn">Customer ABN (optional)</Label>
          <Input
            id="customerAbn"
            value={customer.abn || ''}
            onChange={(e) => handleAbnChange(e.target.value)}
            onBlur={(e) => handleAbnBlur(e.target.value)}
            placeholder="XX XXX XXX XXX"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Required for B2B invoices over $1,000
          </p>
        </div>

        <div>
          <Label htmlFor="jobAddress">Job Address (optional)</Label>
          <Input
            id="jobAddress"
            value={invoiceDetails.job_address || ''}
            onChange={(e) => onDetailsChange({
              job_address: e.target.value || null
            })}
            placeholder="Job site address"
          />
        </div>
      </div>

      {/* Invoice Details */}
      <div className="space-y-4">
        <h3 className="font-medium">Invoice Details</h3>

        <div>
          <Label htmlFor="invoiceDate">Invoice Date</Label>
          <Input
            id="invoiceDate"
            type="date"
            value={invoiceDetails.invoice_date}
            onChange={(e) => onDetailsChange({ invoice_date: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            value={invoiceDetails.due_date}
            onChange={(e) => onDetailsChange({ due_date: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}
