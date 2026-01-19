# Phase 4: Invoice Editor

**Timeline**: Week 4
**Goal**: Fully editable invoice form with AI corrections

---

## Tasks

| Task | Priority | Estimate |
|------|----------|----------|
| Build InvoiceEditor container component | P0 | 4h |
| Create LineItemTable with add/remove/edit | P0 | 6h |
| Implement live total calculations | P0 | 3h |
| Add GST toggle functionality | P0 | 2h |
| Build customer header section | P0 | 3h |
| Create CorrectionInput component | P0 | 4h |
| Create /api/ai/correct route | P0 | 3h |
| Show change summary after AI corrections | P0 | 2h |
| Add form validation | P0 | 3h |

---

## Deliverable

Complete editable invoice with AI corrections

---

## Technical Details

### 1. Invoice Editor Container

```typescript
// src/components/invoice/InvoiceEditor.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { CustomerHeader } from './CustomerHeader'
import { LineItemTable } from './LineItemTable'
import { InvoiceTotals } from './InvoiceTotals'
import { CorrectionInput } from './CorrectionInput'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import type { InvoiceDraft } from '@/lib/openai/schemas'

interface InvoiceEditorProps {
  initialDraft: InvoiceDraft
  onSave: (invoice: InvoiceDraft) => void
  onSend: (invoice: InvoiceDraft) => void
}

export function InvoiceEditor({ initialDraft, onSave, onSend }: InvoiceEditorProps) {
  const [invoice, setInvoice] = useState<InvoiceDraft>(initialDraft)
  const [changeSummary, setChangeSummary] = useState<string[]>([])
  const [isDirty, setIsDirty] = useState(false)

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = invoice.line_items.reduce((sum, item) => {
      if (item.unit_price === null) return sum
      return sum + (item.quantity * item.unit_price)
    }, 0)

    const gstAmount = invoice.invoice.gst_enabled ? subtotal * 0.10 : 0
    const total = subtotal + gstAmount

    return { subtotal, gstAmount, total }
  }, [invoice.line_items, invoice.invoice.gst_enabled])

  // Check for missing prices
  const hasMissingPrices = invoice.line_items.some(item => item.unit_price === null)

  const updateCustomer = (customer: InvoiceDraft['customer']) => {
    setInvoice(prev => ({ ...prev, customer }))
    setIsDirty(true)
  }

  const updateInvoiceDetails = (details: Partial<InvoiceDraft['invoice']>) => {
    setInvoice(prev => ({
      ...prev,
      invoice: { ...prev.invoice, ...details }
    }))
    setIsDirty(true)
  }

  const updateLineItems = (lineItems: InvoiceDraft['line_items']) => {
    setInvoice(prev => ({ ...prev, line_items: lineItems }))
    setIsDirty(true)
  }

  const handleCorrectionApplied = (updated: InvoiceDraft, summary: string[]) => {
    setInvoice(updated)
    setChangeSummary(summary)
    setIsDirty(true)

    // Clear summary after 5 seconds
    setTimeout(() => setChangeSummary([]), 5000)
  }

  const handleSave = () => {
    onSave(invoice)
    setIsDirty(false)
  }

  const handleSend = () => {
    if (hasMissingPrices) {
      alert('Please fill in all prices before sending.')
      return
    }
    onSend(invoice)
  }

  return (
    <div className="space-y-6">
      {/* Change Summary Toast */}
      {changeSummary.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm font-medium text-green-800">Changes applied:</p>
          <ul className="text-sm text-green-700 mt-1">
            {changeSummary.map((change, i) => (
              <li key={i}>• {change}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Customer Header */}
      <Card>
        <CardContent className="pt-6">
          <CustomerHeader
            customer={invoice.customer}
            invoiceDetails={invoice.invoice}
            onChange={updateCustomer}
            onDetailsChange={updateInvoiceDetails}
          />
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardContent className="pt-6">
          <LineItemTable
            items={invoice.line_items}
            onChange={updateLineItems}
          />
        </CardContent>
      </Card>

      {/* GST Toggle & Totals */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Switch
                id="gst"
                checked={invoice.invoice.gst_enabled}
                onCheckedChange={(checked) =>
                  updateInvoiceDetails({ gst_enabled: checked })
                }
              />
              <Label htmlFor="gst">Include GST (10%)</Label>
            </div>
          </div>

          <InvoiceTotals
            subtotal={totals.subtotal}
            gstAmount={totals.gstAmount}
            total={totals.total}
            gstEnabled={invoice.invoice.gst_enabled}
          />
        </CardContent>
      </Card>

      {/* AI Correction Input */}
      <Card>
        <CardContent className="pt-6">
          <CorrectionInput
            currentInvoice={invoice}
            onCorrectionApplied={handleCorrectionApplied}
          />
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardContent className="pt-6">
          <Label htmlFor="notes">Notes (optional)</Label>
          <textarea
            id="notes"
            className="w-full mt-2 p-3 border rounded-md"
            rows={3}
            value={invoice.notes || ''}
            onChange={(e) => setInvoice(prev => ({
              ...prev,
              notes: e.target.value || null
            }))}
            placeholder="Payment terms, thank you message, etc."
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={handleSave}
          disabled={!isDirty}
          className="flex-1"
        >
          Save Draft
        </Button>
        <Button
          onClick={handleSend}
          disabled={hasMissingPrices}
          className="flex-1"
        >
          Send Invoice
        </Button>
      </div>

      {hasMissingPrices && (
        <p className="text-sm text-amber-600 text-center">
          Some line items are missing prices. Please fill them in before sending.
        </p>
      )}
    </div>
  )
}
```

