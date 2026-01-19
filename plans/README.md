# Syntyx Invoices - Implementation Plans

This directory contains the implementation plans for building **Syntyx Invoices**, a mobile-first voice-powered invoicing app for Australian tradies.

## Overview

- **Product**: Syntyx Invoices
- **Domain**: https://invoices.syntyxlabs.com
- **Timeline**: 10 weeks
- **Stack**: Next.js 14 (PWA), Supabase, OpenAI, SendGrid

## Phase Summary

| Phase | Name | Timeline | Description |
|-------|------|----------|-------------|
| 1 | [Foundation](./phase-1-foundation.md) | Week 1-2 | Next.js setup, Supabase, Auth, Database |
| 2 | [Business Profiles](./phase-2-business-profiles.md) | Week 2 | Multi-profile management with ABN, bank details |
| 3 | [Voice + AI Drafting](./phase-3-voice-ai-drafting.md) | Week 3 | Core voice-to-invoice flow |
| 4 | [Invoice Editor](./phase-4-invoice-editor.md) | Week 4 | Fully editable form with AI corrections |
| 5 | [Photo Attachments](./phase-5-photo-attachments.md) | Week 5 | Upload and storage for proof of work |
| 6 | [PDF + Email](./phase-6-pdf-email.md) | Week 6 | AU-compliant PDF generation and sending |
| 7 | [Dashboard](./phase-7-invoice-dashboard.md) | Week 7 | Invoice list, status management |
| 8 | [Reminders (v1.5)](./phase-8-payment-reminders.md) | Week 8 | Manual + automatic payment reminders |
| 9 | [Polish + Launch](./phase-9-polish-launch.md) | Week 9-10 | Testing, optimization, beta |

## Key Files

- [phase-1-database-schema.sql](./phase-1-database-schema.sql) - Complete database schema with RLS

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- Tailwind CSS
- shadcn/ui components
- Zustand (state)
- React Query (server state)

### Backend
- Supabase (Auth, Postgres, Storage)
- Row-Level Security (RLS)
- pg_cron (scheduled jobs)
- Edge Functions (reminders)

### AI
- OpenAI gpt-4o-mini-transcribe (speech-to-text)
- OpenAI gpt-4.1-mini (invoice drafting/corrections)
- Structured Outputs (JSON schema)

### PDF & Email
- @react-pdf/renderer
- SendGrid

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js PWA)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  Voice   │ │ Invoice  │ │Dashboard │ │ Profile  │ │   Auth   │  │
│  │  Input   │ │  Editor  │ │   List   │ │  Mgmt    │ │  Screens │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Next.js API Routes / Edge                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │  AI Service  │  │ PDF Generate │  │ Email Service│               │
│  │  (OpenAI)    │  │ (react-pdf)  │  │ (SendGrid)   │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           Supabase                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │   Auth   │ │ Postgres │ │ Storage  │ │   RLS    │ │ pg_cron  │  │
│  │          │ │   DB     │ │ (Photos) │ │ Policies │ │ Reminders│  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Getting Started

1. Read the [PRD](../prd.md) for full product context
2. Start with [Phase 1](./phase-1-foundation.md) for project setup
3. Follow phases sequentially - each builds on the previous
4. Use the database schema from [phase-1-database-schema.sql](./phase-1-database-schema.sql)

## Core User Flow

```
Talk → Draft → Adjust → Send → Stop Chasing
  │       │        │       │         │
  │       │        │       │         └── Automatic reminders
  │       │        │       └── PDF + Email
  │       │        └── AI corrections / manual edits
  │       └── AI generates structured JSON invoice
  └── Voice note or text input
```

## Key Principles

1. **AI assists, never decides** - No auto-sending, no locked prices
2. **Human in control** - Everything editable, all actions explicit
3. **Mobile-first** - PWA, touch-optimized, camera/mic support
4. **AU-compliant** - ABN, GST, proper invoice format
5. **Test-Driven Development** - Tests before implementation, red-green-refactor

---

## TDD Approach

This project follows **Test-Driven Development (TDD)** principles. Every feature should be developed using the red-green-refactor cycle.

### Testing Stack

| Tool | Purpose |
|------|---------|
| **Vitest** | Fast, ESM-first test runner with Jest-compatible API |
| **Testing Library** | React component testing (`@testing-library/react`) |
| **Playwright** | End-to-end testing |
| **MSW** | Mock Service Worker for API mocking |

### TDD Workflow

For each task, follow this workflow:

1. **RED** - Write a failing test that defines the expected behavior
2. **GREEN** - Write the minimum code to make the test pass
3. **REFACTOR** - Improve code quality while keeping tests green

### Test Categories

| Category | Description | Location |
|----------|-------------|----------|
| **Unit Tests** | Pure functions, utilities, hooks | `src/**/__tests__/*.test.ts` |
| **Integration Tests** | Components with dependencies | `src/**/__tests__/*.test.tsx` |
| **E2E Tests** | Full user flows | `e2e/*.spec.ts` |

### npm Scripts

```json
{
  "test": "vitest",
  "test:watch": "vitest watch",
  "test:coverage": "vitest run --coverage",
  "test:ui": "vitest --ui",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:all": "npm run test:coverage && npm run test:e2e"
}
```

### Test Coverage Goals

- **Unit tests**: > 80% coverage for utility functions
- **Integration tests**: All components with user interactions
- **E2E tests**: Critical user flows (auth, invoice creation, send)

### Test File Structure

```
src/
├── test/
│   ├── setup.ts              # Test setup and global mocks
│   ├── mocks/
│   │   ├── server.ts         # MSW server setup
│   │   ├── handlers.ts       # API mock handlers
│   │   └── db.ts             # Mock database utilities
│   ├── factories/
│   │   ├── invoice.ts        # Test data factories
│   │   ├── user.ts
│   │   └── business-profile.ts
│   └── utils/
│       ├── render.tsx        # Custom render with providers
│       └── supabase-mock.ts  # Supabase client mock
e2e/
├── auth.spec.ts
├── invoices.spec.ts
├── business-profiles.spec.ts
└── fixtures/
    └── test-user.ts
```
