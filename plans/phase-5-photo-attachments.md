# Phase 5: Photo Attachments

**Timeline**: Week 5
**Goal**: Photo upload and management for proof of work

---

## Tasks

| Task | Priority | Estimate |
|------|----------|----------|
| Create Supabase Storage buckets | P0 | 1h |
| Configure storage RLS policies | P0 | 2h |
| Build PhotoUploader component | P0 | 4h |
| Add camera capture support | P0 | 3h |
| Implement photo preview/delete | P0 | 2h |
| Handle photo upload progress | P1 | 2h |
| Add photo reordering | P2 | 2h |

---

## Deliverable

Full photo management for invoices

---

## Technical Details

### 1. Storage Configuration

Storage buckets are created in Phase 1 migration. Verify configuration:

```sql
-- Bucket: invoice-photos (private)
-- Structure: {user_id}/{invoice_id}/{filename}

-- Verify policies exist
SELECT * FROM storage.policies WHERE bucket_id = 'invoice-photos';
```

### 2. Photo Uploader Component

```typescript
// src/components/invoice/PhotoUploader.tsx
'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface Photo {
  id: string
  storage_path: string
  filename: string
  url?: string
}

interface PhotoUploaderProps {
  invoiceId: string
  photos: Photo[]
  onChange: (photos: Photo[]) => void
  maxPhotos?: number
}

export function PhotoUploader({
  invoiceId,
  photos,
  onChange,
  maxPhotos = 10
}: PhotoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  const uploadPhoto = async (file: File) => {
    if (photos.length >= maxPhotos) {
      setError(`Maximum ${maxPhotos} photos allowed`)
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB')
      return
    }

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Generate unique filename
      const ext = file.name.split('.').pop() || 'jpg'
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const storagePath = `${user.id}/${invoiceId}/${filename}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('invoice-photos')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get signed URL for preview
      const { data: { signedUrl } } = await supabase.storage
        .from('invoice-photos')
        .createSignedUrl(storagePath, 3600) // 1 hour

      // Create photo record
      const newPhoto: Photo = {
        id: crypto.randomUUID(),
        storage_path: storagePath,
        filename: file.name,
        url: signedUrl
      }

      onChange([...photos, newPhoto])
      setUploadProgress(100)

    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload photo. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      Array.from(files).forEach(uploadPhoto)
    }
    // Reset input
    e.target.value = ''
  }

  const removePhoto = async (photoId: string) => {
    const photo = photos.find(p => p.id === photoId)
    if (!photo) return

    try {
      // Delete from storage
      await supabase.storage
        .from('invoice-photos')
        .remove([photo.storage_path])

      // Update state
      onChange(photos.filter(p => p.id !== photoId))

    } catch (err) {
      console.error('Delete error:', err)
      setError('Failed to delete photo')
    }
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const openCamera = () => {
    cameraInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Photos ({photos.length}/{maxPhotos})</h3>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={openCamera}
            disabled={isUploading || photos.length >= maxPhotos}
          >
            <Camera className="h-4 w-4 mr-2" />
            Camera
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={openFilePicker}
            disabled={isUploading || photos.length >= maxPhotos}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload progress */}
      {isUploading && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Uploading...</span>
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Photo grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square bg-muted rounded-lg overflow-hidden group"
            >
              {photo.url ? (
                <Image
                  src={photo.url}
                  alt={photo.filename}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              {/* Delete button */}
              <button
                onClick={() => removePhoto(photo.id)}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full
                         opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No photos attached. Add photos as proof of work.
          </p>
        </div>
      )}
    </div>
  )
}
```

### 3. Photo Hook

```typescript
// src/hooks/useInvoicePhotos.ts
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Photo {
  id: string
  invoice_id: string
  storage_path: string
  filename: string
  mime_type: string
  size_bytes: number
  sort_order: number
  created_at: string
  url?: string
}

export function useInvoicePhotos(invoiceId: string) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Fetch photos on mount
  useEffect(() => {
    if (!invoiceId) return

    const fetchPhotos = async () => {
      setIsLoading(true)

      try {
        const { data, error: fetchError } = await supabase
          .from('invoice_photos')
          .select('*')
          .eq('invoice_id', invoiceId)
          .order('sort_order', { ascending: true })

        if (fetchError) throw fetchError

        // Get signed URLs for each photo
        const photosWithUrls = await Promise.all(
          (data || []).map(async (photo) => {
            const { data: { signedUrl } } = await supabase.storage
              .from('invoice-photos')
              .createSignedUrl(photo.storage_path, 3600)

            return { ...photo, url: signedUrl }
          })
        )

        setPhotos(photosWithUrls)

      } catch (err) {
        console.error('Error fetching photos:', err)
        setError('Failed to load photos')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPhotos()
  }, [invoiceId, supabase])

  // Save photo to database
  const savePhoto = async (photo: Omit<Photo, 'id' | 'created_at' | 'url'>) => {
    const { data, error } = await supabase
      .from('invoice_photos')
      .insert({
        ...photo,
        sort_order: photos.length
      })
      .select()
      .single()

    if (error) throw error

    return data
  }

  // Delete photo from database and storage
  const deletePhoto = async (photoId: string) => {
    const photo = photos.find(p => p.id === photoId)
    if (!photo) return

    // Delete from storage
    await supabase.storage
      .from('invoice-photos')
      .remove([photo.storage_path])

    // Delete from database
    await supabase
      .from('invoice_photos')
      .delete()
      .eq('id', photoId)

    setPhotos(prev => prev.filter(p => p.id !== photoId))
  }

  // Reorder photos
  const reorderPhotos = async (newOrder: string[]) => {
    const updates = newOrder.map((id, index) => ({
      id,
      sort_order: index
    }))

    for (const update of updates) {
      await supabase
        .from('invoice_photos')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id)
    }

    setPhotos(prev => {
      const sorted = [...prev]
      sorted.sort((a, b) =>
        newOrder.indexOf(a.id) - newOrder.indexOf(b.id)
      )
      return sorted
    })
  }

  return {
    photos,
    isLoading,
    error,
    savePhoto,
    deletePhoto,
    reorderPhotos,
    setPhotos
  }
}
```

### 4. Integration with Invoice Editor

```typescript
// Add to src/components/invoice/InvoiceEditor.tsx