### 2. Line Item Table

```typescript
// src/components/invoice/LineItemTable.tsx
'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { InvoiceDraft } from '@/lib/openai/schemas'

type LineItem = InvoiceDraft['line_items'][number]

interface LineItemTableProps {
  items: LineItem[]
  onChange: (items: LineItem[]) => void
}

const UNITS = [
  { value: 'hr', label: 'hr' },
  { value: 'ea', label: 'ea' },
  { value: 'm', label: 'm' },
  { value: 'm2', label: 'm²' },
  { value: 'm3', label: 'm³' },
  { value: 'kg', label: 'kg' },
  { value: 'l', label: 'L' },
]

export function LineItemTable({ items, onChange }: LineItemTableProps) {
  const updateItem = (index: number, updates: Partial<LineItem>) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], ...updates }
    onChange(newItems)
  }

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const addItem = () => {
    onChange([
      ...items,
      {
        description: '',
        quantity: 1,
        unit: 'ea' as const,
        unit_price: null,
      }
    ])
  }

  const calculateLineTotal = (item: LineItem): number | null => {
    if (item.unit_price === null) return null
    return item.quantity * item.unit_price
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Line Items</h3>

      {/* Header - desktop only */}
      <div className="hidden md:grid md:grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
        <div className="col-span-5">Description</div>
        <div className="col-span-2">Qty</div>
        <div className="col-span-1">Unit</div>
        <div className="col-span-2">Price</div>
        <div className="col-span-1">Total</div>
        <div className="col-span-1"></div>
      </div>

      {/* Items */}
      {items.map((item, index) => (
        <div
          key={index}
          className="grid grid-cols-1 md:grid-cols-12 gap-2 p-4 md:p-0 border md:border-0 rounded-lg"
        >
          {/* Description */}
          <div className="md:col-span-5">
            <label className="text-sm text-muted-foreground md:hidden">
              Description
            </label>
            <Input
              value={item.description}
              onChange={(e) => updateItem(index, { description: e.target.value })}
              placeholder="Description"
            />
          </div>

          {/* Quantity */}
          <div className="md:col-span-2">
            <label className="text-sm text-muted-foreground md:hidden">
              Quantity
            </label>
            <Input
              type="number"
              min="0"
              step="0.5"
              value={item.quantity}
              onChange={(e) => updateItem(index, {
                quantity: parseFloat(e.target.value) || 0
              })}
            />
          </div>

          {/* Unit */}
          <div className="md:col-span-1">
            <label className="text-sm text-muted-foreground md:hidden">
              Unit
            </label>
            <Select
              value={item.unit}
              onValueChange={(value) => updateItem(index, {
                unit: value as LineItem['unit']
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((unit) => (
                  <SelectItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Unit Price */}
          <div className="md:col-span-2">
            <label className="text-sm text-muted-foreground md:hidden">
              Price ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                min="0"
                step="0.01"
                className={`pl-7 ${item.unit_price === null ? 'border-amber-400 bg-amber-50' : ''}`}
                value={item.unit_price ?? ''}
                onChange={(e) => updateItem(index, {
                  unit_price: e.target.value ? parseFloat(e.target.value) : null
                })}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Line Total */}
          <div className="md:col-span-1 flex items-center">
            <label className="text-sm text-muted-foreground md:hidden mr-2">
              Total:
            </label>
            <span className="font-medium">
              {calculateLineTotal(item) !== null
                ? `$${calculateLineTotal(item)!.toFixed(2)}`
                : '-'
              }
            </span>
          </div>

          {/* Delete */}
          <div className="md:col-span-1 flex items-center justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeItem(index)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      {/* Add Item Button */}
      <Button
        variant="outline"
        onClick={addItem}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Line Item
      </Button>
    </div>
  )
}
```

