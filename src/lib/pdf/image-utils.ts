/**
 * Utility functions for handling images in PDF generation
 * @react-pdf/renderer has issues with external URLs, so we convert to base64
 */

/**
 * Fetches an image from a URL and converts it to a base64 data URL
 * Returns null if the fetch fails
 */
export async function imageUrlToBase64(url: string | null | undefined): Promise<string | null> {
  if (!url) return null

  try {
    // Add timeout to prevent hanging
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'image/*',
      }
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`[image-utils] Failed to fetch image: ${response.status} ${response.statusText}`)
      return null
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const arrayBuffer = await response.arrayBuffer()

    if (arrayBuffer.byteLength === 0) {
      console.error('[image-utils] Received empty image data')
      return null
    }

    const base64 = Buffer.from(arrayBuffer).toString('base64')

    if (!base64 || base64.length === 0) {
      console.error('[image-utils] Base64 conversion resulted in empty string')
      return null
    }

    const dataUrl = `data:${contentType};base64,${base64}`

    if (!dataUrl.startsWith('data:image/') || !dataUrl.includes(';base64,')) {
      console.error('[image-utils] Invalid data URL format')
      return null
    }

    return dataUrl
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[image-utils] Image fetch timed out')
    } else {
      console.error('[image-utils] Error converting image to base64:', error)
    }
    return null
  }
}

/**
 * Processes a business profile to convert logo_url to base64
 * Returns the profile with logo_url replaced by base64 data URL
 */
export async function processBusinessProfileLogo<T extends { logo_url?: string | null }>(
  profile: T
): Promise<T> {
  if (!profile.logo_url) return profile

  const base64Logo = await imageUrlToBase64(profile.logo_url)

  if (base64Logo) {
    return {
      ...profile,
      logo_url: base64Logo,
    }
  }

  // If base64 fails, keep the original URL
  console.warn('[image-utils] Base64 conversion failed, keeping original URL')
  return profile
}
