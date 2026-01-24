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
    const response = await fetch(url)

    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`)
      return null
    }

    const contentType = response.headers.get('content-type') || 'image/png'
    const arrayBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    return `data:${contentType};base64,${base64}`
  } catch (error) {
    console.error('Error converting image to base64:', error)
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

  return {
    ...profile,
    logo_url: base64Logo,
  }
}
