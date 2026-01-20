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
            onTranscriptReady={handleVoiceTranscript}
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
