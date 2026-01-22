# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Syntyx Invoices** - A voice-powered invoicing PWA for Australian tradies. The core flow is: **Talk → Draft → Adjust → Send → Stop Chasing**.

Key principle: AI assists, never decides. Nothing auto-sends. Human is always in control.

## Commands

```bash
# Development
npm run dev              # Start Next.js dev server

# Testing
npm run test             # Run Vitest tests once
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run test:e2e         # Playwright end-to-end tests
npm run test:e2e:ui      # Playwright with UI

# Build & Lint
npm run build            # Production build
npm run lint             # ESLint
```

## Architecture

### Stack
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui
- **Backend**: Supabase (Auth, Postgres, Storage, Edge Functions)
- **AI**: OpenAI (Whisper for transcription, GPT-4o-mini for drafting/corrections with structured outputs)
- **Email**: Resend
- **PDF**: @react-pdf/renderer
- **State**: Zustand (client state), TanStack Query (server state)

### Route Groups
- `(auth)/` - Login, signup, forgot-password (public routes)
- `(dashboard)/` - Protected routes requiring authentication

### Key API Routes
- `/api/ai/transcribe` - Voice-to-text (Whisper)
- `/api/ai/draft` - Generate invoice JSON from transcript
- `/api/ai/correct` - Apply corrections to existing invoice
- `/api/pdf/generate` - Generate PDF from invoice data
- `/api/email/send-invoice` - Send invoice via Resend

### Database Tables (inv_ prefix)
All tables use Row-Level Security (RLS) scoped to `user_id`.

See `docs/ARCHITECTURE.md` for detailed schema and data flow.

## Testing

TDD approach with Vitest (unit/integration) and Playwright (E2E).

- Unit tests: `src/**/__tests__/*.test.ts`
- Integration tests: `src/**/__tests__/*.test.tsx`
- E2E tests: `e2e/*.spec.ts`

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
RESEND_API_KEY=
```

## Australian Compliance

- ABN validation: `src/lib/validation/abn.ts` (checksum algorithm)
- BSB validation: `src/lib/validation/bsb.ts` (format XXX-XXX)
- GST: 10% applied when `gst_enabled` is true
- Currency: Always AUD

## Custom Agents

Three specialized agents in `.claude/agents/`:
- **coder** - Senior engineer for production-quality implementations
- **uimaster** - Neo-Brutalism design system expert
- **code-reviewer** - Principal engineer for thorough code reviews
