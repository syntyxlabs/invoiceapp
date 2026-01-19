import { create } from 'zustand'
import type { InvoiceDraft } from '@/lib/openai/schemas'

interface InvoiceDraftState {
  draft: InvoiceDraft | null
  originalTranscript: string | null
  setDraft: (draft: InvoiceDraft) => void
  setTranscript: (transcript: string) => void
  clearDraft: () => void
}

export const useInvoiceDraftStore = create<InvoiceDraftState>((set) => ({
  draft: null,
  originalTranscript: null,
  setDraft: (draft) => set({ draft }),
  setTranscript: (transcript) => set({ originalTranscript: transcript }),
  clearDraft: () => set({ draft: null, originalTranscript: null }),
}))
