'use client'

import { useState } from 'react'
import { Package, Search } from 'lucide-react'
import { useMaterials, type Material } from '@/hooks/useMaterials'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { InvoiceDraft } from '@/lib/openai/schemas'

type LineItem = InvoiceDraft['line_items'][number]

const UNIT_LABELS: Record<string, string> = {
  ea: 'ea',
  m: 'm',
  m2: 'm²',
  m3: 'm³',
  kg: 'kg',
  l: 'L',
}

interface MaterialPickerProps {
  onSelect: (item: LineItem) => void
}

export function MaterialPicker({ onSelect }: MaterialPickerProps) {
  const { materials, isLoading } = useMaterials()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = search
    ? materials.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.category?.toLowerCase().includes(search.toLowerCase())
      )
    : materials

  // Group by category
  const grouped = filtered.reduce<Record<string, Material[]>>((acc, m) => {
    const cat = m.category || 'Uncategorised'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(m)
    return acc
  }, {})

  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    if (a === 'Uncategorised') return 1
    if (b === 'Uncategorised') return -1
    return a.localeCompare(b)
  })

  const handleSelect = (material: Material) => {
    const lineItem: LineItem = {
      description: material.name,
      quantity: 1,
      unit: material.default_unit as LineItem['unit'],
      unit_price: material.default_unit_price,
      item_type: 'material',
    }
    onSelect(lineItem)
    setOpen(false)
    setSearch('')
  }

  if (materials.length === 0 && !isLoading) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Package className="h-4 w-4 mr-2" />
          Add from Catalog
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Material</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search materials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1 -mx-6 px-6">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search ? `No materials matching "${search}"` : 'No materials in catalog'}
            </p>
          ) : (
            <div className="space-y-4 pb-2">
              {sortedCategories.map((category) => (
                <div key={category}>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {category}
                  </p>
                  <div className="space-y-1">
                    {grouped[category].map((material) => (
                      <button
                        key={material.id}
                        onClick={() => handleSelect(material)}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-medium truncate">{material.name}</p>
                          {material.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {material.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary" className="text-xs">
                            {UNIT_LABELS[material.default_unit] || material.default_unit}
                          </Badge>
                          {material.default_unit_price !== null && (
                            <span className="text-sm text-muted-foreground">
                              ${material.default_unit_price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
