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
function InvoiceCardSkeleton() {
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
function DashboardStatsSkeleton() {
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
function InvoiceEditorSkeleton() {
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

// Invoice List Skeleton
function InvoiceListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <InvoiceCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Profile Card Skeleton
function ProfileCardSkeleton() {
  return (
    <div className="p-6 border rounded-lg space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}

// Table Skeleton
function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted p-3 flex gap-4">
        {[...Array(cols)].map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="p-3 flex gap-4 border-t">
          {[...Array(cols)].map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export {
  Skeleton,
  InvoiceCardSkeleton,
  DashboardStatsSkeleton,
  InvoiceEditorSkeleton,
  InvoiceListSkeleton,
  ProfileCardSkeleton,
  TableSkeleton,
}
