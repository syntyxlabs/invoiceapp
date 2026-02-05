'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

interface ReminderSettingsProps {
  businessProfileId: string
}

interface Settings {
  auto_remind_before_days: number | null
  auto_remind_on_due: boolean
  auto_remind_after_days: number[]
}

// Default settings used when user hasn't customized
const DEFAULT_SETTINGS: Settings = {
  auto_remind_before_days: 2,
  auto_remind_on_due: true,
  auto_remind_after_days: [7, 14]
}

export function ReminderSettings({ businessProfileId }: ReminderSettingsProps) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [isCustomized, setIsCustomized] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      const supabase = createClient()
      // Table may not exist yet - use type assertion
      const { data } = await (supabase as ReturnType<typeof createClient>)
        .from('reminder_settings' as 'inv_business_profiles')
        .select('*')
        .eq('business_profile_id' as 'id', businessProfileId)
        .single() as { data: Settings | null }

      if (data) {
        setSettings({
          auto_remind_before_days: data.auto_remind_before_days,
          auto_remind_on_due: data.auto_remind_on_due,
          auto_remind_after_days: data.auto_remind_after_days || []
        })
        setIsCustomized(true)
      } else {
        // Use defaults if no custom settings
        setSettings(DEFAULT_SETTINGS)
        setIsCustomized(false)
      }

      setIsLoading(false)
    }

    fetchSettings()
  }, [businessProfileId])

  const saveSettings = async () => {
    setIsSaving(true)
    setSaveMessage(null)

    const supabase = createClient()
    // Table may not exist yet - use type assertion
    const { error } = await (supabase as ReturnType<typeof createClient>)
      .from('reminder_settings' as 'inv_business_profiles')
      .upsert({
        business_profile_id: businessProfileId,
        ...settings,
        updated_at: new Date().toISOString()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

    setIsSaving(false)

    if (error) {
      setSaveMessage('Failed to save settings')
    } else {
      setIsCustomized(true)
      setSaveMessage('Settings saved!')
      setTimeout(() => setSaveMessage(null), 3000)
    }
  }

  const toggleAfterDays = (days: number) => {
    setSettings(prev => ({
      ...prev,
      auto_remind_after_days: prev.auto_remind_after_days.includes(days)
        ? prev.auto_remind_after_days.filter(d => d !== days)
        : [...prev.auto_remind_after_days, days].sort((a, b) => a - b)
    }))
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Automatic Reminders</CardTitle>
        <CardDescription>
          Set up automatic payment reminders for overdue invoices.
          Reminders stop when an invoice is marked as paid.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Default settings notice */}
        {!isCustomized && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <strong>Using default settings:</strong> 2 days before due, on due date, and 7 & 14 days after.
            Modify below and save to customize.
          </div>
        )}
        {/* Before Due Date */}
        <div className="flex items-center justify-between">
          <div>
            <Label>Remind before due date</Label>
            <p className="text-sm text-muted-foreground">
              Send a reminder X days before the invoice is due
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              max="30"
              className="w-20"
              value={settings.auto_remind_before_days || ''}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                auto_remind_before_days: e.target.value ? parseInt(e.target.value) : null
              }))}
              placeholder="Days"
            />
            <span className="text-sm text-muted-foreground">days before</span>
          </div>
        </div>

        {/* On Due Date */}
        <div className="flex items-center justify-between">
          <div>
            <Label>Remind on due date</Label>
            <p className="text-sm text-muted-foreground">
              Send a reminder on the day the invoice is due
            </p>
          </div>
          <Switch
            checked={settings.auto_remind_on_due}
            onCheckedChange={(checked) => setSettings(prev => ({
              ...prev,
              auto_remind_on_due: checked
            }))}
          />
        </div>

        {/* After Due Date */}
        <div>
          <Label>Remind after due date</Label>
          <p className="text-sm text-muted-foreground mb-3">
            Send reminders X days after the invoice is overdue
          </p>
          <div className="flex flex-wrap gap-2">
            {[3, 7, 14, 21, 30].map((days) => (
              <Button
                key={days}
                variant={settings.auto_remind_after_days.includes(days) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleAfterDays(days)}
              >
                {days} days
              </Button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <Button onClick={saveSettings} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
          {saveMessage && (
            <span className={`text-sm ${saveMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
              {saveMessage}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
