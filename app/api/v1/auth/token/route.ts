/**
 * API route for authentication token
 * Handles login requests and forwards them to the backend
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { API_CONFIG } from '@/lib/config'

// Helper function to get backend URL
function getBackendUrl() {
  const backendUrl = API_CONFIG.BACKEND_URL
  return backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl
}

// POST /api/v1/auth/token
export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.text()
    
    // Log the request (without sensitive data)
    console.log('Auth token request received')
    
    // Get backend URL
    const backendUrl = getBackendUrl()
    const fullUrl = `${backendUrl}/api/v1/auth/token`
    
    console.log(`Forwarding auth request to: ${fullUrl}`)
    
    // Forward request to backend API with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    // Get the response data
    const data = await response.json()
    
    // Return the response
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error in auth token route:', error)
    
    // Return appropriate error response
    return new Response(
      JSON.stringify({ 
        error: 'Authentication failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