### 3. Customer Header

```typescript
// src/components/invoice/CustomerHeader.tsx
'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
```

### 4. Invoice Totals

```typescript
// src/components/invoice/InvoiceTotals.tsx
interface InvoiceTotalsProps {
  subtotal: number
  gstAmount: number
  total: number
  gstEnabled: boolean
}

export function InvoiceTotals({
  subtotal,
  gstAmount,
  total,
  gstEnabled
}: InvoiceTotalsProps) {
  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex justify-between w-48">
        <span className="text-muted-foreground">Subtotal:</span>
        <span>${subtotal.toFixed(2)}</span>
      </div>

      {gstEnabled && (
        <div className="flex justify-between w-48">
          <span className="text-muted-foreground">GST (10%):</span>
          <span>${gstAmount.toFixed(2)}</span>
        </div>
      )}

      <div className="flex justify-between w-48 text-lg font-bold border-t pt-2">
        <span>Total:</span>
        <span>${total.toFixed(2)} AUD</span>
      </div>
    </div>
  )
}
```

### 5. Correction Input Component

```typescript
// src/components/invoice/CorrectionInput.tsx
'use client'

import { useState } from 'react'
import { Mic, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { VoiceRecorder } from './VoiceRecorder'
import type { InvoiceDraft } from '@/lib/openai/schemas'

interface CorrectionInputProps {
  currentInvoice: InvoiceDraft
  onCorrectionApplied: (updated: InvoiceDraft, summary: string[]) => void
}

export function CorrectionInput({
  currentInvoice,
  onCorrectionApplied
}: CorrectionInputProps) {
  const [correction, setCorrection] = useState('')
  const [isApplying, setIsApplying] = useState(false)
  const [showVoice, setShowVoice] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleVoiceTranscript = (text: string) => {
    setCorrection(prev => prev ? `${prev} ${text}` : text)
    setShowVoice(false)
  }

  const applyCorrections = async () => {
    if (!correction.trim()) return

    setIsApplying(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentInvoice,
          correctionText: correction,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to apply corrections')
      }

      const updated: InvoiceDraft = await response.json()
      onCorrectionApplied(updated, updated.changes_summary)
      setCorrection('')

    } catch (err) {
      setError('Failed to apply changes. Please try again.')
      console.error(err)
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Tell us what to change (optional)</h3>

      <div className="flex gap-2">
        <Textarea
          value={correction}
          onChange={(e) => setCorrection(e.target.value)}
          placeholder="e.g., 'Change labour to 2.5 hours' or 'Remove the callout fee'"
          rows={2}
          className="flex-1"
          disabled={isApplying}
        />

        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowVoice(!showVoice)}
          disabled={isApplying}
        >
          <Mic className="h-4 w-4" />
        </Button>
      </div>

      {showVoice && (
        <div className="p-4 border rounded-lg">
          <VoiceRecorder
            onTranscript={handleVoiceTranscript}
            disabled={isApplying}
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button
        onClick={applyCorrections}
        disabled={!correction.trim() || isApplying}
      >
        {isApplying ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Applying...
          </>
        ) : (
          'Apply Changes'
        )}
      </Button>
    </div>
  )
}
```

