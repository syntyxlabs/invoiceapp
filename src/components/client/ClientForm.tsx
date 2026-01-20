'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useClients, type ClientInsert, type ClientUpdate } from '@/hooks/useClients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { Client } from '@/types/database'

interface ClientFormProps {
  client?: Client | null
  isEdit?: boolean
}

export function ClientForm({ client, isEdit = false }: ClientFormProps) {
  const router = useRouter()
  const { createClient, updateClient, isCreating, isUpdating } = useClients()

  const [formData, setFormData] = useState<ClientInsert>({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    address_line1: client?.address_line1 || '',
    address_line2: client?.address_line2 || '',
    city: client?.city || '',
    state: client?.state || '',
    postcode: client?.postcode || '',
    country: client?.country || 'Australia',
    notes: client?.notes || '',
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

    // Validation
    if (!formData.name.trim()) {
      setError('Client name is required')
      return
    }

    // Email validation if provided
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address')
        return
      }
    }

    try {
      if (isEdit && client) {
        await updateClient({
          id: client.id,
          data: formData as ClientUpdate,
        })
      } else {
        await createClient(formData)
      }

      router.push('/clients')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save client')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit Client' : 'New Client'}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Basic Information</h3>

            <div className="space-y-2">
              <Label htmlFor="name">Client Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Smith"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                This is the name you&apos;ll use when creating invoices by voice
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  placeholder="0400 000 000"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Address (Optional)</h3>

            <div className="space-y-2">
              <Label htmlFor="address_line1">Street Address</Label>
              <Input
                id="address_line1"
                name="address_line1"
                value={formData.address_line1 || ''}
                onChange={handleChange}
                placeholder="123 Main Street"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line2">Address Line 2</Label>
              <Input
                id="address_line2"
                name="address_line2"
                value={formData.address_line2 || ''}
                onChange={handleChange}
                placeholder="Unit 1, Building A"
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">City / Suburb</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city || ''}
                  onChange={handleChange}
                  placeholder="Sydney"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state || ''}
                  onChange={handleChange}
                  placeholder="NSW"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="postcode">Postcode</Label>
                <Input
                  id="postcode"
                  name="postcode"
                  value={formData.postcode || ''}
                  onChange={handleChange}
                  placeholder="2000"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country || ''}
                  onChange={handleChange}
                  placeholder="Australia"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              placeholder="Any additional notes about this client..."
              rows={3}
              disabled={isLoading}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
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
              isEdit ? 'Save Changes' : 'Create Client'
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
