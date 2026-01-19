# Phase 1: Foundation

**Timeline**: Week 1-2
**Goal**: Basic infrastructure and auth flow

---

## Tasks

| Task | Priority | Estimate |
|------|----------|----------|
| Initialize Next.js 14 project with App Router | P0 | 2h |
| Configure Tailwind CSS + shadcn/ui | P0 | 2h |
| **Set up testing infrastructure (Vitest, Testing Library, Playwright, MSW)** | P0 | 4h |
| Set up Supabase project | P0 | 1h |
| Create database schema (migrations) | P0 | 4h |
| Configure RLS policies | P0 | 3h |
| Implement Supabase Auth (email/password) | P0 | 4h |
| Create auth pages (login, signup, forgot password) | P0 | 4h |
| Set up PWA manifest + service worker | P1 | 3h |
| Configure environment variables | P0 | 1h |
| Set up Vercel deployment | P0 | 2h |

---

## Deliverable

Authenticated shell app with database ready

---

## Technical Details

### 1. Initialize Next.js 14 Project

```bash
npx create-next-app@latest invoices.syntyxlabs.com --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

### 2. Install Core Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install zustand @tanstack/react-query
npm install -D supabase
```

### 3. Install shadcn/ui

```bash
npx shadcn@latest init
npx shadcn@latest add button input label card form toast
```

### 4. Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── api/
│   ├── layout.tsx
│   ├── manifest.json
│   └── globals.css
├── components/
│   └── ui/
├── lib/
│   └── supabase/
│       ├── client.ts
│       ├── server.ts
│       └── middleware.ts
├── hooks/
└── types/
    └── database.ts
```

### 5. Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

OPENAI_API_KEY=sk-xxx

SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=invoices@syntyxlabs.com

NEXT_PUBLIC_APP_URL=https://invoices.syntyxlabs.com
API_SECRET=xxx
```

### 6. Supabase Client Setup

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component - ignore
          }
        },
      },
    }
  )
}
```

### 7. PWA Manifest

```json
// src/app/manifest.json
{
  "name": "Syntyx Invoices",
  "short_name": "Invoices",
  "description": "Voice-powered invoicing for Australian tradies",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0f172a",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## Testing Infrastructure Setup

### Install Testing Dependencies

```bash
# Unit & Integration Testing
npm install -D vitest @vitejs/plugin-react
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D jsdom

# API Mocking
npm install -D msw

# E2E Testing
npm install -D @playwright/test
```

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Test Setup File

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll } from 'vitest'
import { server } from './mocks/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())
```

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### MSW Handlers

```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Add API mock handlers as needed
]
```

```typescript
// src/test/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

### Custom Render Utility

```typescript
// src/test/utils/render.tsx
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactElement, ReactNode } from 'react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
})

function AllProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
```

---

## Database Schema

See `phase-1-database-schema.sql` for complete migration.

---

## Test Specifications

### Unit Tests

```typescript
// src/lib/supabase/__tests__/client.test.ts
describe('Supabase Client', () => {
  it('creates browser client with correct env variables')
  it('throws error if env variables are missing')
})

// src/lib/supabase/__tests__/server.test.ts
describe('Supabase Server Client', () => {
  it('creates server client with cookie handling')
  it('handles cookie read/write operations')
})
```

### Integration Tests

```typescript
// src/app/(auth)/__tests__/login.test.tsx
describe('Login Page', () => {
  it('renders login form with email and password fields')
  it('shows validation errors for empty fields')
  it('shows validation error for invalid email format')
  it('submits form and redirects on successful login')
  it('displays error message on failed login')
  it('shows loading state during submission')
  it('links to signup and forgot password pages')
})

// src/app/(auth)/__tests__/signup.test.tsx
describe('Signup Page', () => {
  it('renders signup form with all required fields')
  it('validates password strength requirements')
  it('validates password confirmation matches')
  it('creates account and redirects on success')
  it('displays error for existing email')
})
```

### E2E Tests

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('user can sign up with email and password', async ({ page }) => {
    await page.goto('/signup')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'SecurePass123!')
    await page.fill('[name="confirmPassword"]', 'SecurePass123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('user can log in with valid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'SecurePass123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('user sees error with invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'wrong@example.com')
    await page.fill('[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.locator('.error-message')).toBeVisible()
  })

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })
})
```

---

## Acceptance Criteria

### Functional Requirements
- [ ] Next.js app runs locally at localhost:3000
- [ ] Tailwind CSS and shadcn/ui components working
- [ ] Supabase project created and connected
- [ ] Database tables created with RLS enabled
- [ ] User can sign up with email/password
- [ ] User can log in and see dashboard shell
- [ ] User can log out
- [ ] Password reset flow works
- [ ] App deploys to Vercel successfully
- [ ] PWA installable on mobile

### Testing Requirements
- [ ] Vitest runs unit tests successfully (`npm test`)
- [ ] Testing Library renders React components in tests
- [ ] MSW intercepts API calls in tests
- [ ] Playwright E2E tests run (`npm run test:e2e`)
- [ ] Test coverage report generates (`npm run test:coverage`)
- [ ] All auth-related tests pass
