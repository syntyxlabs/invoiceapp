# Phase 9: Polish + Launch Prep

**Timeline**: Week 9-10
**Goal**: Production readiness

---

## Tasks

| Task | Priority | Estimate |
|------|----------|----------|
| Comprehensive error handling | P0 | 4h |
| Loading states and skeletons | P0 | 3h |
| Empty states | P0 | 2h |
| Offline handling (queue actions) | P1 | 6h |
| Mobile responsiveness audit | P0 | 4h |
| Performance optimization | P1 | 4h |
| Security audit (RLS, API routes) | P0 | 4h |
| Add analytics (Vercel Analytics) | P1 | 2h |
| Set up error tracking (Sentry) | P1 | 2h |
| Write user documentation | P1 | 4h |
| Beta testing with 5-10 tradies | P0 | 8h |
| Fix beta feedback issues | P0 | 8h |

---

## Deliverable

Production-ready MVP

---

## Technical Details

### 1. Error Boundary Component

```typescript
// src/components/ErrorBoundary.tsx
'use client'

import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    // Send to Sentry
    // Sentry.captureException(error)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground text-center mb-4">
            We encountered an error. Please try again.
          </p>
          <Button
            onClick={() => {
              this.setState({ hasError: false })
              window.location.reload()
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
```

### 2. Loading Skeletons

```typescript
// src/components/ui/skeleton.tsx
import { cn } from '@/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  )
}

// Invoice Card Skeleton
export function InvoiceCardSkeleton() {
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="text-right">
          <Skeleton className="h-6 w-20 ml-auto" />
          <Skeleton className="h-3 w-8 ml-auto mt-1" />
        </div>
      </div>
    </div>
  )
}

// Dashboard Stats Skeleton
export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded" />
            <div>
              <Skeleton className="h-6 w-8" />
              <Skeleton className="h-3 w-12 mt-1" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Invoice Editor Skeleton
export function InvoiceEditorSkeleton() {
  return (
    <div className="space-y-6">
      <div className="p-6 border rounded-lg space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="p-6 border rounded-lg space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}

export { Skeleton }
```

### 3. Empty States

```typescript
// src/components/EmptyState.tsx
import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  children?: ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  children
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="p-4 bg-muted rounded-full mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-6">{description}</p>
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
      {children}
    </div>
  )
}

// Usage examples:
// <EmptyState
//   icon={FileText}
//   title="No invoices yet"
//   description="Create your first invoice to get started."
//   action={{ label: "Create Invoice", onClick: () => router.push('/invoices/new') }}
// />

// <EmptyState
//   icon={Building}
//   title="No business profiles"
//   description="Set up your business profile to start invoicing."
//   action={{ label: "Add Profile", onClick: () => router.push('/profiles/new') }}
// />
```

### 4. Offline Queue (Service Worker)

```typescript
// src/lib/offline/queue.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface OfflineAction {
  id: string
  type: 'create_invoice' | 'update_invoice' | 'send_invoice'
  data: any
  timestamp: number
  retries: number
}

interface OfflineDB extends DBSchema {
  actions: {
    key: string
    value: OfflineAction
  }
}

let db: IDBPDatabase<OfflineDB>

async function getDB() {
  if (!db) {
    db = await openDB<OfflineDB>('syntyx-offline', 1, {
      upgrade(db) {
        db.createObjectStore('actions', { keyPath: 'id' })
      }
    })
  }
  return db
}

export async function queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retries'>) {
  const db = await getDB()
  const id = crypto.randomUUID()

  await db.add('actions', {
    ...action,
    id,
    timestamp: Date.now(),
    retries: 0
  })

  return id
}

export async function getPendingActions(): Promise<OfflineAction[]> {
  const db = await getDB()
  return db.getAll('actions')
}

export async function removeAction(id: string) {
  const db = await getDB()
  await db.delete('actions', id)
}

export async function processQueue() {
  const actions = await getPendingActions()

  for (const action of actions) {
    try {
      // Process based on type
      switch (action.type) {
        case 'create_invoice':
          await fetch('/api/invoices', {
            method: 'POST',
            body: JSON.stringify(action.data)
          })
          break
        case 'send_invoice':
          await fetch('/api/email/send-invoice', {
            method: 'POST',
            body: JSON.stringify(action.data)
          })
          break
      }

      await removeAction(action.id)
    } catch (error) {
      console.error('Failed to process action:', action.id, error)
      // Could increment retries here
    }
  }
}

// Process queue when online
if (typeof window !== 'undefined') {
  window.addEventListener('online', processQueue)
}
```

### 5. Offline Detection Hook

```typescript
// src/hooks/useOnlineStatus.ts
import { useState, useEffect } from 'react'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
```

### 6. Offline Banner

