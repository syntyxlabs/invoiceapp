# Phase 3: Voice Input + AI Drafting

**Timeline**: Week 3
**Goal**: Core voice-to-invoice flow

---

## Tasks

| Task | Priority | Estimate |
|------|----------|----------|
| Build VoiceRecorder component (MediaRecorder API) | P0 | 6h |
| Create /api/ai/transcribe route | P0 | 3h |
| Define invoice JSON schema | P0 | 2h |
| Create /api/ai/draft route | P0 | 4h |
| Build new invoice page with voice input | P0 | 4h |
| Handle transcription loading states | P0 | 2h |
| Add manual text input alternative | P0 | 2h |

---

## Deliverable

Users can speak and get a draft invoice JSON

---

## Technical Details

### 1. Voice Recorder Component

```typescript
// src/components/invoice/VoiceRecorder.tsx
'use client'

import { useState, useRef, useCallback } from 'react'
import { Mic, Square, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VoiceRecorderProps {
  onTranscript: (text: string) => void
  onRecordingStart?: () => void
  onRecordingEnd?: () => void
  disabled?: boolean
}

export function VoiceRecorder({
  onTranscript,
  onRecordingStart,
  onRecordingEnd,
  disabled
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    try {
      setError(null)

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        }
      })

      // Prefer webm, fallback to mp4
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/mp4'

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop())

        const audioBlob = new Blob(chunksRef.current, { type: mimeType })
        await transcribeAudio(audioBlob)
      }

      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      onRecordingStart?.()

    } catch (err) {
      setError('Microphone access denied. Please allow microphone access.')
      console.error('Failed to start recording:', err)
    }
  }, [onRecordingStart])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      onRecordingEnd?.()
    }
  }, [isRecording, onRecordingEnd])

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      const response = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Transcription failed')
      }

      const { text } = await response.json()
      onTranscript(text)

    } catch (err) {
      setError('Failed to transcribe audio. Please try again.')
      console.error('Transcription error:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        size="lg"
        variant={isRecording ? 'destructive' : 'default'}
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled || isProcessing}
        className="w-20 h-20 rounded-full"
      >
        {isProcessing ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : isRecording ? (
          <Square className="h-8 w-8" />
        ) : (
          <Mic className="h-8 w-8" />
        )}
      </Button>

      <p className="text-sm text-muted-foreground">
        {isProcessing
          ? 'Transcribing...'
          : isRecording
            ? 'Tap to stop'
            : 'Tap to record'}
      </p>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
```

### 2. Transcribe API Route

```typescript
// src/app/api/ai/transcribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'gpt-4o-mini-transcribe',
      prompt: 'Australian tradie invoicing. Terms: PayID, BSB, ABN, GPO, RCD, Clipsal, labour, callout, Bunnings, Reece, Coburg, Brunswick, Fitzroy, Richmond, electrician, plumber, HVAC',
    })

    return NextResponse.json({ text: transcription.text })

  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    )
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
```

### 3. Invoice JSON Schema

```typescript
// src/lib/openai/schemas.ts
export const invoiceSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    customer: {
      type: 'object',
      additionalProperties: false,
      properties: {
        name: { type: 'string', description: 'Customer name' },
        emails: {
          type: 'array',
          items: { type: 'string' },
          description: 'Customer email addresses'
        },
        address: {
          type: ['string', 'null'],
          description: 'Customer address if mentioned'
        }
      },
      required: ['name', 'emails']
    },
    invoice: {
      type: 'object',
      additionalProperties: false,
      properties: {
        invoice_date: {
          type: 'string',
          description: 'Invoice date in YYYY-MM-DD format. Default to today.'
        },
        due_date: {
          type: 'string',
          description: 'Due date in YYYY-MM-DD format. Default to 14 days from today.'
        },
        job_address: {
          type: ['string', 'null'],
          description: 'Job site address if different from customer address'
        },
        gst_enabled: {
          type: 'boolean',
          description: 'Whether GST applies. Default true for Australian businesses.'
        }
      },
      required: ['invoice_date', 'due_date', 'gst_enabled']
    },
    line_items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          description: {
            type: 'string',
            description: 'Description of the work or item'
          },
          quantity: {
            type: 'number',
            description: 'Quantity or hours'
          },
          unit: {
            type: 'string',
            enum: ['hr', 'ea', 'm', 'm2', 'm3', 'kg', 'l'],
            description: 'Unit of measure'
          },
          unit_price: {
            type: ['number', 'null'],
            description: 'Price per unit. Set to null if not stated - NEVER invent prices.'
          }
        },
        required: ['description', 'quantity', 'unit', 'unit_price']
      }
    },
    notes: {
      type: ['string', 'null'],
      description: 'Additional notes for the invoice'
    },
    changes_summary: {
      type: 'array',
      items: { type: 'string' },
      description: 'Human-readable summary of changes made (used for corrections)'
    }
  },
  required: ['customer', 'invoice', 'line_items', 'notes', 'changes_summary']
}

export type InvoiceDraft = {
  customer: {
    name: string
    emails: string[]
    address?: string | null
  }
  invoice: {
    invoice_date: string
    due_date: string
    job_address?: string | null
    gst_enabled: boolean
  }
  line_items: {
    description: string
    quantity: number
    unit: 'hr' | 'ea' | 'm' | 'm2' | 'm3' | 'kg' | 'l'
    unit_price: number | null
  }[]
  notes: string | null
  changes_summary: string[]
}
```

