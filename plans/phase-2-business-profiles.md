# Phase 2: Business Profiles

**Timeline**: Week 2
**Goal**: Users can create and manage business profiles

---

## Tasks

| Task | Priority | Estimate |
|------|----------|----------|
| Create BusinessProfileForm component | P0 | 4h |
| Build profile list page | P0 | 2h |
| Build profile edit page | P0 | 3h |
| Add ABN validation (Australian format) | P1 | 2h |
| Implement default profile selection | P0 | 2h |
| Add invoice number sequence setup | P0 | 2h |

---

## Deliverable

Complete business profile management

---

## Technical Details

### 1. Business Profile Form Component

```typescript
// src/components/profile/BusinessProfileForm.tsx
interface BusinessProfileFormProps {
  profile?: BusinessProfile;
  onSave: (profile: BusinessProfile) => void;
  onCancel: () => void;
}

// Fields:
// - Trading name (required)
// - Business name (optional)
// - ABN (validated, 11 digits)
// - Address (optional)
// - GST registered (toggle)
// - Default hourly rate (number)
// - Bank BSB (6 digits)
// - Bank account number
// - PayID (email or phone format)
// - Payment link (URL)
// - Default footer note (textarea)
```

### 2. ABN Validation

Australian Business Numbers have a specific checksum algorithm:

```typescript
// src/lib/validation/abn.ts
export function validateABN(abn: string): boolean {
  // Remove spaces
  const cleaned = abn.replace(/\s/g, '');

  // Must be 11 digits
  if (!/^\d{11}$/.test(cleaned)) {
    return false;
  }

  // ABN checksum weights
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

  // Subtract 1 from first digit
  const digits = cleaned.split('').map(Number);
  digits[0] -= 1;

  // Calculate weighted sum
  const sum = digits.reduce((acc, digit, i) => acc + digit * weights[i], 0);

  // Valid if divisible by 89
  return sum % 89 === 0;
}

export function formatABN(abn: string): string {
  const cleaned = abn.replace(/\s/g, '');
  // Format: XX XXX XXX XXX
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
}
```

### 3. BSB Validation

```typescript
// src/lib/validation/bsb.ts
export function validateBSB(bsb: string): boolean {
  const cleaned = bsb.replace(/[-\s]/g, '');
  return /^\d{6}$/.test(cleaned);
}

export function formatBSB(bsb: string): string {
  const cleaned = bsb.replace(/[-\s]/g, '');
  // Format: XXX-XXX
  return cleaned.replace(/(\d{3})(\d{3})/, '$1-$2');
}
```

### 4. Profile List Page

```typescript
// src/app/(dashboard)/profiles/page.tsx
// - List all business profiles for user
// - Show which is default (star icon)
// - Click to edit
// - Add new profile button
// - Set as default action
```

### 5. Profile Edit Page

```typescript
// src/app/(dashboard)/profiles/[id]/page.tsx
// - Load existing profile or empty form for new
// - Save/Cancel buttons
// - Delete button with confirmation
// - Cannot delete if invoices exist
```

### 6. Invoice Sequence Setup

```typescript
// Part of BusinessProfileForm
// - Prefix field (default: "INV")
// - Starting number field (default: 1)
// - Preview: "INV-00001"
```

---

## File Structure

```
src/
├── app/(dashboard)/
│   └── profiles/
│       ├── page.tsx              # Profile list
│       ├── new/
│       │   └── page.tsx          # New profile form
│       └── [id]/
│           └── page.tsx          # Edit profile
├── components/
│   └── profile/
│       ├── BusinessProfileForm.tsx
│       ├── ProfileCard.tsx
│       └── ProfileList.tsx
├── lib/
│   └── validation/
│       ├── abn.ts
│       └── bsb.ts
└── hooks/
    └── useBusinessProfile.ts
```

---

## API/Database Operations

```typescript
// src/hooks/useBusinessProfile.ts
import { createClient } from '@/lib/supabase/client'

export function useBusinessProfiles() {
  const supabase = createClient()

  async function getProfiles() {
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .order('created_at', { ascending: false })
    return { data, error }
  }

  async function getProfile(id: string) {
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  }

  async function createProfile(profile: Omit<BusinessProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('business_profiles')
      .insert({ ...profile, user_id: user?.id })
      .select()
      .single()
    return { data, error }
  }

  async function updateProfile(id: string, updates: Partial<BusinessProfile>) {
    const { data, error } = await supabase
      .from('business_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  }

  async function setDefaultProfile(id: string) {
    // First, unset all defaults
    await supabase
      .from('business_profiles')
      .update({ is_default: false })
      .neq('id', id)

    // Then set this one as default
    const { data, error } = await supabase
      .from('business_profiles')
      .update({ is_default: true })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  }

  async function deleteProfile(id: string) {
    // Check for existing invoices first
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('business_profile_id', id)

    if (count && count > 0) {
      return { error: { message: 'Cannot delete profile with existing invoices' } }
    }

    const { error } = await supabase
      .from('business_profiles')
      .delete()
      .eq('id', id)
    return { error }
  }

  return {
    getProfiles,
    getProfile,
    createProfile,
    updateProfile,
    setDefaultProfile,
    deleteProfile,
  }
}
```

