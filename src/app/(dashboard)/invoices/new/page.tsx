'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Mic, FileText } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { VoiceRecorder } from '@/components/invoice'
import { useInvoiceDraftStore } from '@/stores/invoice-draft-store'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import type { InvoiceDraft } from '@/lib/openai/schemas'

export default function NewInvoicePage() {
  const router = useRouter()
  const { setDraft, setTranscript } = useInvoiceDraftStore()
  const { profiles } = useBusinessProfile()

  const [transcript, setLocalTranscript] = useState('')
  const [textInput, setTextInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'voice' | 'text'>('voice')

  // Get the default business profile
  const defaultProfile = profiles.find(p => p.is_default) || profiles[0]

  const handleTranscriptReady = (text: string) => {
    setLocalTranscript(text)
    setError(null)
  }

  const generateInvoice = async (inputText: string) => {
    if (!inputText.trim()) {
      setError('Please provide some input to generate an invoice')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: inputText,
          businessProfile: defaultProfile ? {
            default_hourly_rate: defaultProfile.default_hourly_rate,
          } : null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate invoice')
      }

      const draft: InvoiceDraft = await response.json()

      // Store the draft and transcript
      setDraft(draft)
      setTranscript(inputText)

      // Navigate to the edit page
      router.push('/invoices/new/edit')
    } catch (err) {
      console.error('Generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate invoice')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateFromVoice = () => {
    generateInvoice(transcript)
  }

  const handleGenerateFromText = () => {
    generateInvoice(textInput)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/invoices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Invoice</h1>
          <p className="text-muted-foreground">
            Create an invoice using voice or text input
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Describe your work</CardTitle>
          <CardDescription>
            Tell us about the job and we will generate a professional invoice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'voice' | 'text')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="voice" className="flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Voice
              </TabsTrigger>
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Text
              </TabsTrigger>
            </TabsList>

            <TabsContent value="voice" className="space-y-6 pt-6">
              <div className="flex flex-col items-center">
                <VoiceRecorder
                  onTranscriptReady={handleTranscriptReady}
                  disabled={isGenerating}
                />
              </div>

              {transcript && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Transcript
                    </label>
                    <div className="mt-2 p-4 bg-muted rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{transcript}</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleGenerateFromVoice}
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Invoice...
                      </>
                    ) : (
                      'Generate Invoice'
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="text" className="space-y-4 pt-6">
              <div>
                <label htmlFor="text-input" className="text-sm font-medium">
                  Describe the work
                </label>
                <Textarea
                  id="text-input"
                  placeholder="Example: Did 3 hours of electrical work at 42 Smith St for John Smith. Fixed two power points and installed a new light fitting. Email is john@example.com."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="mt-2 min-h-[150px]"
                  disabled={isGenerating}
                />
              </div>
              <Button
                onClick={handleGenerateFromText}
                disabled={isGenerating || !textInput.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Invoice...
                  </>
                ) : (
                  'Generate Invoice'
                )}
              </Button>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {defaultProfile && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Business Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{defaultProfile.trading_name}</p>
            {defaultProfile.default_hourly_rate && (
              <p className="text-sm text-muted-foreground">
                Default rate: ${defaultProfile.default_hourly_rate}/hr
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Tips for better results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>Include the customer name and email if you have it</li>
            <li>Mention specific quantities and units (e.g., &quot;3 hours&quot;, &quot;2 items&quot;)</li>
            <li>State prices if you want them included, otherwise we will leave them blank for you to fill in</li>
            <li>Include the job address if relevant</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
