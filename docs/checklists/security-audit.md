# Security Audit Checklist

## Row-Level Security (RLS)
- [ ] All tables have RLS enabled
- [ ] Users can only access their own data
- [ ] Line items/photos accessible only through invoice ownership
- [ ] Reminder settings accessible through business profile ownership
- [ ] Storage buckets have proper policies

## API Routes
- [ ] All routes check authentication
- [ ] Input validation on all endpoints
- [ ] Rate limiting configured
- [ ] No sensitive data in responses
- [ ] Error messages don't leak information

## Authentication
- [ ] Session cookies are HttpOnly
- [ ] CSRF protection enabled
- [ ] Password requirements enforced
- [ ] Account lockout after failed attempts

## Data Protection
- [ ] No card data stored
- [ ] ABN/BSB/bank details encrypted at rest
- [ ] PDFs stored privately
- [ ] Photos stored privately
- [ ] Signed URLs expire after 1 hour

## Headers
- [ ] Content-Security-Policy configured
- [ ] X-Frame-Options set
- [ ] X-Content-Type-Options set
- [ ] Referrer-Policy set

## Environment
- [ ] API keys in environment variables
- [ ] No secrets in client-side code
- [ ] Production environment isolated

## Supabase-Specific
- [ ] Service role key only used server-side
- [ ] Anon key has minimal permissions
- [ ] Database functions are SECURITY DEFINER only when necessary
- [ ] Realtime disabled for sensitive tables
