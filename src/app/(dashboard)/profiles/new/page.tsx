import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { BusinessProfileForm } from '@/components/profile'

export default function NewProfilePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/profiles">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Business Profile</h1>
          <p className="text-muted-foreground">
            Create a new business profile for invoicing
          </p>
        </div>
      </div>

      <BusinessProfileForm mode="create" />
    </div>
  )
}
