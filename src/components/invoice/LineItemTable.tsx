'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MaterialPicker } from '@/components/invoice/MaterialPicker'
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
        item_type: 'labour' as const,
      }
    ])
  }

  const toggleItemType = (index: number) => {
    const current = items[index].item_type || 'labour'
    updateItem(index, { item_type: current === 'labour' ? 'material' : 'labour' })
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
          data-testid="line-item"
          className="grid grid-cols-1 md:grid-cols-12 gap-2 p-4 md:p-0 border md:border-0 rounded-lg"
        >
          {/* Type + Description */}
          <div className="md:col-span-5">
            <label className="text-sm text-muted-foreground md:hidden">
              Description
            </label>
            <div className="flex gap-2 items-start">
              <Badge
                variant="outline"
                className={`cursor-pointer select-none shrink-0 mt-2 ${
                  (item.item_type || 'labour') === 'labour'
                    ? 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
                    : 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
                onClick={() => toggleItemType(index)}
              >
                {(item.item_type || 'labour') === 'labour' ? 'Labour' : 'Material'}
              </Badge>
              <Input
                value={item.description}
                onChange={(e) => updateItem(index, { description: e.target.value })}
                placeholder="Description"
                className="flex-1"
              />
            </div>
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
              name={`quantity-${index}`}
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
                name={`unit_price-${index}`}
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
              data-testid="remove-line-item"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      {/* Add Item Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={addItem}
          className="flex-1"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Line Item
        </Button>
        <MaterialPicker
          onSelect={(item) => onChange([...items, item])}
        />
      </div>
    </div>
  )
}
