import { create } from 'zustand'
import type { InvoiceDraft } from '@/lib/openai/schemas'

export interface Photo {
  id: string
  storage_path: string
  filename: string
  url?: string
}

interface InvoiceDraftState {
  draftId: string | null
  draft: InvoiceDraft | null
  photos: Photo[]
  originalTranscript: string | null
  selectedProfileId: string | null
  setDraft: (draft: InvoiceDraft) => void
  setPhotos: (photos: Photo[]) => void
  setTranscript: (transcript: string) => void
  setSelectedProfileId: (profileId: string) => void
  clearDraft: () => void
}

export const useInvoiceDraftStore = create<InvoiceDraftState>((set) => ({
  draftId: null,
  draft: null,
  photos: [],
  originalTranscript: null,
  selectedProfileId: null,
  setDraft: (draft) => set((state) => ({
    draft,
    // Generate draftId if not exists
    draftId: state.draftId || crypto.randomUUID()
  })),
  setPhotos: (photos) => set({ photos }),
  setTranscript: (transcript) => set({ originalTranscript: transcript }),
  setSelectedProfileId: (profileId) => set({ selectedProfileId: profileId }),
  clearDraft: () => set({ draft: null, draftId: null, photos: [], originalTranscript: null, selectedProfileId: null }),
}))