### 6. Correction API Route

```typescript
// src/app/api/ai/correct/route.ts
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { invoiceSchema } from '@/lib/openai/schemas'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const { currentInvoice, correctionText } = await request.json()

    if (!currentInvoice || !correctionText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const response = await openai.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content: `You update existing invoice JSON based on user correction requests.

RULES:
1. Return ONLY valid JSON matching the schema
2. PRESERVE all fields unless explicitly requested to change
3. NEVER change unit_price unless user explicitly states a new price
4. NEVER change quantities unless user explicitly requests it
5. NEVER add new line items unless user explicitly requests it
6. NEVER remove line items unless user explicitly requests it
7. Populate changes_summary with human-readable descriptions of changes made

Example changes_summary entries:
- "Changed labour hours from 2 to 2.5"
- "Removed callout fee line item"
- "Updated customer name to John Smith"
- "Split labour into two items: install and testing"
- "Changed customer email to new@example.com"`
        },
        {
          role: 'user',
          content: `Current invoice:
${JSON.stringify(currentInvoice, null, 2)}

Change request:
"${correctionText}"`
        }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'invoice_updated',
          strict: true,
          schema: invoiceSchema
        }
      }
    })

    const updated = JSON.parse(response.output_text)
    return NextResponse.json(updated)

  } catch (error) {
    console.error('Correction error:', error)
    return NextResponse.json(
      { error: 'Failed to apply corrections' },
      { status: 500 }
    )
  }
}
```

---

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── ai/
│   │       └── correct/
│   │           └── route.ts
│   └── (dashboard)/
│       └── invoices/
│           └── new/
│               └── edit/
│                   └── page.tsx
└── components/
    └── invoice/
        ├── InvoiceEditor.tsx
        ├── CustomerHeader.tsx
        ├── LineItemTable.tsx
        ├── InvoiceTotals.tsx
        └── CorrectionInput.tsx
```

---

## Test Specifications

### Unit Tests

```typescript
// src/components/invoice/__tests__/InvoiceTotals.test.tsx
describe('InvoiceTotals', () => {
  it('displays formatted subtotal')
  it('displays GST amount when enabled')
  it('hides GST row when disabled')
  it('displays total with AUD currency')
  it('handles zero values correctly')
  it('handles large numbers correctly')
})
```

### Integration Tests

```typescript
// src/components/invoice/__tests__/InvoiceEditor.test.tsx
describe('InvoiceEditor', () => {
  it('renders customer header with pre-filled data')
  it('renders line items table')
  it('calculates totals correctly')
  it('updates totals when line items change')
  it('toggles GST and recalculates total')
  it('highlights missing prices in amber')
  it('disables send button when prices missing')
  it('shows change summary after AI correction')
  it('clears change summary after 5 seconds')
  it('marks form dirty on any change')
  it('enables save button when form is dirty')
})

// src/components/invoice/__tests__/LineItemTable.test.tsx
describe('LineItemTable', () => {
  it('renders all line items')
  it('allows editing description')
  it('allows editing quantity')
  it('allows changing unit from dropdown')
  it('allows editing unit price')
  it('calculates line total automatically')
  it('shows "-" for total when price is null')
  it('allows adding new line item')
  it('allows removing line item')
  it('applies amber highlight to null prices')
})