```typescript
// src/components/OfflineBanner.tsx
'use client'

import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { WifiOff } from 'lucide-react'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-amber-500 text-white py-2 px-4 text-center z-50">
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">
          You're offline. Changes will sync when you're back online.
        </span>
      </div>
    </div>
  )
}
```

### 7. Sentry Setup

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
})

// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
})
```

### 8. Analytics Setup

```typescript
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

### 9. Security Audit Checklist

```markdown
## Security Audit Checklist

### Row-Level Security (RLS)
- [ ] All tables have RLS enabled
- [ ] Users can only access their own data
- [ ] Line items/photos accessible only through invoice ownership
- [ ] Reminder settings accessible through business profile ownership
- [ ] Storage buckets have proper policies

### API Routes
- [ ] All routes check authentication
- [ ] Input validation on all endpoints
- [ ] Rate limiting configured
- [ ] No sensitive data in responses
- [ ] Error messages don't leak information

### Authentication
- [ ] Session cookies are HttpOnly
- [ ] CSRF protection enabled
- [ ] Password requirements enforced
- [ ] Account lockout after failed attempts

### Data Protection
- [ ] No card data stored
- [ ] ABN/BSB/bank details encrypted at rest
- [ ] PDFs stored privately
- [ ] Photos stored privately
- [ ] Signed URLs expire after 1 hour

### Headers
- [ ] Content-Security-Policy configured
- [ ] X-Frame-Options set
- [ ] X-Content-Type-Options set
- [ ] Referrer-Policy set

### Environment
- [ ] API keys in environment variables
- [ ] No secrets in client-side code
- [ ] Production environment isolated
```

### 10. Performance Checklist

```markdown
## Performance Checklist

### Images
- [ ] Next.js Image component used
- [ ] Images optimized and lazy loaded
- [ ] Proper sizing and formats

### Data Fetching
- [ ] React Query for caching
- [ ] Pagination on lists
- [ ] Prefetching for navigation

### Bundle Size
- [ ] Code splitting configured
- [ ] Tree shaking working
- [ ] Dynamic imports for heavy components

### Core Web Vitals
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1

### Lighthouse Scores
- [ ] Performance > 90
- [ ] Accessibility > 90
- [ ] Best Practices > 90
- [ ] SEO > 90
- [ ] PWA > 90
```

### 11. Mobile Responsiveness Checklist

```markdown
## Mobile Responsiveness Checklist

### Layout
- [ ] Single column on mobile
- [ ] Proper spacing and padding
- [ ] Touch targets minimum 44px
- [ ] No horizontal scrolling

### Forms
- [ ] Full-width inputs on mobile
- [ ] Proper input types (tel, email, number)
- [ ] Virtual keyboard appropriate

### Navigation
- [ ] Bottom navigation on mobile
- [ ] Hamburger menu working
- [ ] Back navigation clear

### Specific Pages
- [ ] Dashboard cards stack
- [ ] Invoice list cards full width
- [ ] Invoice editor scrollable
- [ ] Line items table responsive
- [ ] Photo grid adapts

### Testing Devices
- [ ] iPhone SE (small)
- [ ] iPhone 14 (medium)
- [ ] iPhone 14 Pro Max (large)
- [ ] iPad (tablet)
- [ ] Android devices
```

### 12. Beta Testing Plan

```markdown
## Beta Testing Plan

### Recruit Testers
- 5-10 Australian tradies
- Mix of trades (electricians, plumbers, builders)
- Mix of tech comfort levels
- Existing invoicing method varies

### Testing Period
- 2 weeks active testing
- Daily usage encouraged
- Weekly check-in calls

### Feedback Collection
- In-app feedback button
- Weekly survey
- Video call interviews
- Screen recordings (with permission)

### Key Metrics to Track
- Time to first invoice
- Invoices per user per week
- Voice vs text input ratio
- Correction usage rate
- Send success rate
- Support requests

### Bug Tracking
- Prioritize by frequency and severity
- Fix critical bugs immediately
- Document all issues
- Follow up with affected users
```

---

## Environment Variables (Production)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# OpenAI
OPENAI_API_KEY=sk-xxx

# SendGrid
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=invoices@syntyxlabs.com

# App
NEXT_PUBLIC_APP_URL=https://invoices.syntyxlabs.com
API_SECRET=xxx

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx

# Analytics (auto-configured by Vercel)
```

---

## Launch Checklist

```markdown
## Pre-Launch Checklist

### Infrastructure
- [ ] Vercel project configured
- [ ] Custom domain set up (invoices.syntyxlabs.com)
- [ ] SSL certificate active
- [ ] Supabase project on paid plan (if needed)

### Email
- [ ] SendGrid domain authenticated
- [ ] SPF/DKIM records verified
- [ ] Test emails delivered successfully

### Monitoring
- [ ] Sentry configured
- [ ] Vercel Analytics enabled
- [ ] Error alerts set up