import { PhotoUploader } from './PhotoUploader'
import { useInvoicePhotos } from '@/hooks/useInvoicePhotos'

// Inside InvoiceEditor component:
const { photos, setPhotos, savePhoto, deletePhoto } = useInvoicePhotos(invoiceId)

// In the JSX, add before Notes section:
<Card>
  <CardContent className="pt-6">
    <PhotoUploader
      invoiceId={invoiceId}
      photos={photos}
      onChange={async (newPhotos) => {
        // Save new photos to database
        const addedPhotos = newPhotos.filter(
          np => !photos.some(p => p.id === np.id)
        )

        for (const photo of addedPhotos) {
          await savePhoto({
            invoice_id: invoiceId,
            storage_path: photo.storage_path,
            filename: photo.filename,
            mime_type: 'image/jpeg',
            size_bytes: 0,
            sort_order: photos.length
          })
        }

        setPhotos(newPhotos)
      }}
    />
  </CardContent>
</Card>
```

### 5. Image Optimization

```typescript
// src/lib/images/optimize.ts
export async function compressImage(
  file: File,
  maxWidth = 1920,
  quality = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img

      // Scale down if needed
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to compress image'))
          }
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}
```

---

## File Structure

```
src/
├── components/
│   └── invoice/
│       └── PhotoUploader.tsx
├── hooks/
│   └── useInvoicePhotos.ts
└── lib/
    └── images/
        └── optimize.ts
```

---

## Test Specifications

### Unit Tests

```typescript
// src/lib/images/__tests__/optimize.test.ts
describe('Image Compression', () => {
  it('reduces image dimensions if exceeding maxWidth')
  it('maintains aspect ratio')
  it('returns blob with correct MIME type')
  it('applies quality compression')
  it('handles various input formats (png, jpg, webp)')
})
```

### Integration Tests

```typescript
// src/components/invoice/__tests__/PhotoUploader.test.tsx
describe('PhotoUploader', () => {
  it('renders upload and camera buttons')
  it('shows photo count and max limit')
  it('triggers file picker on upload click')
  it('triggers camera capture on camera click')
  it('shows upload progress during upload')
  it('displays uploaded photos in grid')
  it('allows photo deletion')
  it('shows error for non-image files')
  it('shows error for files over 10MB')
  it('disables buttons when max photos reached')
  it('calls onChange with updated photo list')
})

// src/hooks/__tests__/useInvoicePhotos.test.ts
describe('useInvoicePhotos', () => {
  it('fetches photos for invoice on mount')
  it('generates signed URLs for each photo')
  it('returns loading state while fetching')
  it('saves new photo to database')
  it('deletes photo from storage and database')
  it('reorders photos correctly')
  it('handles fetch errors gracefully')
})
```

### E2E Tests

```typescript
// e2e/photo-attachments.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Photo Attachments', () => {
  test('user can upload photo from gallery', async ({ page }) => {
    await page.goto('/invoices/new/edit')

    // Upload a test image file
    const fileInput = page.locator('input[type="file"][accept="image/*"]').first()
    await fileInput.setInputFiles('./e2e/fixtures/test-image.jpg')

    await expect(page.locator('[data-testid="photo-preview"]')).toBeVisible()
  })

  test('photos display in preview grid', async ({ page }) => {
    // Upload multiple photos
    const fileInput = page.locator('input[type="file"][accept="image/*"]').first()
    await fileInput.setInputFiles([
      './e2e/fixtures/test-image-1.jpg',
      './e2e/fixtures/test-image-2.jpg',
    ])

    await expect(page.locator('[data-testid="photo-preview"]')).toHaveCount(2)
  })

  test('user can delete uploaded photo', async ({ page }) => {
    // Upload a photo first
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles('./e2e/fixtures/test-image.jpg')

    await page.hover('[data-testid="photo-preview"]')
    await page.click('[data-testid="delete-photo"]')

    await expect(page.locator('[data-testid="photo-preview"]')).toHaveCount(0)
  })

  test('photos persist when saving invoice draft', async ({ page }) => {
    // Upload photo and save
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles('./e2e/fixtures/test-image.jpg')
    await page.click('button:has-text("Save Draft")')

    // Reload page
    await page.reload()

    await expect(page.locator('[data-testid="photo-preview"]')).toBeVisible()
  })
})
```

---

## Acceptance Criteria

### Functional Requirements
- [ ] User can upload photos from device gallery
- [ ] User can take photos with camera
- [ ] Photos upload to Supabase Storage correctly
- [ ] Upload progress is displayed
- [ ] Photos display in a grid preview
- [ ] User can delete uploaded photos
- [ ] Photos are deleted from storage on removal
- [ ] Maximum 10 photos per invoice enforced
- [ ] File size limit (10MB) enforced
- [ ] Only image files accepted
- [ ] Photos persist when saving draft
- [ ] Photos load correctly when editing existing invoice
- [ ] Storage path follows user/invoice/filename structure
- [ ] Signed URLs generated for preview (1 hour expiry)

### Testing Requirements
- [ ] Image compression unit tests pass
- [ ] PhotoUploader integration tests pass
- [ ] useInvoicePhotos hook tests pass
- [ ] E2E photo upload flow passes
- [ ] Storage cleanup tests pass
