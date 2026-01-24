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
    const response = await fetch(url)

    if (!response.ok) {
      console.error(`[image-utils] Failed to fetch image: ${response.status} ${response.statusText}`)
      return null
    }

    const contentType = response.headers.get('content-type') || 'image/png'
    const arrayBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    console.log(`[image-utils] Successfully converted image (${contentType}, ${arrayBuffer.byteLength} bytes)`)
    return `data:${contentType};base64,${base64}`
  } catch (error) {
    console.error('[image-utils] Error converting image to base64:', error)
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

  console.log('[image-utils] Processing business profile logo...')
  const base64Logo = await imageUrlToBase64(profile.logo_url)

  if (!base64Logo) {
    console.error('[image-utils] Failed to convert logo to base64, keeping original URL')
    return profile
  }

  console.log('[image-utils] Logo successfully converted to base64')
  return {
    ...profile,
    logo_url: base64Logo,
  }
}