// src/components/invoice/__tests__/CustomerHeader.test.tsx
describe('CustomerHeader', () => {
  it('renders customer name input')
  it('renders email input with comma separation hint')
  it('parses multiple emails correctly')
  it('renders job address field')
  it('renders date pickers for invoice and due date')
  it('calls onChange when fields updated')
})

// src/components/invoice/__tests__/CorrectionInput.test.tsx
describe('CorrectionInput', () => {
  it('renders text input and mic button')
  it('toggles voice recorder visibility')
  it('appends voice transcript to existing text')
  it('calls API with current invoice and correction')
  it('shows loading state during API call')
  it('calls onCorrectionApplied with updated invoice')
  it('displays error message on failure')
  it('clears input after successful correction')
})

// src/app/api/ai/__tests__/correct.test.ts
describe('POST /api/ai/correct', () => {
  it('returns 400 if missing required fields')
  it('preserves unchanged fields')
  it('applies requested changes')
  it('returns changes_summary describing modifications')
  it('does not invent prices')
  it('does not add unrequested line items')
  it('returns 500 on OpenAI API failure')
})
```

### E2E Tests

```typescript
// e2e/invoice-editor.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Invoice Editor', () => {
  test('user can edit customer details', async ({ page }) => {
    // Navigate to editor with draft invoice
    await page.fill('[name="customerName"]', 'Updated Name')
    await expect(page.locator('[name="customerName"]')).toHaveValue('Updated Name')
  })

  test('user can add and remove line items', async ({ page }) => {
    await page.click('button:has-text("Add Line Item")')
    const items = await page.locator('[data-testid="line-item"]').count()
    expect(items).toBeGreaterThan(1)

    await page.click('[data-testid="remove-line-item"]:last-child')
    const newItems = await page.locator('[data-testid="line-item"]').count()
    expect(newItems).toBe(items - 1)
  })

  test('totals update in real-time', async ({ page }) => {
    await page.fill('[name="quantity-0"]', '3')
    await page.fill('[name="unit_price-0"]', '100')
    await expect(page.locator('[data-testid="subtotal"]')).toContainText('$300.00')
  })

  test('GST toggle updates total', async ({ page }) => {
    await page.click('[data-testid="gst-toggle"]')
    // Verify total changes based on GST state
  })

  test('save draft button saves to database', async ({ page }) => {
    await page.fill('[name="customerName"]', 'Test Customer')
    await page.click('button:has-text("Save Draft")')
    await expect(page.locator('text=Saved')).toBeVisible()
  })

  test('send button disabled until all prices filled', async ({ page }) => {
    // With missing prices
    await expect(page.locator('button:has-text("Send Invoice")')).toBeDisabled()
    // Fill in prices
    await page.fill('[name="unit_price-0"]', '100')
    await expect(page.locator('button:has-text("Send Invoice")')).toBeEnabled()
  })
})
```

---

## Acceptance Criteria

### Functional Requirements
- [ ] User can edit customer name and emails
- [ ] User can edit job address
- [ ] User can edit invoice date and due date
- [ ] User can add line items
- [ ] User can remove line items
- [ ] User can edit line item description, quantity, unit, price
- [ ] Line totals calculate automatically
- [ ] Subtotal, GST, and total update live
- [ ] GST toggle works correctly
- [ ] Missing prices are highlighted (amber)
- [ ] User can type correction text
- [ ] User can record voice corrections
- [ ] AI applies corrections and shows summary
- [ ] Manual edits are preserved unless explicitly overridden
- [ ] Save Draft button works
- [ ] Send button disabled if prices missing
- [ ] Form validation prevents empty required fields

### Testing Requirements
- [ ] All component tests pass
- [ ] Totals calculation tests pass
- [ ] Correction API tests pass
- [ ] E2E editing flow passes
- [ ] Line item manipulation tests pass
