'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Package, DollarSign, MoreVertical, Pencil, Trash2, Loader2, Search } from 'lucide-react'
import { useMaterials, type Material } from '@/hooks/useMaterials'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const UNIT_LABELS: Record<string, string> = {
  ea: 'ea',
  m: 'm',
  m2: 'm²',
  m3: 'm³',
  kg: 'kg',
  l: 'L',
}

export function MaterialList() {
  const router = useRouter()
  const { materials, isLoading, isError, error, deleteMaterial, isDeleting } = useMaterials()
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const handleDelete = async () => {
    if (!materialToDelete) return

    try {
      setDeleteError(null)
      await deleteMaterial(materialToDelete.id)
      setMaterialToDelete(null)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete material')
    }
  }

  // Filter by search query
  const filteredMaterials = searchQuery
    ? materials.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : materials

  // Group by category
  const grouped = filteredMaterials.reduce<Record<string, Material[]>>((acc, m) => {
    const cat = m.category || 'Uncategorised'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(m)
    return acc
  }, {})

  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    if (a === 'Uncategorised') return 1
    if (b === 'Uncategorised') return -1
    return a.localeCompare(b)
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-destructive">
            Error loading materials: {error?.message || 'Unknown error'}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (materials.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <Package className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground text-center">
            No materials yet. Add your first material to build your catalog.
          </p>
          <Link href="/materials/new">
            <Button>Add Your First Material</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search materials..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Materials grouped by category */}
      <div className="space-y-6">
        {sortedCategories.map((category) => (
          <div key={category}>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              {category}
            </h3>
            <div className="grid gap-3">
              {grouped[category].map((material) => (
                <Card key={material.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <Link href={`/materials/${material.id}`} className="block">
                          <h4 className="font-semibold truncate hover:underline">
                            {material.name}
                          </h4>
                        </Link>

                        {material.description && (
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                            {material.description}
                          </p>
                        )}

                        <div className="mt-2 flex items-center gap-3 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {UNIT_LABELS[material.default_unit] || material.default_unit}
                          </Badge>
                          {material.default_unit_price !== null && (
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <DollarSign className="h-3 w-3" />
                              {material.default_unit_price.toFixed(2)}/{UNIT_LABELS[material.default_unit] || material.default_unit}
                            </span>
                          )}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="flex-shrink-0">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/materials/${material.id}`)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setMaterialToDelete(material)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {filteredMaterials.length === 0 && searchQuery && (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                No materials matching &quot;{searchQuery}&quot;
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!materialToDelete} onOpenChange={() => setMaterialToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Material</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{materialToDelete?.name}&quot;? This will remove it from your catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