---

## Test Specifications

### Unit Tests (TDD - Write First)

```typescript
// src/lib/validation/__tests__/abn.test.ts
import { validateABN, formatABN } from '../abn'

describe('validateABN', () => {
  it('validates correct ABN with checksum', () => {
    expect(validateABN('51824753556')).toBe(true)  // Valid example
    expect(validateABN('53004085616')).toBe(true)  // Woolworths
  })

  it('validates ABN with spaces', () => {
    expect(validateABN('51 824 753 556')).toBe(true)
  })

  it('rejects invalid ABN checksum', () => {
    expect(validateABN('12345678901')).toBe(false)
  })

  it('rejects ABN with wrong length', () => {
    expect(validateABN('1234567890')).toBe(false)   // Too short
    expect(validateABN('123456789012')).toBe(false) // Too long
  })

  it('rejects non-numeric ABN', () => {
    expect(validateABN('abcdefghijk')).toBe(false)
  })
})

describe('formatABN', () => {
  it('formats ABN as XX XXX XXX XXX', () => {
    expect(formatABN('51824753556')).toBe('51 824 753 556')
  })

  it('handles already formatted ABN', () => {
    expect(formatABN('51 824 753 556')).toBe('51 824 753 556')
  })
})

// src/lib/validation/__tests__/bsb.test.ts
import { validateBSB, formatBSB } from '../bsb'

describe('validateBSB', () => {
  it('validates correct BSB format', () => {
    expect(validateBSB('123456')).toBe(true)
    expect(validateBSB('123-456')).toBe(true)
  })

  it('rejects invalid BSB length', () => {
    expect(validateBSB('12345')).toBe(false)   // Too short
    expect(validateBSB('1234567')).toBe(false) // Too long
  })

  it('rejects non-numeric BSB', () => {
    expect(validateBSB('abc-def')).toBe(false)
  })
})

describe('formatBSB', () => {
  it('formats BSB as XXX-XXX', () => {
    expect(formatBSB('123456')).toBe('123-456')
  })
})
```

### Integration Tests

```typescript
// src/components/profile/__tests__/BusinessProfileForm.test.tsx
describe('BusinessProfileForm', () => {
  it('renders all required fields')
  it('pre-fills data when editing existing profile')
  it('validates ABN on blur and shows error for invalid')
  it('validates BSB on blur and shows error for invalid')
  it('shows invoice number preview based on prefix/starting number')
  it('submits form with valid data')
  it('shows error toast on failed submission')
  it('disables submit button while saving')
})

// src/hooks/__tests__/useBusinessProfile.test.ts
describe('useBusinessProfile Hook', () => {
  it('fetches profiles for current user')
  it('creates new profile')
  it('updates existing profile')
  it('sets default profile and unsets others')
  it('prevents deletion of profile with invoices')
  it('deletes profile without invoices')
})

// src/app/(dashboard)/profiles/__tests__/page.test.tsx
describe('Profiles List Page', () => {
  it('displays list of business profiles')
  it('shows default profile with star indicator')
  it('navigates to edit page on card click')
  it('navigates to new profile page on button click')
  it('shows empty state when no profiles')
})
```

### E2E Tests

```typescript
// e2e/business-profiles.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Business Profiles', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
  })

  test('user can create first business profile', async ({ page }) => {
    await page.goto('/profiles/new')
    await page.fill('[name="trading_name"]', 'Smith Electrical')
    await page.fill('[name="abn"]', '51824753556')
    await page.fill('[name="bank_bsb"]', '123456')
    await page.fill('[name="bank_account"]', '12345678')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/profiles')
    await expect(page.locator('text=Smith Electrical')).toBeVisible()
  })

  test('ABN validation shows real-time feedback', async ({ page }) => {
    await page.goto('/profiles/new')
    await page.fill('[name="abn"]', '12345678901')
    await page.blur('[name="abn"]')
    await expect(page.locator('text=Invalid ABN')).toBeVisible()
  })

  test('user can set a profile as default', async ({ page }) => {
    await page.goto('/profiles')
    await page.click('[data-testid="set-default-btn"]')
    await expect(page.locator('[data-testid="default-indicator"]')).toBeVisible()
  })
})
```

---

## Acceptance Criteria

### Functional Requirements
- [ ] User can create a new business profile
- [ ] ABN validation works correctly (checksum)
- [ ] BSB formats as XXX-XXX
- [ ] User can edit existing profiles
- [ ] User can set a profile as default
- [ ] Default profile is marked visually
- [ ] User cannot delete profile with existing invoices
- [ ] Invoice number prefix and starting number can be configured
- [ ] All form fields validate appropriately
- [ ] Loading and error states displayed properly

### Testing Requirements
- [ ] ABN validation unit tests pass
- [ ] BSB validation unit tests pass
- [ ] BusinessProfileForm integration tests pass
- [ ] E2E profile creation flow passes
- [ ] Code coverage > 80% for validation functions
