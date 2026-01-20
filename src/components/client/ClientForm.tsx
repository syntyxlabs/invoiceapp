'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, X } from 'lucide-react'
import { useClients, type Customer, type CustomerInsert, type CustomerUpdate } from '@/hooks/useClients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface ClientFormProps {
  client?: Customer | null
  isEdit?: boolean
}

export function ClientForm({ client, isEdit = false }: ClientFormProps) {
  const router = useRouter()
  const { createClient, updateClient, isCreating, isUpdating } = useClients()

  const [formData, setFormData] = useState<{
    name: string
    emails: string[]
    phone: string
    address: string
    notes: string
  }>({
    name: client?.name || '',
    emails: client?.emails || [''],
    phone: client?.phone || '',
    address: client?.address || '',
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

  const handleEmailChange = (index: number, value: string) => {
    setFormData((prev) => {
      const newEmails = [...prev.emails]
      newEmails[index] = value
      return { ...prev, emails: newEmails }
    })
  }

  const addEmail = () => {
    setFormData((prev) => ({
      ...prev,
      emails: [...prev.emails, ''],
    }))
  }

  const removeEmail = (index: number) => {
    if (formData.emails.length <= 1) return
    setFormData((prev) => ({
      ...prev,
      emails: prev.emails.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.name.trim()) {
      setError('Client name is required')
      return
    }

    // Filter out empty emails and validate
    const validEmails = formData.emails.filter(email => email.trim())
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    for (const email of validEmails) {
      if (!emailRegex.test(email)) {
        setError(`Invalid email address: ${email}`)
        return
      }
    }

    try {
      const data: CustomerInsert = {
        name: formData.name.trim(),
        emails: validEmails.length > 0 ? validEmails : null,
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        notes: formData.notes.trim() || null,
      }

      if (isEdit && client) {
        await updateClient({
          id: client.id,
          data: data as CustomerUpdate,
        })
      } else {
        await createClient(data)
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

            {/* Email addresses */}
            <div className="space-y-2">
              <Label>Email Addresses</Label>
              <div className="space-y-2">
                {formData.emails.map((email, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => handleEmailChange(index, e.target.value)}
                      placeholder="john@example.com"
                      disabled={isLoading}
                    />
                    {formData.emails.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeEmail(index)}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEmail}
                disabled={isLoading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Email
              </Button>
              <p className="text-xs text-muted-foreground">
                Invoices will be sent to all email addresses
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0400 000 000"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Main Street, Sydney NSW 2000"
              rows={2}
              disabled={isLoading}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional notes about this client..."
              rows={3}
              disabled={isLoading}
            />
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
              isEdit ? 'Save Changes' : 'Create Client'
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