### 4. Draft Invoice API Route

```typescript
// src/app/api/ai/draft/route.ts
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { invoiceSchema } from '@/lib/openai/schemas'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const { transcript, customerEmails, businessProfile } = await request.json()

    if (!transcript) {
      return NextResponse.json(
        { error: 'No transcript provided' },
        { status: 400 }
      )
    }

    const today = new Date().toISOString().split('T')[0]
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0]

    const response = await openai.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content: `You are an invoice drafting assistant for Australian tradies.

RULES:
1. Return ONLY valid JSON matching the schema
2. Currency is always AUD
3. NEVER invent prices - set unit_price to null if not explicitly stated
4. Default invoice_date to "${today}"
5. Default due_date to "${dueDate}" (14 days)
6. Default gst_enabled to true (most AU businesses are GST registered)
7. Common units: hr (hours), ea (each), m (metres)
8. Parse quantities carefully - "2 hours" = quantity: 2, unit: "hr"
9. If customer name not stated, use "Customer"
10. If email not stated, use empty array []

${businessProfile?.default_hourly_rate
  ? `Business default hourly rate: $${businessProfile.default_hourly_rate}/hr (use as reference only, don't auto-apply)`
  : ''}

changes_summary should be empty array for initial drafts.`
        },
        {
          role: 'user',
          content: `Create an invoice from this voice input:

"${transcript}"

${customerEmails?.length
  ? `Known customer emails: ${customerEmails.join(', ')}`
  : ''}`
        }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'invoice_draft',
          strict: true,
          schema: invoiceSchema
        }
      }
    })

    const draft = JSON.parse(response.output_text)
    return NextResponse.json(draft)

  } catch (error) {
    console.error('Draft generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate invoice draft' },
      { status: 500 }
    )
  }
}
```

### 5. New Invoice Page

```typescript
// src/app/(dashboard)/invoices/new/page.tsx
'use client'

import { useState } from 'react'
import { VoiceRecorder } from '@/components/invoice/VoiceRecorder'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRouter } from 'next/navigation'
import type { InvoiceDraft } from '@/lib/openai/schemas'

export default function NewInvoicePage() {
  const router = useRouter()
  const [transcript, setTranscript] = useState('')
  const [manualInput, setManualInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateDraft = async (text: string) => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text,
          // TODO: Get from selected business profile
          businessProfile: null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate draft')
      }

      const draft: InvoiceDraft = await response.json()

      // Store draft in state/store and navigate to editor
      // TODO: Use zustand store
      sessionStorage.setItem('invoiceDraft', JSON.stringify(draft))
      sessionStorage.setItem('originalTranscript', text)
      router.push('/invoices/new/edit')

    } catch (err) {
      setError('Failed to generate invoice. Please try again.')
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleVoiceTranscript = (text: string) => {
    setTranscript(text)
  }

  const handleGenerateFromVoice = () => {
    if (transcript) {
      generateDraft(transcript)
    }
  }

  const handleGenerateFromText = () => {
    if (manualInput) {
      generateDraft(manualInput)
    }
  }

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-2xl font-bold mb-6">New Invoice</h1>

      <Tabs defaultValue="voice" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="voice">Voice</TabsTrigger>
          <TabsTrigger value="text">Text</TabsTrigger>
        </TabsList>

        <TabsContent value="voice">
          <Card>
            <CardHeader>
              <CardTitle>Record Voice Note</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <VoiceRecorder
                onTranscript={handleVoiceTranscript}
                disabled={isGenerating}
              />

              {transcript && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Transcript:</p>
                    <p className="text-sm">{transcript}</p>
                  </div>

                  <Button
                    onClick={handleGenerateFromVoice}
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Invoice'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="text">
          <Card>
            <CardHeader>
              <CardTitle>Type Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Describe the job... e.g., 'Job for John Smith at 123 Main St. Replace 2 power points, 2 hours labour at $90 per hour, plus $45 callout.'"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                rows={6}
                disabled={isGenerating}
              />

              <Button
                onClick={handleGenerateFromText}
                disabled={!manualInput || isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Generating...' : 'Generate Invoice'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <p className="text-sm text-destructive mt-4">{error}</p>
      )}
    </div>
  )
}
```

