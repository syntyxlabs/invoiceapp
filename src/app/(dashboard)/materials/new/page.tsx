import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { MaterialForm } from '@/components/materials'

export default function NewMaterialPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/materials">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Material</h1>
          <p className="text-muted-foreground">
            Add a new material to your catalog
          </p>
        </div>
      </div>

      <MaterialForm />
    </div>
  )
}
