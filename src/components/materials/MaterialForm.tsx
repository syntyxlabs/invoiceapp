'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useMaterials, type Material, type MaterialInsert, type MaterialUpdate } from '@/hooks/useMaterials'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const UNITS = [
  { value: 'ea', label: 'Each (ea)' },
  { value: 'm', label: 'Metres (m)' },
  { value: 'm2', label: 'Square metres (m²)' },
  { value: 'm3', label: 'Cubic metres (m³)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'l', label: 'Litres (L)' },
]

interface MaterialFormProps {
  material?: Material | null
  isEdit?: boolean
}

export function MaterialForm({ material, isEdit = false }: MaterialFormProps) {
  const router = useRouter()
  const { createMaterial, updateMaterial, isCreating, isUpdating } = useMaterials()

  const [formData, setFormData] = useState({
    name: material?.name || '',
    description: material?.description || '',
    default_unit: material?.default_unit || 'ea',
    default_unit_price: material?.default_unit_price?.toString() || '',
    category: material?.category || '',
  })

  const [error, setError] = useState<string | null>(null)

  const isLoading = isCreating || isUpdating

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim()) {
      setError('Material name is required')
      return
    }

    try {
      const data: MaterialInsert = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        default_unit: formData.default_unit as MaterialInsert['default_unit'],
        default_unit_price: formData.default_unit_price
          ? parseFloat(formData.default_unit_price)
          : null,
        category: formData.category.trim() || null,
      }

      if (isEdit && material) {
        await updateMaterial({
          id: material.id,
          data: data as MaterialUpdate,
        })
      } else {
        await createMaterial(data)
      }

      router.push('/materials')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save material')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit Material' : 'New Material'}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Material Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Portland Cement 20kg"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Optional description or notes"
                rows={2}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default_unit">Default Unit</Label>
                <Select
                  value={formData.default_unit}
                  onValueChange={(value: string) =>
                    setFormData((prev) => ({ ...prev, default_unit: value as 'ea' | 'm' | 'm2' | 'm3' | 'kg' | 'l' }))
                  }
                  disabled={isLoading}
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

              <div className="space-y-2">
                <Label htmlFor="default_unit_price">Default Unit Price ($)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="default_unit_price"
                    name="default_unit_price"
                    type="number"
                    min="0"
                    step="0.01"
                    className="pl-7"
                    value={formData.default_unit_price}
                    onChange={handleChange}
                    placeholder="0.00"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g. Concrete, Timber, Electrical"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Group materials by category for easier browsing
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEdit ? 'Saving...' : 'Creating...'}
              </>
            ) : (
              isEdit ? 'Save Changes' : 'Create Material'
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
