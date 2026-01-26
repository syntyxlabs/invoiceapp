import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { imageUrlToBase64 } from '@/lib/pdf/image-utils'

// Debug endpoint to test logo URL fetching
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get default business profile
    const { data: profile, error: profileError } = await supabase
      .from('inv_business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({
        error: 'No default profile found',
        profileError,
      })
    }

    const logoUrl = profile.logo_url
    const debugInfo: Record<string, unknown> = {
      has_logo_url: !!logoUrl,
      logo_url: logoUrl,
      logo_url_length: logoUrl?.length || 0,
    }

    if (!logoUrl) {
      return NextResponse.json({ ...debugInfo, result: 'No logo URL' })
    }

    // Step 1: Try basic fetch
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(logoUrl, {
        signal: controller.signal,
        headers: { Accept: 'image/*' },
      })
      clearTimeout(timeoutId)

      debugInfo.fetch_status = response.status
      debugInfo.fetch_status_text = response.statusText
      debugInfo.fetch_ok = response.ok
      debugInfo.content_type = response.headers.get('content-type')
      debugInfo.content_length = response.headers.get('content-length')

      // Log all response headers
      const headers: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        headers[key] = value
      })
      debugInfo.all_headers = headers

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer()
        debugInfo.body_byte_length = arrayBuffer.byteLength

        if (arrayBuffer.byteLength > 0) {
          const base64 = Buffer.from(arrayBuffer).toString('base64')
          debugInfo.base64_length = base64.length
          debugInfo.base64_prefix = base64.substring(0, 40)

          const contentType = response.headers.get('content-type') || 'image/jpeg'
          const dataUrl = `data:${contentType};base64,${base64}`
          debugInfo.data_url_prefix = dataUrl.substring(0, 60)
          debugInfo.data_url_total_length = dataUrl.length
          debugInfo.starts_with_data_image = dataUrl.startsWith('data:image/')

          // Also test with imageUrlToBase64 function
          const result = await imageUrlToBase64(logoUrl)
          debugInfo.imageUrlToBase64_result = result ? `Success (${result.length} chars)` : 'Failed (null)'
        }
      } else {
        // Try reading error body
        const errorBody = await response.text()
        debugInfo.error_body = errorBody.substring(0, 500)
      }
    } catch (fetchError) {
      debugInfo.fetch_error = fetchError instanceof Error
        ? { name: fetchError.name, message: fetchError.message }
        : String(fetchError)
    }

    return NextResponse.json(debugInfo, {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
