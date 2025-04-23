/**
 * API route for getting current user information
 * Forwards the request to the backend API
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { API_CONFIG } from '@/lib/config'

// Helper function to get backend URL
function getBackendUrl() {
  const backendUrl = API_CONFIG.BACKEND_URL
  return backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl
}

// GET /api/v1/auth/me
export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Get backend URL
    const backendUrl = getBackendUrl()
    const fullUrl = `${backendUrl}/api/v1/auth/me`
    
    console.log(`Forwarding auth/me request to: ${fullUrl}`)
    
    // Forward request to backend API with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    // Get the response data
    const data = await response.json()
    
    // Return the response
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error in auth/me route:', error)
    
    // Return appropriate error response
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get user information',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
