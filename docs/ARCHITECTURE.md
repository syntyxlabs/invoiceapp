# Architecture Documentation

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui |
| Backend | Supabase (Auth, Postgres, Storage, Edge Functions) |
| AI | OpenAI Whisper (transcription), GPT-4o-mini (drafting/corrections with structured outputs) |
| Email | Resend |
| PDF | @react-pdf/renderer (server-side) |
| State | Zustand (client), TanStack Query v5 (server) |
| Forms | React Hook Form + Zod |
| Testing | Vitest, Playwright, MSW |

## File Structure

```
src/
├── app/
│   ├── (auth)/                  # Public routes (login, signup, forgot-password)
│   ├── (dashboard)/             # Protected routes
│   │   ├── page.tsx             # Dashboard/invoices list
│   │   ├── invoices/
│   │   │   ├── new/page.tsx     # Voice/text input entry
│   │   │   └── new/edit/page.tsx # Invoice editor
│   │   ├── profiles/            # Business profile CRUD
│   │   └── clients/             # Customer management
│   └── api/
│       ├── ai/{transcribe,draft,correct}/
│       ├── pdf/generate/
│       ├── email/{send-invoice,send-reminder}/
│       └── invoices/
├── components/
│   ├── invoice/                 # VoiceRecorder, InvoiceEditor, LineItemTable, etc.
│   ├── dashboard/               # InvoiceList, InvoiceCard, DashboardStats
│   ├── profile/                 # BusinessProfileForm, ProfileCard
│   ├── client/                  # ClientForm, ClientList
│   └── ui/                      # shadcn/ui components
├── hooks/
│   ├── useBusinessProfile.ts    # Profile CRUD with TanStack Query
│   └── useClients.ts            # Customer CRUD
├── stores/
│   └── invoice-draft-store.ts   # Zustand store for draft
├── lib/
│   ├── supabase/{client,server,middleware}.ts
│   ├── openai/schemas.ts        # AI JSON schema + InvoiceDraft type
│   ├── pdf/invoice-template.tsx # PDF layout component
│   ├── email/resend.ts          # Email templates
│   └── validation/{abn,bsb}.ts  # Australian compliance
└── types/database.ts            # Supabase generated types
```

## Database Schema

All `inv_*` tables use Row-Level Security (RLS) scoped to `user_id`.

```
inv_business_profiles
├── trading_name, business_name, abn, address
├── gst_registered, default_hourly_rate
├── bank_bsb, bank_account, payid, payment_link
├── logo_url, default_footer_note, is_default
└── FK: user_id → users

inv_sequences (1-to-1 with profile)
├── prefix (e.g., "INV")
└── next_number (auto-increment)

inv_invoices
├── invoice_number, status (draft|sent|overdue|paid|void)
├── invoice_date, due_date
├── customer_name, customer_emails[] (array)
├── subtotal, gst_amount, total, gst_enabled
├── original_voice_transcript, ai_draft_json (jsonb)
└── FK: user_id, business_profile_id, customer_id

inv_line_items
├── description, quantity, unit, unit_price, line_total
├── sort_order
└── FK: invoice_id → inv_invoices

inv_customers
├── name, emails[] (array), phone, address, notes
└── FK: user_id
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. VOICE INPUT                                              │
│    VoiceRecorder → MediaRecorder API → audio blob           │
│    POST /api/ai/transcribe → Whisper → text                 │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. AI DRAFTING                                              │
│    POST /api/ai/draft                                       │
│    ├─ GPT-4o-mini with structured outputs                   │
│    ├─ JSON schema enforced (invoiceSchema)                  │
│    └─ Customer auto-matching from inv_customers             │
│    Returns: InvoiceDraft JSON                               │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. ZUSTAND STORE                                            │
│    useInvoiceDraftStore.setDraft(draft)                     │
│    ├─ draftId: UUID                                         │
│    ├─ draft: InvoiceDraft                                   │
│    ├─ photos: Photo[]                                       │
│    └─ originalTranscript: string                            │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. INVOICE EDITOR (/invoices/new/edit)                      │
│    ├─ CustomerHeader (name, emails, dates)                  │
│    ├─ LineItemTable (editable rows)                         │
│    ├─ InvoiceTotals (live calculation)                      │
│    ├─ CorrectionInput (optional AI corrections)             │
│    └─ PhotoUploader                                         │
│                                                             │
│    [Optional] POST /api/ai/correct                          │
│    └─ Updates draft, shows changes_summary for 5s           │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. SEND FLOW                                                │
│    SendConfirmationDialog → User confirms                   │
│    ├─ POST /api/invoices (save to DB, get invoice number)   │
│    ├─ POST /api/pdf/generate (react-pdf → buffer)           │
│    └─ POST /api/email/send-invoice (Resend + PDF attachment)│
│    Update status → 'sent', store PDF in Supabase Storage    │
│    Show success → auto-redirect to /invoices                │
└─────────────────────────────────────────────────────────────┘
```

