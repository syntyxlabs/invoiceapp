import Link from 'next/link'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ProfileList } from '@/components/profile'

export default function ProfilesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Business Profiles</h1>
          <p className="text-muted-foreground">
            Manage your business profiles for invoicing
          </p>
        </div>
        <Link href="/profiles/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Profile
          </Button>
        </Link>
      </div>

      <ProfileList />
    </div>
  )
}
