'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MaterialForm } from '@/components/materials'
import { useMaterials } from '@/hooks/useMaterials'

interface EditMaterialPageProps {
  params: Promise<{ id: string }>
}

export default function EditMaterialPage({ params }: EditMaterialPageProps) {
  const { id } = use(params)
  const { useMaterial } = useMaterials()
  const { data: material, isLoading, isError, error } = useMaterial(id)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/materials">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Material</h1>
          </div>
        </div>

        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (isError || !material) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/materials">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Material</h1>
          </div>
        </div>

        <Card>
          <CardContent className="py-8">
            <p className="text-center text-destructive">
              {isError ? `Error: ${error?.message || 'Failed to load material'}` : 'Material not found'}
            </p>
            <div className="flex justify-center mt-4">
              <Link href="/materials">
                <Button variant="outline">Back to Materials</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/materials">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Material</h1>
          <p className="text-muted-foreground">
            Update {material.name}
          </p>
        </div>
      </div>

      <MaterialForm material={material} isEdit />
    </div>
  )
}