### Legal
- [ ] Privacy Policy page
- [ ] Terms of Service page
- [ ] Cookie consent (if applicable)

### Marketing
- [ ] Landing page ready
- [ ] Pricing page ready
- [ ] Demo video recorded
- [ ] Social media accounts

### Support
- [ ] Help documentation
- [ ] FAQ page
- [ ] Support email configured
- [ ] Feedback mechanism in app
```

---

## Test Specifications

### Unit Tests

```typescript
// src/components/__tests__/ErrorBoundary.test.tsx
describe('ErrorBoundary', () => {
  it('renders children when no error')
  it('renders fallback UI when error occurs')
  it('logs error to console')
  it('calls Sentry.captureException')
  it('reloads page on Try Again click')
})

// src/hooks/__tests__/useOnlineStatus.test.ts
describe('useOnlineStatus', () => {
  it('returns true when online')
  it('returns false when offline')
  it('updates when online event fires')
  it('updates when offline event fires')
  it('cleans up event listeners on unmount')
})

// src/lib/offline/__tests__/queue.test.ts
describe('Offline Queue', () => {
  it('queues action when offline')
  it('retrieves pending actions')
  it('processes queue when online')
  it('removes action after successful processing')
  it('retries failed actions')
  it('persists across page reloads')
})
```

### Integration Tests

```typescript
// src/components/__tests__/OfflineBanner.test.tsx
describe('OfflineBanner', () => {
  it('is hidden when online')
  it('displays banner when offline')
  it('hides banner when back online')
  it('shows pending action count')
})

// src/components/__tests__/EmptyState.test.tsx
describe('EmptyState', () => {
  it('renders icon, title, and description')
  it('renders action button when provided')
  it('calls onClick when action clicked')
  it('renders children when provided')
})
```

### E2E Regression Tests

```typescript
// e2e/regression.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Full App Regression', () => {
  test('complete invoice creation flow', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Create invoice via text
    await page.click('text=New Invoice')
    await page.click('[data-value="text"]')
    await page.fill('textarea', 'Job for John Smith, 2 hours at $90/hr')
    await page.click('button:has-text("Generate Invoice")')

    // Edit invoice
    await page.fill('[name="unit_price-0"]', '90')
    await page.click('button:has-text("Save Draft")')

    // Send invoice
    await page.click('button:has-text("Send Invoice")')
    await page.click('button:has-text("Send Invoice"):visible')
    await expect(page.locator('text=Sent successfully')).toBeVisible()

    // Verify on dashboard
    await page.goto('/dashboard')
    await expect(page.locator('text=John Smith')).toBeVisible()
    await expect(page.locator('[data-testid="status-badge"]:has-text("Sent")')).toBeVisible()
  })

  test('business profile management', async ({ page }) => {
    await page.goto('/profiles')
    await page.click('text=Add Profile')
    await page.fill('[name="trading_name"]', 'Test Business')
    await page.fill('[name="abn"]', '51824753556')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Test Business')).toBeVisible()
  })

  test('mobile responsiveness', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE
    await page.goto('/dashboard')

    // Verify mobile layout
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible()
    await expect(page.locator('[data-testid="invoice-card"]').first()).toBeVisible()
  })
})
```

### Performance Tests

```typescript
// e2e/performance.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Performance', () => {
  test('dashboard loads within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime

    expect(loadTime).toBeLessThan(3000) // 3 seconds
  })

  test('invoice generation completes within acceptable time', async ({ page }) => {
    await page.goto('/invoices/new')
    await page.click('[data-value="text"]')
    await page.fill('textarea', 'Test job description')

    const startTime = Date.now()
    await page.click('button:has-text("Generate Invoice")')
    await page.waitForURL(/\/edit/)
    const generateTime = Date.now() - startTime

    expect(generateTime).toBeLessThan(5000) // 5 seconds
  })
})
```

---

## Acceptance Criteria

### Functional Requirements
- [ ] All error boundaries catch and display errors gracefully
- [ ] Loading skeletons appear during data fetches
- [ ] Empty states guide users to next action
- [ ] Offline banner appears when disconnected
- [ ] Actions queue when offline
- [ ] Queued actions sync when online
- [ ] App works on all mobile screen sizes
- [ ] All Lighthouse scores > 90
- [ ] Sentry captures and reports errors
- [ ] Analytics tracking page views and events
- [ ] Security audit passes all checks
- [ ] Beta feedback addressed
- [ ] Documentation complete
- [ ] All critical bugs fixed

### Testing Requirements
- [ ] ErrorBoundary tests pass
- [ ] useOnlineStatus hook tests pass
- [ ] Offline queue tests pass
- [ ] Full E2E regression suite passes
- [ ] Performance benchmarks met
- [ ] Mobile responsiveness verified
- [ ] All previous phase tests still pass