---

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── ai/
│   │       ├── transcribe/
│   │       │   └── route.ts
│   │       └── draft/
│   │           └── route.ts
│   └── (dashboard)/
│       └── invoices/
│           └── new/
│               ├── page.tsx
│               └── edit/
│                   └── page.tsx      # Phase 4
├── components/
│   └── invoice/
│       └── VoiceRecorder.tsx
├── lib/
│   └── openai/
│       └── schemas.ts
└── hooks/
    └── useVoiceRecording.ts          # Optional: extract logic
```

---

## Test Specifications

### Unit Tests

```typescript
// src/lib/openai/__tests__/schemas.test.ts
describe('Invoice Schema', () => {
  it('validates complete invoice draft structure')
  it('allows null unit_price in line items')
  it('requires customer name and emails')
  it('validates date formats (YYYY-MM-DD)')
  it('validates unit enum values (hr, ea, m, m2, m3, kg, l)')
})
```

### Integration Tests

```typescript
// src/components/invoice/__tests__/VoiceRecorder.test.tsx
describe('VoiceRecorder', () => {
  beforeEach(() => {
    // Mock MediaRecorder and getUserMedia
  })

  it('renders microphone button in idle state')
  it('requests microphone permission on start')
  it('shows recording indicator during recording')
  it('shows stop button during recording')
  it('shows processing state during transcription')
  it('calls onTranscript with result text')
  it('handles microphone permission denial gracefully')
  it('handles transcription errors with retry option')
  it('cleans up media stream on unmount')
})

// src/app/api/ai/__tests__/transcribe.test.ts
describe('POST /api/ai/transcribe', () => {
  it('returns 400 if no audio file provided')
  it('transcribes audio file and returns text')
  it('includes Australian tradie vocabulary hints')
  it('returns 500 on OpenAI API failure')
})

// src/app/api/ai/__tests__/draft.test.ts
describe('POST /api/ai/draft', () => {
  it('returns 400 if no transcript provided')
  it('generates invoice JSON from transcript')
  it('sets null for prices not explicitly mentioned')
  it('uses default dates if not specified')
  it('defaults gst_enabled to true')
  it('handles business profile hourly rate reference')
  it('returns 500 on OpenAI API failure')
})

// src/app/(dashboard)/invoices/new/__tests__/page.test.tsx
describe('New Invoice Page', () => {
  it('renders voice and text tabs')
  it('defaults to voice tab')
  it('switches between voice and text input')
  it('displays transcript after voice recording')
  it('enables generate button when transcript exists')
  it('shows loading state during generation')
  it('navigates to edit page after successful generation')
  it('displays error message on failure')
})
```

### E2E Tests

```typescript
// e2e/voice-invoice.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Voice to Invoice Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    // Login steps...
  })

  test('user can type description and generate invoice', async ({ page }) => {
    await page.goto('/invoices/new')
    await page.click('[data-value="text"]')
    await page.fill('textarea', 'Job for John Smith, 2 hours labour at $90 per hour')
    await page.click('button:has-text("Generate Invoice")')
    await expect(page).toHaveURL(/\/invoices\/new\/edit/)
  })

  test('generated invoice shows customer name', async ({ page }) => {
    await page.goto('/invoices/new')
    await page.click('[data-value="text"]')
    await page.fill('textarea', 'Invoice for Sarah Jones at sarah@email.com')
    await page.click('button:has-text("Generate Invoice")')
    await expect(page.locator('input[name="customerName"]')).toHaveValue('Sarah Jones')
  })

  test('prices are shown as missing when not stated', async ({ page }) => {
    await page.goto('/invoices/new')
    await page.click('[data-value="text"]')
    await page.fill('textarea', 'Job for client, 3 hours labour')
    await page.click('button:has-text("Generate Invoice")')
    await expect(page.locator('.border-amber-400')).toBeVisible()
  })
})
```

---

## Acceptance Criteria

### Functional Requirements
- [ ] User can tap microphone to start recording
- [ ] Recording indicator shows during recording
- [ ] User can tap again to stop recording
- [ ] Audio is transcribed within 3 seconds
- [ ] Transcript is displayed to user
- [ ] User can generate invoice from transcript
- [ ] User can switch to manual text input
- [ ] User can generate invoice from text input
- [ ] Loading states show during transcription and generation
- [ ] Errors are displayed clearly
- [ ] Microphone permission denial is handled gracefully
- [ ] Generated draft stores customer, line items, dates
- [ ] Prices are null when not explicitly stated
- [ ] User is navigated to edit page after generation

### Testing Requirements
- [ ] VoiceRecorder component tests pass
- [ ] API route tests pass with mocked OpenAI
- [ ] E2E invoice generation flow passes
- [ ] Error handling tests cover all failure modes
