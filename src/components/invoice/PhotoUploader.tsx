'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/images/optimize'
import Image from 'next/image'

export interface Photo {
  id: string
  storage_path: string
  filename: string
  url?: string
}

interface PhotoUploaderProps {
  draftId: string
  photos: Photo[]
  onChange: (photos: Photo[]) => void
  maxPhotos?: number
}

export function PhotoUploader({
  draftId,
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

      // Compress image before upload
      setUploadProgress(20)
      const compressedBlob = await compressImage(file)
      setUploadProgress(40)

      // Generate unique filename
      const ext = 'jpg' // Always jpg after compression
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const storagePath = `${user.id}/${draftId}/${filename}`

      // Upload to Supabase Storage
      setUploadProgress(60)
      const { error: uploadError } = await supabase.storage
        .from('invoice-photos')
        .upload(storagePath, compressedBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        })

      if (uploadError) throw uploadError

      // Get signed URL for preview
      setUploadProgress(80)
      const { data: signedUrlData } = await supabase.storage
        .from('invoice-photos')
        .createSignedUrl(storagePath, 3600) // 1 hour

      // Create photo record
      const newPhoto: Photo = {
        id: crypto.randomUUID(),
        storage_path: storagePath,
        filename: file.name,
        url: signedUrlData?.signedUrl
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
              data-testid="photo-preview"
              className="relative aspect-square bg-muted rounded-lg overflow-hidden group"
            >
              {photo.url ? (
                <Image
                  src={photo.url}
                  alt={photo.filename}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              {/* Delete button */}
              <button
                onClick={() => removePhoto(photo.id)}
                data-testid="delete-photo"
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
