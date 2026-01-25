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
    console.log(`[image-utils] Fetching image from: ${url.substring(0, 100)}...`)

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

    // Validate base64 string
    if (!base64 || base64.length === 0) {
      console.error('[image-utils] Base64 conversion resulted in empty string')
      return null
    }

    const dataUrl = `data:${contentType};base64,${base64}`

    // Validate the data URL format
    if (!dataUrl.startsWith('data:image/') || !dataUrl.includes(';base64,')) {
      console.error('[image-utils] Invalid data URL format')
      return null
    }

    console.log(`[image-utils] Successfully converted image (${contentType}, ${arrayBuffer.byteLength} bytes, base64: ${base64.length} chars)`)
    console.log(`[image-utils] Data URL prefix: ${dataUrl.substring(0, 50)}...`)

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
  if (!profile.logo_url) {
    console.log('[image-utils] No logo_url in business profile')
    return profile
  }

  console.log('[image-utils] Processing business profile logo:', profile.logo_url.substring(0, 80))

  // Try base64 conversion first
  const base64Logo = await imageUrlToBase64(profile.logo_url)

  if (base64Logo) {
    console.log('[image-utils] Logo successfully converted to base64, length:', base64Logo.length)
    return {
      ...profile,
      logo_url: base64Logo,
    }
  }

  // If base64 fails, keep the original URL - react-pdf can handle external URLs
  console.warn('[image-utils] Base64 conversion failed, using original URL')
  return profile
}
