'use client'

import { useEffect, useState } from 'react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { getPendingCount } from '@/lib/offline/queue'
import { WifiOff } from 'lucide-react'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const updatePendingCount = async () => {
      try {
        const count = await getPendingCount()
        setPendingCount(count)
      } catch {
        // IndexedDB may not be available
        setPendingCount(0)
      }
    }

    updatePendingCount()

    // Update count periodically when offline
    if (!isOnline) {
      const interval = setInterval(updatePendingCount, 5000)
      return () => clearInterval(interval)
    }
  }, [isOnline])

  if (isOnline) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-amber-500 text-white py-2 px-4 text-center z-50">
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">
          You&apos;re offline.
          {pendingCount > 0 && ` ${pendingCount} action${pendingCount > 1 ? 's' : ''} pending.`}
          {' '}Changes will sync when you&apos;re back online.
        </span>
      </div>
    </div>
  )
}
