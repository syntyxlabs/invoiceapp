'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

interface LogoUploadProps {
  currentLogoUrl: string | null
  onLogoChange: (url: string | null) => void
  userId: string
  profileId?: string
}

export function LogoUpload({ currentLogoUrl, onLogoChange, userId, profileId }: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB')
      return
    }

    setIsUploading(true)

    try {
      const supabase = createClient()

      // Generate unique filename
      const ext = file.name.split('.').pop()
      const filename = `${userId}/${profileId || 'new'}-${Date.now()}.${ext}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('business-logos')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('business-logos')
        .getPublicUrl(filename)

      setPreviewUrl(publicUrl)
      onLogoChange(publicUrl)
      toast.success('Logo uploaded successfully')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload logo')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!currentLogoUrl) return

    try {
      const supabase = createClient()

      // Extract path from URL
      const urlParts = currentLogoUrl.split('/business-logos/')
      if (urlParts[1]) {
        await supabase.storage
          .from('business-logos')
          .remove([urlParts[1]])
      }

      setPreviewUrl(null)
      onLogoChange(null)
      toast.success('Logo removed')
    } catch (error) {
      console.error('Remove error:', error)
      toast.error('Failed to remove logo')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        {/* Logo Preview */}
        <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 overflow-hidden">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Business logo"
              className="w-full h-full object-contain"
            />
          ) : (
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {previewUrl ? 'Change Logo' : 'Upload Logo'}
              </>
            )}
          </Button>

          {previewUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-destructive hover:text-destructive"
            >
              <X className="w-4 h-4 mr-2" />
              Remove
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Recommended: Square image, PNG or JPG, max 2MB
      </p>
    </div>
  )
}
