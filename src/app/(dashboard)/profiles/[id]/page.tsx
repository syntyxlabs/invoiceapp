'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { BusinessProfileForm, ReminderSettings } from '@/components/profile'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'

interface EditProfilePageProps {
  params: Promise<{ id: string }>
}

export default function EditProfilePage({ params }: EditProfilePageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { useProfile, deleteProfile, isDeleting, checkCanDelete } = useBusinessProfile()
  const { data: profile, isLoading, isError, error } = useProfile(id)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isCheckingDelete, setIsCheckingDelete] = useState(false)

  const handleDelete = async () => {
    setDeleteError(null)
    setIsCheckingDelete(true)

    try {
      const canDelete = await checkCanDelete(id)
      if (!canDelete) {
        setDeleteError('Cannot delete this profile because it has existing invoices.')
        setIsCheckingDelete(false)
        return
      }

      await deleteProfile(id)
      toast.success('Profile deleted successfully')
      router.push('/profiles')
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete profile')
      setIsCheckingDelete(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/profiles">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="space-y-2">
            <div className="h-7 w-48 bg-muted rounded animate-pulse" />
            <div className="h-5 w-32 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-5 w-32 bg-muted rounded" />
            <div className="h-4 w-64 bg-muted rounded" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-10 w-full bg-muted rounded" />
            <div className="h-10 w-full bg-muted rounded" />
            <div className="h-10 w-full bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/profiles">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Error</h1>
            <p className="text-muted-foreground">
              Failed to load profile
            </p>
          </div>
        </div>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Profile</CardTitle>
            <CardDescription>
              {error?.message || 'An unexpected error occurred'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/profiles">
              <Button variant="outline">Back to Profiles</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/profiles">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Not Found</h1>
            <p className="text-muted-foreground">
              Profile not found
            </p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>
              The profile you're looking for doesn't exist or has been deleted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/profiles">
              <Button variant="outline">Back to Profiles</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/profiles">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Profile</h1>
            <p className="text-muted-foreground">
              {profile.trading_name}
            </p>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Profile
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Business Profile</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{profile.trading_name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {deleteError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {deleteError}
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting || isCheckingDelete}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting || isCheckingDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting || isCheckingDelete ? (
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
      </div>

      <BusinessProfileForm profile={profile} mode="edit" />

      {/* Reminder Settings */}
      <ReminderSettings businessProfileId={id} />
    </div>
  )
}
