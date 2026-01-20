import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ClientForm } from '@/components/client'

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Client</h1>
          <p className="text-muted-foreground">
            Add a new client for quick invoicing
          </p>
        </div>
      </div>

      <ClientForm />
    </div>
  )
}
