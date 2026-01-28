import Link from 'next/link'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { MaterialList } from '@/components/materials'

export default function MaterialsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Materials</h1>
          <p className="text-muted-foreground">
            Manage your materials catalog for quick invoicing
          </p>
        </div>
        <Link href="/materials/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Material
          </Button>
        </Link>
      </div>

      <MaterialList />
    </div>
  )
}