## State Management

### Zustand (Client State)

```typescript
useInvoiceDraftStore {
  draftId: string | null       // Temp UUID during creation
  draft: InvoiceDraft | null   // Full invoice structure
  photos: Photo[]              // Photo metadata
  originalTranscript: string | null
  setDraft(), setPhotos(), setTranscript(), clearDraft()
}
```

- Ephemeral: lost on page refresh (acceptable for MVP)
- Cleared after successful save/send

### TanStack Query (Server State)

```typescript
useBusinessProfile() {
  profiles, useProfile(id)
  createProfile, updateProfile, deleteProfile
}

useClients() {
  clients, useClient(id), searchByName(name)
  createClient, updateClient, deleteClient
}
```

- Query keys: `['business-profiles']`, `['clients']`
- Stale time: 1 minute, GC: 5 minutes

## AI Integration

### Transcription (`/api/ai/transcribe`)

- Model: `whisper-1`
- Prompt includes Australian terms: PayID, BSB, ABN, labour, callout

### Drafting (`/api/ai/draft`)

- Model: `gpt-4o-mini` with `response_format: { type: 'json_schema' }`
- Rules: Never invent prices (null if unknown), AUD only, default GST=true
- Auto-matches customer names against `inv_customers` to pre-fill emails

### Corrections (`/api/ai/correct`)

- Same model + schema
- Preserves all fields unless explicitly overridden
- Auto-generates `changes_summary` array

## PDF Generation

Server-side rendering with `@react-pdf/renderer`:

- Template: `src/lib/pdf/invoice-template.tsx`
- Contents: Header (logo, business info), Bill To, Line Items, Totals, Payment Info, Footer
- Supports both in-memory draft and database fetch modes

## Email Templates

Via Resend (`src/lib/email/resend.ts`):

- **Invoice email**: Greeting, amount, due date, optional "Pay Now" button, PDF attachment
- **Reminder email**: Red styling if overdue, same PDF attached

## Authentication

```
Supabase Auth (email/password)
  ↓
Middleware (src/middleware.ts)
  └─ updateSession() refreshes tokens on every request
  ↓
Dashboard Layout Guard
  └─ getUser() → redirect to /login if !user
  ↓
RLS enforces user_id on all queries
```

Public routes: `/login`, `/signup`, `/forgot-password`, `/auth/callback`

## Key Architectural Patterns

| Pattern | Implementation | Rationale |
|---------|---------------|-----------|
| Ephemeral draft state | Zustand store | No save until user confirms |
| Customer auto-matching | Query inv_customers in /api/ai/draft | Pre-fill emails, reduce friction |
| Changes summary | AI populates, shown for 5s | Build trust ("AI changed what you asked") |
| Multi-mode PDF | In-memory OR database fetch | Supports new invoices and resending |
| Invoice numbering | inv_sequences per profile | Prevents collisions, supports multiple businesses |
| Confirmation countdown | 3, 2, 1 auto-redirect | Clear success feedback |

## Known Incomplete Features

| Feature | Status | Notes |
|---------|--------|-------|
| Photo attachments | Partial | Zustand store exists, not persisted to DB or embedded in PDF |
| Automatic reminders | Infrastructure only | pg_cron tables exist, scheduling not fully wired |
| Offline queue | Partial | `src/lib/offline/queue.ts` exists, not integrated |
| prices_include_gst | Schema only | Flag in InvoiceDraft type, not used in calculations |

## Critical Files

| File | Purpose |
|------|---------|
| `src/stores/invoice-draft-store.ts` | All draft state during creation |
| `src/app/api/ai/draft/route.ts` | AI drafting + customer matching |
| `src/components/invoice/InvoiceEditor.tsx` | Main editing UI |
| `src/lib/openai/schemas.ts` | AI JSON schema + TypeScript types |
| `src/lib/pdf/invoice-template.tsx` | PDF layout |
| `src/lib/email/resend.ts` | Email templates |
| `src/types/database.ts` | Supabase type definitions |
