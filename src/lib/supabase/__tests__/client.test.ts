import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the createBrowserClient
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
    },
  })),
}))

describe('Supabase Browser Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set up environment variables for tests
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  it('creates browser client with environment variables', async () => {
    const { createClient } = await import('../client')
    const client = createClient()

    expect(client).toBeDefined()
    expect(client.auth).toBeDefined()
  })

  it('client has auth methods available', async () => {
    const { createClient } = await import('../client')
    const client = createClient()

    expect(client.auth.signInWithPassword).toBeDefined()
    expect(client.auth.signUp).toBeDefined()
    expect(client.auth.signOut).toBeDefined()
    expect(client.auth.getUser).toBeDefined()
  })
})
