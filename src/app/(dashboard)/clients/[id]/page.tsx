'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ClientForm } from '@/components/client'
import { useClients } from '@/hooks/useClients'

interface EditClientPageProps {
  params: Promise<{ id: string }>
}

export default function EditClientPage({ params }: EditClientPageProps) {
  const { id } = use(params)
  const { useClient } = useClients()
  const { data: client, isLoading, isError, error } = useClient(id)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/clients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Client</h1>
          </div>
        </div>

        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (isError || !client) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/clients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Client</h1>
          </div>
        </div>

        <Card>
          <CardContent className="py-8">
            <p className="text-center text-destructive">
              {isError ? `Error: ${error?.message || 'Failed to load client'}` : 'Client not found'}
            </p>
            <div className="flex justify-center mt-4">
              <Link href="/clients">
                <Button variant="outline">Back to Clients</Button>
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
        <Link href="/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Client</h1>
          <p className="text-muted-foreground">
            Update {client.name}&apos;s details
          </p>
        </div>
      </div>

      <ClientForm client={client} isEdit />
    </div>
  )
}
