'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LogoUpload } from './LogoUpload'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { validateABN, formatABN } from '@/lib/validation/abn'
import { validateBSB, formatBSB } from '@/lib/validation/bsb'
import type { BusinessProfileWithSequence } from '@/types/database'

const profileSchema = z.object({
  trading_name: z.string().min(1, 'Trading name is required'),
  business_name: z.string().optional(),
  abn: z.string().optional().refine(
    (val) => !val || validateABN(val),
    { message: 'Invalid ABN. Must be 11 digits with valid checksum.' }
  ),
  address: z.string().optional(),
  gst_registered: z.boolean(),
  default_hourly_rate: z.number().min(0).nullable().optional(),
  bank_bsb: z.string().optional().refine(
    (val) => !val || validateBSB(val),
    { message: 'Invalid BSB. Must be 6 digits.' }
  ),
  bank_account: z.string().optional(),
  payid: z.string().optional(),
  payment_link: z.string().url({ message: 'Must be a valid URL' }).optional().or(z.literal('')),
  default_footer_note: z.string().optional(),
  is_default: z.boolean(),
  sequence_prefix: z.string().min(1, 'Prefix is required'),
  sequence_starting_number: z.number().min(1, 'Must be at least 1'),
  logo_url: z.string().nullable().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

interface BusinessProfileFormProps {
  profile?: BusinessProfileWithSequence | null
  mode: 'create' | 'edit'
}

export function BusinessProfileForm({ profile, mode }: BusinessProfileFormProps) {
  const router = useRouter()
  const { createProfile, updateProfile, isCreating, isUpdating } = useBusinessProfile()
  const isLoading = isCreating || isUpdating
  const [userId, setUserId] = useState<string | null>(null)

  // Get user ID on mount
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    fetchUser()
  }, [])

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      trading_name: profile?.trading_name ?? '',
      business_name: profile?.business_name ?? '',
      abn: profile?.abn ? formatABN(profile.abn) : '',
      address: profile?.address ?? '',
      gst_registered: profile?.gst_registered ?? false,
      default_hourly_rate: profile?.default_hourly_rate ?? null,
      bank_bsb: profile?.bank_bsb ? formatBSB(profile.bank_bsb) : '',
      bank_account: profile?.bank_account ?? '',
      payid: profile?.payid ?? '',
      payment_link: profile?.payment_link ?? '',
      default_footer_note: profile?.default_footer_note ?? '',
      is_default: profile?.is_default ?? false,
      sequence_prefix: profile?.sequence?.prefix ?? 'INV',
      sequence_starting_number: profile?.sequence?.next_number ?? 1,
      logo_url: profile?.logo_url ?? null,
    },
  })

  const watchPrefix = form.watch('sequence_prefix')
  const watchStartNumber = form.watch('sequence_starting_number')
  const previewNumber = String(watchStartNumber || 1).padStart(5, '0')

  async function onSubmit(values: ProfileFormValues) {
    try {
      // Clean up ABN and BSB by removing spaces/dashes
      const cleanedAbn = values.abn?.replace(/\s/g, '') || null
      const cleanedBsb = values.bank_bsb?.replace(/[-\s]/g, '') || null

      const profileData = {
        trading_name: values.trading_name,
        business_name: values.business_name || null,
        abn: cleanedAbn,
        address: values.address || null,
        gst_registered: values.gst_registered,
        default_hourly_rate: values.default_hourly_rate || null,
        bank_bsb: cleanedBsb,
        bank_account: values.bank_account || null,
        payid: values.payid || null,
        payment_link: values.payment_link || null,
        default_footer_note: values.default_footer_note || null,
        is_default: values.is_default,
        logo_url: values.logo_url || null,
      }

      const sequenceData = {
        prefix: values.sequence_prefix,
        next_number: values.sequence_starting_number,
      }

      if (mode === 'create') {
        await createProfile({
          profile: profileData,
          sequence: sequenceData,
        })
        toast.success('Profile created successfully')
      } else if (profile) {
        await updateProfile({
          id: profile.id,
          data: {
            profile: profileData,
            sequence: sequenceData,
          },
        })
        toast.success('Profile updated successfully')
      }

      router.push('/profiles')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save profile')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Business Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Business Details</CardTitle>
            <CardDescription>
              Your business information that will appear on invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo Upload */}
            {userId && (
              <FormField
                control={form.control}
                name="logo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Logo</FormLabel>
                    <FormControl>
                      <LogoUpload
                        currentLogoUrl={field.value || null}
                        onLogoChange={(url) => field.onChange(url)}
                        userId={userId}
                        profileId={profile?.id}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="trading_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trading Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Acme Consulting" {...field} />
                  </FormControl>
                  <FormDescription>
                    The name shown on your invoices
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="business_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registered Business Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Acme Pty Ltd" {...field} />
                  </FormControl>
                  <FormDescription>
                    Your registered business name (if different from trading name)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="abn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ABN</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="XX XXX XXX XXX"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d\s]/g, '')
                        field.onChange(value)
                      }}
                      onBlur={(e) => {
                        const value = e.target.value.replace(/\s/g, '')
                        if (value && validateABN(value)) {
                          field.onChange(formatABN(value))
                        }
                        field.onBlur()
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Australian Business Number (11 digits)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Address</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="123 Business St&#10;Sydney NSW 2000"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gst_registered"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">GST Registered</FormLabel>
                    <FormDescription>
                      Enable if your business is registered for GST
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="default_hourly_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Hourly Rate ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormDescription>
                    Your default rate for hourly work
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Details</CardTitle>
            <CardDescription>
              Bank account and payment information for invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="bank_bsb"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank BSB</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="XXX-XXX"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d\-\s]/g, '')
                          field.onChange(value)
                        }}
                        onBlur={(e) => {
                          const value = e.target.value.replace(/[-\s]/g, '')
                          if (value && validateBSB(value)) {
                            field.onChange(formatBSB(value))
                          }
                          field.onBlur()
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bank_account"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number</FormLabel>
                    <FormControl>
                      <Input placeholder="XXXXXXXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="payid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PayID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., email@example.com or phone" {...field} />
                  </FormControl>
                  <FormDescription>
                    Your PayID (email or phone number)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Link</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://pay.example.com/yourname"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Link to your payment page (Stripe, PayPal, etc.)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Invoice Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invoice Settings</CardTitle>
            <CardDescription>
              Configure invoice numbering and defaults
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="sequence_prefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Prefix</FormLabel>
                    <FormControl>
                      <Input placeholder="INV" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sequence_starting_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {mode === 'create' ? 'Starting Number' : 'Next Number'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">Invoice number preview:</p>
              <p className="text-lg font-mono font-semibold">
                {watchPrefix}-{previewNumber}
              </p>
            </div>

            <FormField
              control={form.control}
              name="default_footer_note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Footer Note</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Thank you for your business!"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A note that appears at the bottom of your invoices
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_default"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Set as Default Profile</FormLabel>
                    <FormDescription>
                      Use this profile by default when creating new invoices
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/profiles')}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              mode === 'create' ? 'Creating...' : 'Saving...'
            ) : (
              mode === 'create' ? 'Create Profile' : 'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
