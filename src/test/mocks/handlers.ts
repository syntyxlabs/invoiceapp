import { http, HttpResponse } from 'msw'

// Base URL for Supabase API
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co'

export const handlers = [
  // Auth handlers
  http.post(`${SUPABASE_URL}/auth/v1/token`, async ({ request }) => {
    const body = await request.json() as { email?: string; password?: string; grant_type?: string }

    if (body.grant_type === 'password') {
      if (body.email === 'test@example.com' && body.password === 'SecurePass123!') {
        return HttpResponse.json({
          access_token: 'mock-access-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh-token',
          user: {
            id: 'mock-user-id',
            email: 'test@example.com',
            email_confirmed_at: new Date().toISOString(),
          },
        })
      }
      return HttpResponse.json(
        { error: 'invalid_grant', error_description: 'Invalid login credentials' },
        { status: 400 }
      )
    }
    return HttpResponse.json({ error: 'unsupported_grant_type' }, { status: 400 })
  }),

  http.post(`${SUPABASE_URL}/auth/v1/signup`, async ({ request }) => {
    const body = await request.json() as { email?: string; password?: string }

    if (body.email === 'existing@example.com') {
      return HttpResponse.json(
        { error: 'user_already_exists', error_description: 'User already registered' },
        { status: 422 }
      )
    }

    return HttpResponse.json({
      id: 'new-user-id',
      email: body.email,
      email_confirmed_at: null,
    })
  }),

  http.post(`${SUPABASE_URL}/auth/v1/recover`, async () => {
    return HttpResponse.json({})
  }),

  http.get(`${SUPABASE_URL}/auth/v1/user`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (authHeader === 'Bearer mock-access-token') {
      return HttpResponse.json({
        id: 'mock-user-id',
        email: 'test@example.com',
        email_confirmed_at: new Date().toISOString(),
      })
    }

    return HttpResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }),

  http.post(`${SUPABASE_URL}/auth/v1/logout`, async () => {
    return HttpResponse.json({})
  }),
]
