'use client'

import { useState, useRef, useCallback } from 'react'
import { Mic, Square, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface VoiceRecorderProps {
  onTranscriptReady: (transcript: string) => void
  disabled?: boolean
}

type RecordingState = 'idle' | 'recording' | 'processing'

export function VoiceRecorder({ onTranscriptReady, disabled = false }: VoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle')
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }, [])

  const startRecording = useCallback(async () => {
    setError(null)
    chunksRef.current = []

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      })
      streamRef.current = stream

      // Determine the best supported format
      // Safari/iOS prefers audio/mp4, Chrome/Firefox prefer audio/webm
      let mimeType = 'audio/webm'
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus'
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm'
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4'
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg'
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        cleanupStream()

        if (chunksRef.current.length === 0) {
          setError('No audio recorded')
          setState('idle')
          return
        }

        setState('processing')

        try {
          // Determine file extension based on mime type
          let extension = 'webm'
          if (mimeType.includes('mp4')) {
            extension = 'mp4'
          } else if (mimeType.includes('ogg')) {
            extension = 'ogg'
          }

          const audioBlob = new Blob(chunksRef.current, { type: mimeType })
          const formData = new FormData()
          formData.append('audio', audioBlob, `recording.${extension}`)

          const response = await fetch('/api/ai/transcribe', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Transcription failed')
          }

          const data = await response.json()
          onTranscriptReady(data.text)
        } catch (err) {
          console.error('Transcription error:', err)
          setError(err instanceof Error ? err.message : 'Failed to transcribe audio')
        } finally {
          setState('idle')
        }
      }

      mediaRecorder.onerror = () => {
        cleanupStream()
        setError('Recording failed')
        setState('idle')
      }

      // Start recording
      mediaRecorder.start(1000) // Collect data every second
      setState('recording')
    } catch (err) {
      cleanupStream()
      console.error('Microphone error:', err)
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('Microphone permission denied. Please allow microphone access.')
      } else {
        setError('Failed to access microphone')
      }
      setState('idle')
    }
  }, [onTranscriptReady, cleanupStream])

  const handleClick = useCallback(() => {
    if (state === 'recording') {
      stopRecording()
    } else if (state === 'idle') {
      startRecording()
    }
  }, [state, startRecording, stopRecording])

  const isDisabled = disabled || state === 'processing'

  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          'w-20 h-20 rounded-full transition-all',
          state === 'recording' && 'bg-destructive hover:bg-destructive/90 animate-pulse',
          state === 'processing' && 'cursor-not-allowed'
        )}
        aria-label={
          state === 'idle' ? 'Start recording' :
          state === 'recording' ? 'Stop recording' :
          'Processing'
        }
      >
        {state === 'idle' && <Mic className="w-8 h-8" />}
        {state === 'recording' && <Square className="w-8 h-8" />}
        {state === 'processing' && <Loader2 className="w-8 h-8 animate-spin" />}
      </Button>

      <p className="text-sm text-muted-foreground text-center">
        {state === 'idle' && 'Tap to start recording'}
        {state === 'recording' && 'Recording... Tap to stop'}
        {state === 'processing' && 'Processing audio...'}
      </p>

      {error && (
        <p className="text-sm text-destructive text-center max-w-xs">
          {error}
        </p>
      )}
    </div>
  )
}
