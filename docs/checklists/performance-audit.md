# Performance Audit Checklist

## Images
- [ ] Next.js Image component used
- [ ] Images optimized and lazy loaded
- [ ] Proper sizing and formats

## Data Fetching
- [ ] React Query for caching
- [ ] Pagination on lists
- [ ] Prefetching for navigation

## Bundle Size
- [ ] Code splitting configured
- [ ] Tree shaking working
- [ ] Dynamic imports for heavy components
- [ ] PDF renderer only loaded when needed

## Core Web Vitals
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1

## Lighthouse Scores
- [ ] Performance > 90
- [ ] Accessibility > 90
- [ ] Best Practices > 90
- [ ] SEO > 90
- [ ] PWA > 90

## Database
- [ ] Indexes on frequently queried columns
- [ ] Pagination implemented for list queries
- [ ] N+1 queries eliminated
- [ ] Connection pooling configured

## Caching
- [ ] Static assets cached properly
- [ ] API responses cached where appropriate
- [ ] React Query stale times configured
